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
  const [previewNote, setPreviewNote] = useState<any>(null)
  const params = useParams()
  const topicId = params?.topicId as string

  async function handleUpload() {
    console.log('Upload button clicked');
    console.log('Current state - File:', file, 'Title:', title, 'TopicId:', topicId);

    if (!file) { 
      console.warn('Upload blocked: No file selected');
      setMessage('Please select a file first.'); 
      return 
    }
    if (!title.trim()) { 
      console.warn('Upload blocked: No title entered');
      setMessage('Please enter a note title.'); 
      return 
    }
    
    setUploading(true)
    setMessage('Uploading to storage...')
    console.log('Starting storage upload to bucket "notes-files"...');

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const path = `${topicId}/${fileName}`

    try {
      const { data, error: uploadError } = await supabase.storage
        .from('notes-files')
        .upload(path, file)

      if (uploadError) { 
        console.error('Storage Upload Error:', uploadError);
        setMessage('Upload error: ' + uploadError.message)
        setUploading(false)
        return 
      }

      console.log('Storage upload successful:', data);
      setMessage('Saving to database...')

      const { data: { publicUrl } } = supabase.storage
        .from('notes-files').getPublicUrl(path)

      console.log('Generated Public URL:', publicUrl);

      const isPdf = fileExt === 'pdf' || file.type === 'application/pdf'

      const { error: dbError } = await supabase.from('notes').insert({
        topic_id: topicId,
        title: title.trim(),
        file_url: publicUrl,
        file_type: isPdf ? 'pdf' : 'image'
      })

      if (dbError) {
        console.error('Database Insert Error:', dbError);
        setMessage('Database error: ' + dbError.message)
      } else { 
        console.log('Database insert successful!');
        setMessage('✅ Uploaded successfully!')
        setTitle('')
        setFile(null)
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      }
    } catch (err) {
      console.error('Unexpected error during upload:', err);
      setMessage('Unexpected error occurred. Check console.');
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', padding: '20px' }}>
      <div style={{ flex: '1 1 500px' }}>
        {/* Upload section */}
        <div style={{ marginBottom: 32, padding: 24, border: '1px solid #e5e5e5',
          borderRadius: 12, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Upload New Note</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 6, display: 'block' }}>NOTE TITLE</label>
              <input placeholder="e.g. Unit 1 Introduction" value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8,
                  border: '1px solid #ddd', fontSize: 14, outline: 'none' }} />
            </div>
            
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 6, display: 'block' }}>SELECT FILE (PDF or IMAGE)</label>
              <div style={{ padding: '20px', border: '2px dashed #eee', borderRadius: 8, textAlign: 'center', background: '#fafafa' }}>
                 <input type="file" accept=".pdf,image/*,application/pdf"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  style={{ fontSize: 13, width: '100%' }} />
              </div>
            </div>

            <button onClick={handleUpload} disabled={uploading}
              style={{ 
                padding: '14px', 
                borderRadius: 8, 
                background: '#111',
                color: '#fff', 
                cursor: 'pointer', 
                border: 'none', 
                fontWeight: 600,
                marginTop: 8,
                opacity: uploading ? 0.5 : 1,
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => !uploading && (e.currentTarget.style.background = '#333')}
              onMouseLeave={e => !uploading && (e.currentTarget.style.background = '#111')}>
              {uploading ? 'Processing...' : 'Upload Note'}
            </button>
            {message && (
              <p style={{ 
                fontSize: 13, 
                padding: '10px', 
                borderRadius: 6, 
                background: message.includes('✅') ? '#f0fdf4' : '#fef2f2',
                color: message.includes('✅') ? '#16a34a' : '#e53e3e', 
                fontWeight: 500,
                marginTop: 8
              }}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* List existing notes for this topic */}
        <CrudList
          table="notes"
          label="Note"
          nameField="title"
          filters={{ topic_id: params.topicId }}
          onSelect={(note) => setPreviewNote(note)}
        />
      </div>

      {/* Preview Section */}
      <div style={{ flex: '1 1 500px', minWidth: 350 }}>
        <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>In-Site Preview</h2>
        {previewNote ? (
          <div style={{ border: '1px solid #eee', borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontWeight: 600, fontSize: 14 }}>{previewNote.title}</span>
               <button onClick={() => setPreviewNote(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888' }}>Close</button>
            </div>
            <div style={{ background: '#f5f5f5' }}>
               {previewNote.file_type === 'pdf' ? (
                 <iframe
                   src={`${previewNote.file_url}#toolbar=0`}
                   style={{ width: '100%', height: '70vh', border: 'none' }}
                   title={previewNote.title}
                 />
               ) : (
                 <img src={previewNote.file_url} alt={previewNote.title}
                   style={{ width: '100%', height: 'auto', display: 'block' }} />
               )}
            </div>
          </div>
        ) : (
          <div style={{ padding: 60, textAlign: 'center', background: '#f9f9f9', borderRadius: 16, border: '1px solid #eee', color: '#888' }}>
             <p>Select a note from the list to preview it here.</p>
          </div>
        )}
      </div>
    </div>
  )
}