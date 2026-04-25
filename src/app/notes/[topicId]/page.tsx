// src/app/notes/[topicId]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import type { Note, Topic } from '@/types'

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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      // Fetch topic info and its unit
      const { data: t } = await supabase
        .from('topics')
        .select('*, units(id, title, course_id)')
        .eq('id', topicId)
        .single()
      
      if (t) {
        setTopic(t)
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
            Next Topic: {nextTopic.title} →
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
           <p style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{unit?.title}</p>
           <h1 style={{ fontSize: 24, fontWeight: 700 }}>{topic?.title}</h1>
        </div>

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
    </div>
  )
}