// src/app/admin/topics/[topicId]/page.tsx
'use client'
import { useState } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import { useParams } from 'next/navigation'
import CrudList from '../../../../components/admin/CrudList'

export default function TopicNotesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const params = useParams()
  const topicId = params?.topicId as string

  async function handleUpload() {
    if (!file || !title.trim()) return
    setUploading(true)
    setMessage('')

    const path = `${params.topicId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('notes-files')
      .upload(path, file)

    if (uploadError) { setMessage(uploadError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage
      .from('notes-files').getPublicUrl(path)

    const { error: dbError } = await supabase.from('notes').insert({
      topic_id: params.topicId,
      title,
      file_url: publicUrl,
      file_type: file.name.endsWith('.pdf') ? 'pdf' : 'image'
    })

    if (dbError) setMessage(dbError.message)
    else { setMessage('Uploaded successfully!'); setTitle(''); setFile(null) }
    setUploading(false)
  }

  return (
    <div>
      {/* Upload section */}
      <div style={{ marginBottom: 32, padding: 20, border: '1px solid #e5e5e5',
        borderRadius: 10, maxWidth: 580 }}>
        <h2 style={{ marginBottom: 16 }}>Upload Note</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Note title" value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6,
              border: '1px solid #ccc', fontSize: 14 }} />
          <input type="file" accept=".pdf,image/*"
            onChange={e => setFile(e.target.files?.[0] || null)} />
          <button onClick={handleUpload} disabled={uploading || !file || !title.trim()}
            style={{ padding: '8px 16px', borderRadius: 6, background: '#111',
              color: '#fff', cursor: 'pointer', border: 'none',
              opacity: uploading || !file || !title.trim() ? 0.5 : 1 }}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          {message && <p style={{ fontSize: 13, color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
        </div>
      </div>

      {/* List existing notes for this topic */}
      <CrudList
        table="notes"
        label="Note"
        nameField="title"
        filters={{ topic_id: params.topicId }}
      />
    </div>
  )
}