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

      // Fetch topic info
      const { data: t } = await supabase
        .from('topics')
        .select('*, units(id, title, course_id)')
        .eq('id', topicId)
        .single()
      setTopic(t)

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
        .eq('topic_id', params.topicId)
        .single()
      setCompleted(progress?.completed ?? false)

      setLoading(false)
    }
    load()
  }, [])

  async function markComplete() {
    if (!userId) return

    await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        topic_id: params.topicId,
        completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,topic_id' })

    setCompleted(true)
  }

  async function markIncomplete() {
    if (!userId) return

    await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        topic_id: params.topicId,
        completed: false,
        completed_at: null
      }, { onConflict: 'user_id,topic_id' })

    setCompleted(false)
  }

  if (loading) return <p style={{ padding: 32 }}>Loading...</p>

  const unit = (topic as any)?.units

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>

      {/* Breadcrumb */}
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        <span onClick={() => router.push(`/topics/${unit?.id}`)}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          {unit?.title}
        </span>
        {' → '}{topic?.title}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1>{topic?.title}</h1>

        {/* Mark done button */}
        {completed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#16a34a', fontWeight: 500, fontSize: 14 }}>
              ✓ Completed
            </span>
            <button onClick={markIncomplete}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13,
                border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
              Mark incomplete
            </button>
          </div>
        ) : (
          <button onClick={markComplete}
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: 14,
              background: '#111', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Mark as done ✓
          </button>
        )}
      </div>

      {notes.length === 0 && (
        <p style={{ color: '#888' }}>No notes uploaded for this topic yet.</p>
      )}

      {/* Note tabs if multiple notes */}
      {notes.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {notes.map(note => (
            <button key={note.id} onClick={() => setSelectedNote(note)}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13,
                border: '1px solid #e5e5e5', cursor: 'pointer',
                background: selectedNote?.id === note.id ? '#111' : '#fff',
                color: selectedNote?.id === note.id ? '#fff' : '#111' }}>
              {note.title}
            </button>
          ))}
        </div>
      )}

      {/* PDF / Image viewer */}
      {selectedNote && (
        <div style={{ border: '1px solid #e5e5e5', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: '#fafafa',
            borderBottom: '1px solid #e5e5e5', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{selectedNote.title}</span>
            <a href={selectedNote.file_url} target="_blank" rel="noreferrer"
              style={{ fontSize: 13, color: '#111', textDecoration: 'underline' }}>
              Open in new tab ↗
            </a>
          </div>

          {selectedNote.file_type === 'pdf' ? (
            <iframe
              src={selectedNote.file_url}
              style={{ width: '100%', height: '80vh', border: 'none' }}
              title={selectedNote.title}
            />
          ) : (
            <img src={selectedNote.file_url} alt={selectedNote.title}
              style={{ width: '100%', height: 'auto', display: 'block' }} />
          )}
        </div>
      )}
    </div>
  )
}