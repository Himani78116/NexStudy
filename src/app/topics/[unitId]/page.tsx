// src/app/topics/[unitId]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import type { Topic, Unit } from '@/types'

interface TopicWithStatus extends Topic {
  completed: boolean
  hasNotes: boolean
}

export default function TopicsPage() {
  const params = useParams()
  const unitId = params?.unitId as string
  const [unit, setUnit] = useState<Unit | null>(null)
  const [topics, setTopics] = useState<TopicWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: u } = await supabase
        .from('units')
        .select('*, courses(id, name, semester_id)')
        .eq('id', unitId)
        .single()
      setUnit(u)

      const { data: topicsData} = await supabase
        .from('topics')
        .select('*')
        .eq('unit_id', unitId)

      if (!topicsData) { setLoading(false); return }

      // For each topic check if user completed it and if it has notes
      const withStatus = await Promise.all(
        topicsData.map(async (topic) => {
          const { data: progress } = await supabase
            .from('user_progress')
            .select('completed')
            .eq('user_id', user.id)
            .eq('topic_id', topic.id)
            .single()

          const { count } = await supabase
            .from('notes')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.id)

          return {
            ...topic,
            completed: progress?.completed ?? false,
            hasNotes: (count ?? 0) > 0
          }
        })
      )

      setTopics(withStatus)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p style={{ padding: 32 }}>Loading...</p>

  const course = (unit as any)?.courses

  return (
    <div style={{ padding: 32, maxWidth: 700 }}>

      {/* Breadcrumb */}
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        <span onClick={() => router.push(`/units/${course?.id}`)}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          {course?.name}
        </span>
        {' → '}{unit?.title}
      </p>

      <h1 style={{ marginBottom: 24 }}>{unit?.title}</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topics.map(topic => (
          <div key={topic.id}
            onClick={() => router.push(`/notes/${topic.id}`)}
            style={{ padding: '14px 20px', borderRadius: 10,
              border: `1px solid ${topic.completed ? '#86efac' : '#e5e5e5'}`,
              cursor: 'pointer',
              background: topic.completed ? '#f0fdf4' : '#fff',
              display: 'flex', alignItems: 'center', gap: 12 }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = topic.completed ? '#4ade80' : '#111')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = topic.completed ? '#86efac' : '#e5e5e5')}>

            {/* Completion tick */}
            <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: topic.completed ? '#16a34a' : '#f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#fff' }}>
              {topic.completed ? '✓' : ''}
            </span>

            <span style={{ fontWeight: 500, flex: 1 }}>{topic.title}</span>

            {!topic.hasNotes && (
              <span style={{ fontSize: 11, color: '#aaa', background: '#f4f4f4',
                padding: '2px 8px', borderRadius: 99 }}>no notes yet</span>
            )}
            <span style={{ color: '#aaa', fontSize: 13 }}>→</span>
          </div>
        ))}

        {topics.length === 0 && (
          <p style={{ color: '#888' }}>No topics added for this unit yet.</p>
        )}
      </div>
    </div>
  )
}