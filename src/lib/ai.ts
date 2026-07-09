// src/lib/ai.ts
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

// Models available on Groq (as of latest)
const TEXT_MODEL = 'llama-3.3-70b-versatile'
const VISION_MODEL = 'llama-3.2-90b-vision-preview'

/**
 * Extract text content from a PDF file given its public URL.
 */
export async function extractPdfText(fileUrl: string): Promise<string> {
  // Validate URL
  if (!fileUrl || typeof fileUrl !== 'string') {
    console.warn('extractPdfText: Invalid fileUrl provided:', fileUrl)
    return '__EXTRACTION_ERR__:Invalid PDF URL'
  }

  try {
    // Fetch the PDF with a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    let response
    try {
      response = await fetch(fileUrl, { signal: controller.signal })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      console.warn(`PDF fetch failed: ${response.status} ${response.statusText} for ${fileUrl}`)
      return `__EXTRACTION_ERR__:Could not fetch PDF: HTTP ${response.status}`
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // pdf-parse v2.x exports { PDFParse } as a named export
    let PDFParse: any
    try {
      const mod = await import('pdf-parse')
      PDFParse = mod.PDFParse
    } catch (importErr: any) {
      console.error('pdf-parse import failed:', importErr?.message || importErr)
      return `__EXTRACTION_ERR__:PDF parser unavailable: ${importErr?.message || 'import failed'}`
    }

    if (!PDFParse) {
      return '[PDF parser not found]'
    }

    let parser: any
    try {
      parser = new PDFParse({ data: buffer })
    } catch (initErr: any) {
      console.error('PDFParse init failed:', initErr?.message || initErr)
      return `__EXTRACTION_ERR__:PDF parser init failed: ${initErr?.message || 'unknown error'}`
    }

    let result
    try {
      result = await parser.getText()
    } catch (parseErr: any) {
      console.error('PDF getText failed:', parseErr?.message || parseErr)
      return `__EXTRACTION_ERR__:PDF text extraction failed: ${parseErr?.message || 'unknown error'}`
    } finally {
      try { await parser.destroy() } catch { /* ignore cleanup errors */ }
    }

    const text = result?.text?.trim()
    if (!text) {
      console.warn(`No extractable text found in PDF: ${fileUrl}`)
      return '__EXTRACTION_ERR__:No extractable text in PDF'
    }
    return text
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
 * Generate a summary of all notes in a unit using Groq.
 * @param unitTitle - The title of the unit
 * @param notesContent - Array of { topicTitle, content } objects
 */
export async function generateSummary(
  unitTitle: string,
  notesContent: { topicTitle: string; content: string }[]
): Promise<string> {
  const context = notesContent
    .map(
      (n, i) =>
        `--- Topic: ${n.topicTitle} ---\n${n.content.slice(0, 8000)}`
    )
    .join('\n\n')

  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are an AI study assistant. Summarize the provided study notes comprehensively. ' +
          'Organize the summary by topics, highlight key concepts, and provide a concise overview ' +
          'of what was covered in this unit. Use clear headings and bullet points.',
      },
      {
        role: 'user',
        content: `Unit: ${unitTitle}\n\nHere are the notes from all topics in this unit:\n\n${context}`,
      },
    ],
    max_tokens: 4096,
    temperature: 0.3,
  })

  return response.choices[0]?.message?.content?.trim() || 'No summary generated.'
}

/**
 * Answer a student's question about a specific topic's notes using Groq.
 * @param topicTitle - The title of the topic
 * @param notesContent - Array of { noteTitle, content } objects
 * @param question - The student's question
 */
export async function answerDoubt(
  topicTitle: string,
  notesContent: { noteTitle: string; content: string }[],
  question: string
): Promise<string> {
  const context = notesContent
    .map(
      (n, i) =>
        `--- Note: ${n.noteTitle} ---\n${n.content.slice(0, 8000)}`
    )
    .join('\n\n')

  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are an AI tutor helping a student understand their study material. ' +
          'Answer the student\'s question based ONLY on the provided notes content. ' +
          'If the notes don\'t contain enough information to answer, say so clearly. ' +
          'Explain concepts in a clear, educational manner.',
      },
      {
        role: 'user',
        content: `Topic: ${topicTitle}\n\nNotes content:\n${context}\n\nStudent's question: ${question}`,
      },
    ],
    max_tokens: 2048,
    temperature: 0.3,
  })

  return response.choices[0]?.message?.content?.trim() || 'No answer generated.'
}
