// src/app/setup/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const [branches, setBranches] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedSem, setSelectedSem] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Fetch branches
      const { data: bData } = await supabase.from('branches').select('*').order('name')
      setBranches(bData ?? [])

      // Fetch current profile to pre-fill
      const { data: profile } = await supabase
        .from('profiles')
        .select('branch_id, semester_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        setSelectedBranch(profile.branch_id || '')
        setSelectedSem(profile.semester_id || '')
      }
      setLoading(false)
    }
    loadData()
  }, [router])

  useEffect(() => {
    if (!selectedBranch) {
      setSemesters([])
      return
    }
    supabase.from('semesters').select('*')
      .eq('branch_id', selectedBranch).order('number')
      .then(({ data }) => setSemesters(data ?? []))
  }, [selectedBranch])

  async function handleSave() {
    if (!selectedBranch || !selectedSem) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles')
      .upsert({ 
        id: user.id,
        branch_id: selectedBranch, 
        semester_id: selectedSem,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (error) {
      alert('Error saving profile: ' + error.message)
    } else {
      router.push('/dashboard')
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading...</div>

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#fafafa',
      padding: 20 
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: 400, 
        background: '#fff', 
        padding: 32, 
        borderRadius: 16, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #eee' 
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Set your path</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 32, textAlign: 'center' }}>
          Select your branch and semester to get personalized study notes.
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8 }}>BRANCH</label>
          <select 
            value={selectedBranch} 
            onChange={e => { setSelectedBranch(e.target.value); setSelectedSem('') }}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: 8, 
              border: '1px solid #ddd', 
              fontSize: 14,
              background: '#fff',
              outline: 'none'
            }}>
            <option value="">Select your branch...</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8 }}>SEMESTER</label>
          <select 
            value={selectedSem} 
            onChange={e => setSelectedSem(e.target.value)}
            disabled={!selectedBranch}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: 8, 
              border: '1px solid #ddd', 
              fontSize: 14,
              background: '#fff',
              opacity: selectedBranch ? 1 : 0.6,
              outline: 'none'
            }}>
            <option value="">Select your semester...</option>
            {semesters.map(s => (
              <option key={s.id} value={s.id}>Semester {s.number}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving || !selectedBranch || !selectedSem}
          style={{ 
            width: '100%', 
            padding: '14px', 
            background: '#111', 
            color: '#fff', 
            borderRadius: 10, 
            border: 'none', 
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
            opacity: (saving || !selectedBranch || !selectedSem) ? 0.7 : 1,
            transition: 'opacity 0.2s'
          }}>
          {saving ? 'Saving...' : 'Save and Continue'}
        </button>
        
        <p onClick={() => router.push('/dashboard')} 
          style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 16, cursor: 'pointer' }}>
          Cancel
        </p>
      </div>
    </div>
  )
}