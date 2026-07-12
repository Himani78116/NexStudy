// src/app/api/ai/doubt-solve/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { answerDoubt } from '@/lib/ai'

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

    // 2. Fetch all note titles for this topic
    const { data: notes, error: notesErr } = await supabase
      .from('notes')
      .select('title')
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

    // 3. Pass just the note titles to the AI (no need to extract full file content)
    const noteTitles = notes.map(n => n.title)

    // 4. Answer the doubt using topic name and note titles
    const answer = await answerDoubt(topic.name, noteTitles, question)

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
