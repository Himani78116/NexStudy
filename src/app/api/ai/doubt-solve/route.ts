// src/app/api/ai/doubt-solve/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { extractNoteContent, answerDoubt } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    const { topicId, question } = await req.json()

    if (!topicId || !question) {
      return NextResponse.json(
        { error: 'topicId and question are required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Verify user is authenticated
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch topic details
    const { data: topic, error: topicErr } = await supabase
      .from('topics')
      .select('name')
      .eq('id', topicId)
      .single()

    if (topicErr || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    // 2. Fetch all notes for this topic
    const { data: notes, error: notesErr } = await supabase
      .from('notes')
      .select('id, title, file_url, file_type')
      .eq('topic_id', topicId)

    if (notesErr) {
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    if (!notes || notes.length === 0) {
      return NextResponse.json(
        { error: 'No notes found for this topic. AI doubt solving requires notes to be uploaded first.' },
        { status: 404 }
      )
    }

    // 3. Extract text content from each note (in parallel)
    const notesContent = await Promise.all(
      notes.map(async (note) => {
        const content = await extractNoteContent(note.file_url, note.file_type)
        // Log a warning if extraction produced an error placeholder
        if (content.startsWith('__EXTRACTION_ERR__:')) {
          console.warn(`Note "${note.title}" (id=${note.id}) extraction error: ${content}`)
        }
        return {
          noteTitle: note.title,
          content,
        }
      })
    )

    // Check if ALL notes returned error content (no real content extracted)
    const hasRealContent = notesContent.some(n => !n.content.startsWith('__EXTRACTION_ERR__:'))
    if (!hasRealContent) {
      const sampleError = notesContent.find(n => n.content.startsWith('__EXTRACTION_ERR__:'))?.content || ''
      return NextResponse.json({
        error: `Could not extract readable content from any of the ${notes.length} note(s).`,
        details: notesContent.map(n => ({ title: n.noteTitle, status: n.content })),
      }, { status: 422 })
    }

    // 4. Answer the doubt
    const answer = await answerDoubt(topic.name, notesContent, question)

    return NextResponse.json({
      answer,
      topicTitle: topic.name,
    })
  } catch (err: any) {
    console.error('Doubt solve API error:', err)
    return NextResponse.json(
      { error: err?.message || String(err) || 'Internal server error' },
      { status: 500 }
    )
  }
}
