// src/app/api/ai/summarize/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { generateSummary } from '@/lib/ai'

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

    // 1. Fetch unit details (includes course_id for looking up the course name)
    const { data: unit, error: unitErr } = await supabase
      .from('units')
      .select('title, course_id')
      .eq('id', unitId)
      .single()

    if (unitErr || !unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    // 2. Fetch course name for context
    let courseName = ''
    if (unit.course_id) {
      const { data: course } = await supabase
        .from('courses')
        .select('name')
        .eq('id', unit.course_id)
        .single()
      if (course) courseName = course.name
    }

    // 3. Fetch all topics in this unit
    const { data: topics, error: topicsErr } = await supabase
      .from('topics')
      .select('name')
      .eq('unit_id', unitId)
      .order('order_index', { ascending: true })

    if (topicsErr) {
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: 'No topics found in this unit' }, { status: 404 })
    }

    const topicNames = topics.map(t => t.name)

    // 4. Generate summary using course name, unit title, and topic names
    const summary = await generateSummary(courseName, unit.title, topicNames)

    return NextResponse.json({
      summary,
      topicCount: topicNames.length,
    })
  } catch (err: any) {
    console.error('Summarize API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
