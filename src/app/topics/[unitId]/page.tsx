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
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!unitId) return

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // Fetch Unit (simple query, FK join to courses does not exist in DB)
        const { data: u, error: unitError } = await supabase
          .from('units')
          .select('*')
          .eq('id', unitId)
          .maybeSingle()

        if (unitError) {
          console.log('Unit Fetch Error Full:', JSON.stringify(unitError, null, 2))
          console.log(unitError)
          setErrorInfo(unitError.message)
          setLoading(false)
          return
        }

        if (!u) {
          setErrorInfo('Unit not found')
          setLoading(false)
          return
        }

        // Fetch course info separately for breadcrumb
        const { data: courseInfo } = await supabase
          .from('courses')
          .select('id, name')
          .eq('id', u.course_id)
          .maybeSingle()

        setUnit({
          ...u,
          courses: courseInfo || null
        })

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

  async function handleSummarize() {
    setSummarizing(true)
    setSummaryError(null)
    setSummary(null)
    setShowSummary(true)

    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSummaryError(data.error || 'Failed to generate summary')
      } else {
        setSummary(data.summary)
      }
    } catch (err: any) {
      setSummaryError(err.message || 'Network error')
    } finally {
      setSummarizing(false)
    }
  }

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>{unit?.title}</h1>
        <button
          onClick={handleSummarize}
          disabled={summarizing}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: summarizing ? '#888' : '#7c3aed',
            color: '#fff',
            border: 'none',
            cursor: summarizing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            if (!summarizing) e.currentTarget.style.background = '#6d28d9'
          }}
          onMouseLeave={e => {
            if (!summarizing) e.currentTarget.style.background = '#7c3aed'
          }}
        >
          {summarizing ? '🤖 Summarizing...' : '🤖 Summarize'}
        </button>
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowSummary(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 720,
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: '#fff',
                zIndex: 1,
                borderRadius: '16px 16px 0 0',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 18 }}>
                📝 AI Summary — {unit?.title}
              </span>
              <button
                onClick={() => setShowSummary(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 20,
                  color: '#888',
                  padding: '4px 8px',
                  borderRadius: 4,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              {summarizing ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{
                    width: 40, height: 40,
                    border: '3px solid #eee',
                    borderTopColor: '#7c3aed',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px',
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <p style={{ color: '#888' }}>Analyzing all notes in this unit...</p>
                  <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Extracting text from PDFs and images</p>
                </div>
              ) : summaryError ? (
                <div style={{
                  padding: 20,
                  background: '#fef2f2',
                  borderRadius: 12,
                  color: '#e53e3e',
                  textAlign: 'center',
                }}>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Failed to generate summary</p>
                  <p style={{ fontSize: 14 }}>{summaryError}</p>
                  <p style={{ fontSize: 13, color: '#888', marginTop: 12 }}>
                    Make sure your GROQ_API_KEY is set in .env.local and that the unit has notes uploaded.
                  </p>
                </div>
              ) : (
                <div style={{ lineHeight: 1.7, fontSize: 15, color: '#333', whiteSpace: 'pre-wrap' }}>
                  {(summary || '').split('\n').map((line, i) => {
                    if (line.startsWith('#')) {
                      return (
                        <h3 key={i} style={{ fontSize: 17, fontWeight: 700, marginTop: 20, marginBottom: 8, color: '#111' }}>
                          {line.replace(/^#+\s*/, '')}
                        </h3>
                      )
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <p key={i} style={{ fontWeight: 700, marginTop: 16, marginBottom: 4, fontSize: 15 }}>
                          {line.replace(/^\*\*/, '').replace(/\*\*$/, '')}
                        </p>
                      )
                    }
                    if (line.trim().startsWith('-')) {
                      return (
                        <li key={i} style={{ marginLeft: 20, color: '#444', listStyle: 'disc' }}>
                          {line.replace(/^-\s*/, '')}
                        </li>
                      )
                    }
                    if (line.trim() === '') {
                      return <br key={i} />
                    }
                    return (
                      <p key={i} style={{ marginBottom: 8 }}>
                        {line}
                      </p>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

            <span style={{ fontWeight: 500, flex: 1, color: '#111' }}>{topic.name}</span>

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
