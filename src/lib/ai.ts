// src/lib/ai.ts
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

// Models available on Groq (as of latest)
const TEXT_MODEL = 'openai/gpt-oss-120b'
const VISION_MODEL = 'llama-3.2-90b-vision-preview'

/**
 * Extract text content from a PDF file given its public URL.
 * Strategy:
 *   1. Use pdfjs-dist legacy build to extract selectable text (fast, no deps).
 *   2. If no selectable text, render pages as images via @napi-rs/canvas and
 *      use Groq vision API to describe each page (handles scanned PDFs).
 */
export async function extractPdfText(fileUrl: string): Promise<string> {
  if (!fileUrl || typeof fileUrl !== 'string') {
    console.warn('extractPdfText: Invalid fileUrl provided:', fileUrl)
    return '__EXTRACTION_ERR__:Invalid PDF URL'
  }

  try {
    // ── 1. Fetch the PDF bytes ──
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    let response: Response
    try {
      response = await fetch(fileUrl, { signal: controller.signal })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      console.warn(`PDF fetch failed: ${response.status} for ${fileUrl}`)
      return `__EXTRACTION_ERR__:Could not fetch PDF: HTTP ${response.status}`
    }

    const arrayBuffer = await response.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)

    // ── 2. Load pdfjs-dist legacy build (Node.js compatible) ──
    let pdfjsLib: any
    try {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    } catch (importErr: any) {
      console.error('pdfjs-dist import failed:', importErr?.message || importErr)
      return `__EXTRACTION_ERR__:PDF parser unavailable: ${importErr?.message || 'import failed'}. Make sure pdfjs-dist is installed and in serverExternalPackages in next.config.ts.`
    }

    if (!pdfjsLib?.getDocument) {
      return '__EXTRACTION_ERR__:PDF parser invalid (no getDocument)'
    }

    // Set up the worker from the local legacy worker file
    try {
      const { createRequire } = await import('node:module')
      const { pathToFileURL } = await import('node:url')
      const _require = createRequire(import.meta.url || '/')
      const workerPath = _require.resolve('pdfjs-dist/legacy/build/pdf.worker.min.mjs')
      pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href
    } catch (workerSetupErr: any) {
      console.warn('PDF worker setup failed (will try without worker):', workerSetupErr?.message)
      pdfjsLib.GlobalWorkerOptions.workerSrc = ''
    }

    // ── 3. Load the document ──
    let doc: any
    try {
      const loadingTask = pdfjsLib.getDocument({ data })
      doc = await loadingTask.promise
    } catch (loadErr: any) {
      console.error('pdfjs getDocument failed:', loadErr?.message || loadErr)
      return `__EXTRACTION_ERR__:PDF load failed: ${loadErr?.message || 'unknown error'}`
    }

    // ── 4. Try extracting selectable text ──
    const pageTexts: string[] = []
    try {
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items
          .map((item: any) => item.str || '')
          .join(' ')
        pageTexts.push(pageText)
        page.cleanup()
      }
    } catch (extractErr: any) {
      console.error('pdfjs text extraction failed:', extractErr?.message || extractErr)
      try { await doc.destroy() } catch {}
      return `__EXTRACTION_ERR__:PDF text extraction failed: ${extractErr?.message || 'unknown error'}`
    }

    const fullText = pageTexts.join('\n\n').trim()

    // If we got text, return it immediately
    if (fullText) {
      try { await doc.destroy() } catch {}
      return fullText
    }

    // ── 5. No selectable text → render pages as images via @napi-rs/canvas ──
    console.warn(`No selectable text in PDF: ${fileUrl}, rendering pages with canvas...`)
    const pageDescriptions: string[] = []
    try {
      const { createCanvas } = await import('@napi-rs/canvas')

      // Limit to first 5 pages to stay within Groq token/rate limits
      const pagesToRender = Math.min(doc.numPages, 5)

      for (let i = 1; i <= pagesToRender; i++) {
        const page = await doc.getPage(i)
        const viewport = page.getViewport({ scale: 1.5 })

        const canvas = createCanvas(viewport.width, viewport.height)
        const ctx = canvas.getContext('2d')

        const renderContext = {
          canvasContext: ctx as unknown as any,
          viewport,
        }

        await page.render(renderContext).promise
        page.cleanup()

        // Convert canvas to PNG data URL
        const pngBuffer = canvas.toBuffer('image/png')
        const base64 = pngBuffer.toString('base64')
        const dataUrl = `data:image/png;base64,${base64}`

        // Send rendered page image to Groq vision model
        const description = await describeImage(dataUrl)
        pageDescriptions.push(`--- Page ${i} ---\n${description}`)
      }

      if (doc.numPages > 5) {
        pageDescriptions.push(`\n--- Plus ${doc.numPages - 5} more page(s) not rendered ---`)
      }
    } catch (renderErr: any) {
      console.error('PDF page rendering failed:', renderErr?.message || renderErr)
      try { await doc.destroy() } catch {}
      return `__EXTRACTION_ERR__:PDF vision extraction failed: ${renderErr?.message || 'unknown error'}`
    } finally {
      try { await doc.destroy() } catch {}
    }

    const combined = pageDescriptions.join('\n\n').trim()
    if (!combined) {
      return '__EXTRACTION_ERR__:No extractable text in PDF'
    }
    return combined
  } catch (err: any) {
    console.error('PDF extraction error for', fileUrl, ':', err?.message || err)
    return `__EXTRACTION_ERR__:PDF extract error: ${err?.name || 'unknown'}`
  }
}

/**
 * Describe an image using Groq's vision model.
 * Returns a textual description of what's in the image.
 */
export async function describeImage(fileUrl: string): Promise<string> {
  try {
    console.log('Describing image:', fileUrl)
    const response = await groq.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe the content of this image in detail. Extract any text visible in the image. This is a study note page.',
            },
            { type: 'image_url', image_url: { url: fileUrl } },
          ],
        },
      ],
      max_tokens: 1024,
    })

    const description = response.choices[0]?.message?.content?.trim()
    if (!description) {
      console.warn('No description generated for image:', fileUrl)
      return '__EXTRACTION_ERR__:No description generated'
    }
    return description
  } catch (err) {
    console.error('Image description error for', fileUrl, ':', err)
    return '__EXTRACTION_ERR__:Error describing image'
  }
}

/**
 * Extract text from a note (PDF or image) given its file_url and file_type.
 */
export async function extractNoteContent(
  fileUrl: string,
  fileType: string | null | undefined
): Promise<string> {
  const type = (fileType || '').toLowerCase()
  console.log(`extractNoteContent: type=${type}, url=${String(fileUrl).substring(0, 100)}`)

  if (!fileUrl) {
  console.warn('extractNoteContent: empty fileUrl')
  return '__EXTRACTION_ERR__:No file URL'
  }

  if (type === 'pdf') {
    return extractPdfText(fileUrl)
  }
  if (type === 'image') {
    return describeImage(fileUrl)
  }

  // If file_type is missing or 'link', try to detect from the URL extension
  if (fileUrl.match(/\.pdf(\?|#|$)/i)) {
    console.log(`extractNoteContent: detected PDF from URL extension for ${fileUrl.substring(0, 80)}`)
    return extractPdfText(fileUrl)
  }
  if (fileUrl.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?|#|$)/i)) {
    console.log(`extractNoteContent: detected image from URL extension for ${fileUrl.substring(0, 80)}`)
    return describeImage(fileUrl)
  }

  console.warn(`extractNoteContent: unknown file_type '${fileType}' for ${fileUrl.substring(0, 80)}`)
  return `__EXTRACTION_ERR__:Unsupported file type: ${fileType || 'unknown'}`
}

/**
 * Generate a summary of a unit using Groq.
 * Uses course name, unit title, and topic names to produce a relevant summary.
 * @param courseName - The name of the course
 * @param unitTitle - The title of the unit
 * @param topicNames - Array of topic names in this unit
 */
export async function generateSummary(
  courseName: string,
  unitTitle: string,
  topicNames: string[]
): Promise<string> {
  const topicsList = topicNames.map((t, i) => `${i + 1}. ${t}`).join('\n')

  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are an AI study assistant. Generate a comprehensive and detailed summary ' +
          'for the given unit. Use the course name, unit title, and list of topic titles to provide ' +
          'a thorough overview. Explain in detail what each topic likely covers based on your general knowledge. ' +
          'Include key concepts, important subtopics, and the significance of each topic. ' +
          'Organize the summary with clear headings for each topic. Be thorough and educational.',
      },
      {
        role: 'user',
        content:
          `Course: ${courseName || 'N/A'}\n` +
          `Unit: ${unitTitle}\n\n` +
          `Topics covered in this unit:\n${topicsList}\n\n` +
          `Please provide a detailed, comprehensive summary of this unit, explaining each topic thoroughly.`,
      },
    ],
    max_tokens: 4096,
    temperature: 0.3,
  })

  return response.choices[0]?.message?.content?.trim() || 'No summary generated.'
}

/**
 * Answer a student's question about a specific topic using Groq.
 * Uses only the note titles (not full file content) to provide context.
 * @param topicTitle - The title of the topic
 * @param noteTitles - Array of note titles for this topic
 * @param question - The student's question
 */
export async function answerDoubt(
  topicTitle: string,
  noteTitles: string[],
  question: string
): Promise<string> {
  const notesList = noteTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')

  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are an AI tutor helping a student understand their study material. ' +
          'The student is studying a topic and has a set of notes with the following titles. ' +
          'Based on the topic name and note titles, help answer the student\'s question. ' +
          'Use your general knowledge about the subject to provide a helpful, educational answer. ' +
          'If you are unsure about something, say so clearly. ' +
          'Explain concepts in a clear, educational manner.',
      },
      {
        role: 'user',
        content: `Topic: ${topicTitle}\n\nAvailable notes for this topic:\n${notesList}\n\nStudent's question: ${question}`,
      },
    ],
    max_tokens: 2048,
    temperature: 0.3,
  })

  return response.choices[0]?.message?.content?.trim() || 'No answer generated.'
}
