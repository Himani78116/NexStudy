// src/app/api/ai/summarize/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { extractNoteContent, generateSummary } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    const { unitId } = await req.json()
    if (!unitId) {
      return NextResponse.json({ error: 'unitId is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    // Verify user is authenticated
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch unit details
    const { data: unit, error: unitErr } = await supabase
      .from('units')
      .select('title')
      .eq('id', unitId)
      .single()

    if (unitErr || !unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    // 2. Fetch all topics in this unit
    const { data: topics, error: topicsErr } = await supabase
      .from('topics')
      .select('id, name')
      .eq('unit_id', unitId)
      .order('order_index', { ascending: true })

    if (topicsErr) {
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: 'No topics found in this unit' }, { status: 404 })
    }

    const topicIds = topics.map((t) => t.id)

    // 3. Fetch all notes for these topics
    const { data: notes, error: notesErr } = await supabase
      .from('notes')
      .select('id, title, topic_id, file_url, file_type')
      .in('topic_id', topicIds)

    if (notesErr) {
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    if (!notes || notes.length === 0) {
      return NextResponse.json({ error: 'No notes found in this unit' }, { status: 404 })
    }

    // 4. Extract text content from each note
    // Group notes by topic
    const notesByTopic = new Map<string, { topicTitle: string; content: string }[]>()
    for (const note of notes) {
      const topic = topics.find((t) => t.id === note.topic_id)
      const topicTitle = topic?.name || 'Unknown Topic'

      const content = await extractNoteContent(note.file_url, note.file_type as 'pdf' | 'image' | 'link')

      if (!notesByTopic.has(note.topic_id)) {
        notesByTopic.set(note.topic_id, [])
      }
      notesByTopic.get(note.topic_id)!.push({ topicTitle, content })
    }

    // Merge all content per topic
    const notesContent: { topicTitle: string; content: string }[] = []
    for (const [, topicNotes] of notesByTopic) {
      const combinedContent = topicNotes.map((n) => n.content).join('\n\n')
      notesContent.push({
        topicTitle: topicNotes[0].topicTitle,
        content: combinedContent,
      })
    }

    // 5. Generate summary
    const summary = await generateSummary(unit.title, notesContent)

    return NextResponse.json({
      summary,
      topicCount: topics.length,
      noteCount: notes.length,
    })
  } catch (err: any) {
    console.error('Summarize API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
