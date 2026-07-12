// src/app/notes/[topicId]/page.tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import type { Note, Topic } from '@/types'

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
}

export default function NotesPage() {
  const params = useParams()
  const topicId = params?.topicId as string
  const [topic, setTopic] = useState<Topic | null>(null)
  const [allTopics, setAllTopics] = useState<Topic[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [completed, setCompleted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // AI Doubt Solver state
  const [showDoubtSolver, setShowDoubtSolver] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [doubtQuestion, setDoubtQuestion] = useState('')
  const [doubtLoading, setDoubtLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      // Fetch topic info (FK join to units does not exist in DB)
      const { data: t } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single()
      
      if (t) {
        // Fetch unit info separately
        const { data: u } = await supabase
          .from('units')
          .select('id, title, course_id')
          .eq('id', t.unit_id)
          .single()

        setTopic({
          ...t,
          units: u || null
        })

        // Fetch all topics in this unit to find the next one
        const { data: unitTopics } = await supabase
          .from('topics')
          .select('*')
          .eq('unit_id', t.unit_id)
          .order('order_index', { ascending: true })
        setAllTopics(unitTopics ?? [])
      }

      // Fetch notes for this topic
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at')
      setNotes(notesData ?? [])
      if (notesData && notesData.length > 0) setSelectedNote(notesData[0])

      // Check if user already completed this topic
      const { data: progress } = await supabase
        .from('user_progress')
        .select('completed')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .maybeSingle()
      
      setCompleted(progress?.completed ?? false)
      setLoading(false)
    }
    load()
  }, [topicId, router])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function toggleComplete() {
    if (!userId || !topicId) return

    const newState = !completed
    
    // Explicitly check for existence first to handle potential unique constraint issues
    const { data: existing } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .maybeSingle()

    let error;
    if (existing) {
      const { error: updateError } = await supabase
        .from('user_progress')
        .update({
          completed: newState,
          completed_at: newState ? new Date().toISOString() : null
        })
        .eq('id', existing.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          topic_id: topicId,
          completed: newState,
          completed_at: newState ? new Date().toISOString() : null
        })
      error = insertError
    }

    if (error) {
      console.error('Error updating progress:', error)
      alert('Failed to update progress. Please check database constraints.')
    } else {
      setCompleted(newState)
    }
  }

  async function handleAskDoubt() {
    if (!doubtQuestion.trim()) return

    const userQuestion = doubtQuestion.trim()
    setDoubtQuestion('')
    setChatMessages(prev => [...prev, { role: 'user', content: userQuestion }])
    setDoubtLoading(true)

    try {
      const res = await fetch('/api/ai/doubt-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, question: userQuestion }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Show details (specific extraction error) if available
        const detailMsg = data.details
          ? data.details.map((d: any) => `${d.title}: ${d.status}`).join('\n')
          : ''
        const fullMsg = '❌ ' + data.error + (detailMsg ? '\n\n' + detailMsg : '')
        setChatMessages(prev => [...prev, { role: 'ai', content: fullMsg }])
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', content: data.answer }])
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'ai', content: '❌ Network error. Please try again.' }])
    } finally {
      setDoubtLoading(false)
    }
  }

  const currentIndex = allTopics.findIndex(t => t.id === topicId)
  const nextTopic = currentIndex !== -1 && currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading notes...</div>

  const unit = (topic as any)?.units

  return (
    <div style={{ padding: '32px 20px', maxWidth: 1000, margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => router.back()} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Back
        </button>
        
        {nextTopic && completed && (
          <button onClick={() => router.push(`/notes/${nextTopic.id}`)}
            style={{ 
              background: '#111', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, 
              cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 
            }}>
            Next Topic: {nextTopic.name} →
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
           <p style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{unit?.title}</p>
           <h1 style={{ fontSize: 24, fontWeight: 700 }}>{topic?.name}</h1>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {notes.length > 0 && (
            <button onClick={() => setShowDoubtSolver(true)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: '#7c3aed',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#6d28d9')}
              onMouseLeave={e => (e.currentTarget.style.background = '#7c3aed')}
            >
              🤖 Ask AI
            </button>
          )}
          <button onClick={toggleComplete}
            style={{ 
              padding: '10px 20px', 
              borderRadius: 8, 
              fontSize: 14, 
              fontWeight: 600,
              transition: 'all 0.2s ease',
              background: completed ? '#f0fdf4' : '#111', 
              color: completed ? '#16a34a' : '#fff', 
              border: completed ? '1px solid #86efac' : 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
            {completed ? '✓ Completed' : 'Mark as done'}
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: '#f9f9f9', borderRadius: 12, color: '#888' }}>
          No notes uploaded for this topic yet.
        </div>
      ) : (
        <>
          {/* Note Selection Tabs */}
          {notes.length > 1 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
              {notes.map(note => (
                <button key={note.id} onClick={() => setSelectedNote(note)}
                  style={{ 
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
                    border: '1px solid #eee', cursor: 'pointer',
                    background: selectedNote?.id === note.id ? '#111' : '#fff',
                    color: selectedNote?.id === note.id ? '#fff' : '#111' 
                  }}>
                  {note.title}
                </button>
              ))}
            </div>
          )}

          {/* Viewer */}
          {selectedNote && (
            <div style={{ border: '1px solid #eee', borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ padding: '14px 20px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 20 }}>{selectedNote.title}</span>
              </div>

              <div style={{ background: '#fff', display: 'flex', justifyContent: 'center', minHeight: '60vh' }}>
                {selectedNote.file_type === 'pdf' ? (
                  <iframe
                    src={selectedNote.file_url}
                    style={{ width: '100%', height: '85vh', border: 'none' }}
                    title={selectedNote.title}
                    key={selectedNote.id}
                  />
                ) : (
                  <div style={{ padding: 20, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img 
                      src={selectedNote.file_url} 
                      alt={selectedNote.title}
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                      onError={(e) => {
                        console.error('Image failed to load:', selectedNote.file_url);
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) parent.innerHTML += '<p style="color:red;padding:20px;">Image failed to load. Please check if your Supabase bucket "notes-files" is set to PUBLIC.</p>';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* AI Doubt Solver Modal */}
      {showDoubtSolver && (
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
          onClick={() => setShowDoubtSolver(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 640,
              width: '100%',
              height: '75vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fff',
                flexShrink: 0,
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: 16 }}>🤖 AI Doubt Solver</span>
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Ask questions about {topic?.name}</p>
              </div>
              <button
                onClick={() => setShowDoubtSolver(false)}
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

            {/* Chat Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 24px',
                background: '#fafafa',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  <p style={{ fontSize: 28, marginBottom: 12 }}>🤔</p>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Got a doubt?</p>
                  <p style={{ fontSize: 14 }}>
                    Ask any question about this topic and the AI will answer based on the notes.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      maxWidth: '90%',
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {msg.role === 'ai' && (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#7c3aed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        AI
                      </div>
                    )}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 12,
                        fontSize: 14,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        background: msg.role === 'user' ? '#7c3aed' : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#333',
                        border: msg.role === 'ai' ? '1px solid #eee' : 'none',
                        boxShadow: msg.role === 'ai' ? '0 2px 4px rgba(0,0,0,0.04)' : 'none',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {doubtLoading && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', alignSelf: 'flex-start' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    AI
                  </div>
                  <div
                    style={{
                      padding: '12px 20px',
                      borderRadius: 12,
                      background: '#fff',
                      border: '1px solid #eee',
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    <div style={{
                      width: 8, height: 8,
                      borderRadius: '50%',
                      background: '#7c3aed',
                      animation: 'doubtBounce 1s infinite 0s',
                    }} />
                    <div style={{
                      width: 8, height: 8,
                      borderRadius: '50%',
                      background: '#7c3aed',
                      animation: 'doubtBounce 1s infinite 0.2s',
                    }} />
                    <div style={{
                      width: 8, height: 8,
                      borderRadius: '50%',
                      background: '#7c3aed',
                      animation: 'doubtBounce 1s infinite 0.4s',
                    }} />
                    <style>{`
                      @keyframes doubtBounce {
                        0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
                        40% { opacity: 1; transform: translateY(-4px); }
                      }
                    `}</style>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid #eee',
                background: '#fff',
                display: 'flex',
                gap: 12,
                flexShrink: 0,
              }}
            >
              <input
                value={doubtQuestion}
                onChange={e => setDoubtQuestion(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAskDoubt()
                  }
                }}
                placeholder="Type your question about this topic..."
                disabled={doubtLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #ddd',
                  fontSize: 14,
                  outline: 'none',
                  background: doubtLoading ? '#f5f5f5' : '#fff',
                }}
              />
              <button
                onClick={handleAskDoubt}
                disabled={doubtLoading || !doubtQuestion.trim()}
                style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  background: doubtLoading || !doubtQuestion.trim() ? '#ccc' : '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  cursor: doubtLoading || !doubtQuestion.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                Ask
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}