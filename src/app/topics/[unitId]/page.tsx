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
  const [unit, setUnit] = useState<any>(null)
  const [topics, setTopics] = useState<TopicWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [errorInfo, setErrorInfo] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!unitId) return

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // Fetch Unit with Course info
        const { data: u, error: unitError } = await supabase
          .from('units')
          .select('*, courses:course_id(id, name, semester_id)')
          .eq('id', unitId)
          .maybeSingle()
        
        if (unitError) {
          console.log('Unit Fetch Error Full:', JSON.stringify(unitError, null, 2))
          console.log(unitError)
          const { data: simpleUnit } = await supabase
            .from('units')
            .select('*')
            .eq('id', unitId)
            .maybeSingle()
          setUnit(simpleUnit)
        } else {
          setUnit(u)
        }

        // Fetch Topics
        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('*')
          .eq('unit_id', unitId)
          .order('order_index', { ascending: true })

        if (topicsError) {
          console.error('Topics Fetch Error:', topicsError)
          setErrorInfo(topicsError.message)
          setLoading(false)
          return
        }

        if (!topicsData || topicsData.length === 0) {
          setTopics([])
          setLoading(false)
          return
        }

        const topicIds = topicsData.map(t => t.id)

        // 1. Fetch completion status
        let completedTopicIds = new Set<string>()
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('topic_id')
          .eq('user_id', user.id)
          .eq('completed', true)
          .in('topic_id', topicIds)
        
        if (progressError) console.error('Progress Error:', progressError)
        if (progressData) {
          completedTopicIds = new Set(progressData.map(p => p.topic_id))
        }

        // 2. Fetch note availability
        let noteTopicIds = new Set<string>()
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('topic_id')
          .in('topic_id', topicIds)
        
        if (notesError) console.error('Notes Error:', notesError)
        if (notesData) {
          noteTopicIds = new Set(notesData.map(n => n.topic_id))
        }

        const withStatus = topicsData.map(topic => ({
          ...topic,
          completed: completedTopicIds.has(topic.id),
          hasNotes: noteTopicIds.has(topic.id)
        }))

        setTopics(withStatus)
      } catch (err: any) {
        console.error('Critical Error in Topics:', err)
        setErrorInfo(err.message || JSON.stringify(err, null, 2))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [unitId, router])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading topics...</div>

  if (errorInfo) return (
    <div style={{ padding: 40, color: 'red', textAlign: 'center' }}>
      <p>Error loading topics: {errorInfo}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 16 }}>Retry</button>
    </div>
  )

  const course = unit?.courses

  return (
    <div style={{ padding: '32px 20px', maxWidth: 700, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: '#888', marginBottom: 24, display: 'flex', gap: 6 }}>
        {course && (
          <>
            <span onClick={() => router.push(`/units/${course.id}`)}
              style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              {course.name}
            </span>
            <span>→</span>
          </>
        )}
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 24 }}>{unit?.title}</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topics.map(topic => (
          <div key={topic.id}
            onClick={() => router.push(`/notes/${topic.id}`)}
            style={{ 
              padding: '14px 20px', borderRadius: 12,
              border: `1px solid ${topic.completed ? '#86efac' : '#e5e5e5'}`,
              cursor: 'pointer',
              background: topic.completed ? '#f0fdf4' : '#fff',
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = topic.completed ? '#4ade80' : '#111')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = topic.completed ? '#86efac' : '#e5e5e5')}>

            {/* Completion tick */}
            <span style={{ 
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: topic.completed ? '#16a34a' : '#f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#fff' 
            }}>
              {topic.completed ? '✓' : ''}
            </span>

            <span style={{ fontWeight: 500, flex: 1, color: '#111' }}>{topic.title}</span>

            {!topic.hasNotes && (
              <span style={{ fontSize: 11, color: '#888', background: '#f4f4f4',
                padding: '2px 8px', borderRadius: 99, fontWeight: 500 }}>no notes yet</span>
            )}
            <span style={{ color: '#ccc', fontSize: 14 }}>→</span>
          </div>
        ))}

        {topics.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f9f9f9', borderRadius: 16 }}>
            <p style={{ color: '#888' }}>No topics added for this unit yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
