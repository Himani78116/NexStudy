// src/app/admin/branches/[branchId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabaseClient'
import type { Branch, Semester } from '@/types'

interface LinkedSemester {
  id: string // branch_semesters.id
  semester_id: string
  number: number
}

export default function BranchSemestersPage() {
  const router = useRouter()
  const params = useParams()
  const branchId = params.branchId as string

  const [branch, setBranch] = useState<Branch | null>(null)
  const [linkedSemesters, setLinkedSemesters] = useState<LinkedSemester[]>([])
  const [availableSemesters, setAvailableSemesters] = useState<Semester[]>([])
  const [selectedSemId, setSelectedSemId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      // 1. Fetch branch details
      const { data: bData, error: bErr } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId)
        .single()
      if (bErr) throw bErr
      setBranch(bData)

      // 2. Fetch linked semesters
      const { data: bsData, error: bsErr } = await supabase
        .from('branch_semesters')
        .select(`
          id,
          semester_id,
          semesters (
            id,
            number
          )
        `)
        .eq('branch_id', branchId)
      if (bsErr) throw bsErr

      const linked = (bsData ?? [])
        .filter(item => item.semesters !== null)
        .map(item => ({
          id: item.id,
          semester_id: item.semester_id,
          number: (item.semesters as any).number
        }))
        .sort((a, b) => a.number - b.number)
      setLinkedSemesters(linked)

      // 3. Fetch all global semesters to find the unlinked ones
      const { data: allSems, error: semErr } = await supabase
        .from('semesters')
        .select('*')
        .order('number')
      if (semErr) throw semErr

      const linkedIds = new Set(linked.map(l => l.semester_id))
      const available = (allSems ?? []).filter(s => !linkedIds.has(s.id))
      setAvailableSemesters(available)
      if (available.length > 0) {
        setSelectedSemId(available[0].id)
      } else {
        setSelectedSemId('')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load semesters.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (branchId) {
      loadData()
    }
  }, [branchId])

  async function handleLinkSemester() {
    if (!selectedSemId) return
    setError('')
    try {
      const { error: insErr } = await supabase
        .from('branch_semesters')
        .insert({
          branch_id: branchId,
          semester_id: selectedSemId
        })
      if (insErr) throw insErr
      await loadData()
    } catch (e: any) {
      setError(e.message || 'Failed to link semester.')
    }
  }

  async function handleUnlinkSemester(branchSemId: string) {
    if (!confirm('Are you sure you want to remove this semester from this branch? All course associations for this branch-semester will also be affected.')) return
    setError('')
    try {
      const { error: delErr } = await supabase
        .from('branch_semesters')
        .delete()
        .eq('id', branchSemId)
      if (delErr) throw delErr
      await loadData()
    } catch (e: any) {
      setError(e.message || 'Failed to remove semester.')
    }
  }

  if (loading) return <p style={{ padding: 32, color: '#666' }}>Loading Semesters...</p>

  return (
    <div style={{ maxWidth: 700 }}>
      {/* Breadcrumb */}
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        <span onClick={() => router.push('/admin/branches')}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          Branches
        </span>
        {' → '}{branch?.name}
      </p>

      <h1 style={{ marginBottom: 8, fontSize: 28, fontWeight: 700 }}>Semesters</h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        Manage semesters for {branch?.name} ({branch?.code})
      </p>

      {error && (
        <p style={{ color: '#e53e3e', background: '#fef2f2', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {error}
        </p>
      )}

      {/* Link Semester Form */}
      {availableSemesters.length > 0 ? (
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, alignItems: 'center' }}>
          <select
            value={selectedSemId}
            onChange={e => setSelectedSemId(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '10px 14px', 
              borderRadius: 8, 
              border: '1px solid #ddd', 
              fontSize: 14,
              background: '#fff',
              outline: 'none'
            }}
          >
            {availableSemesters.map(s => (
              <option key={s.id} value={s.id}>Semester {s.number}</option>
            ))}
          </select>
          <button 
            onClick={handleLinkSemester}
            style={{ 
              padding: '10px 20px', 
              borderRadius: 8, 
              background: '#111', 
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14
            }}
          >
            + Add Semester
          </button>
        </div>
      ) : (
        <p style={{ color: '#888', fontSize: 13, marginBottom: 32 }}>All 8 semesters are linked to this branch.</p>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {linkedSemesters.length === 0 ? (
          <p style={{ color: '#888', fontSize: 14 }}>No semesters linked to this branch yet. Link one above.</p>
        ) : (
          linkedSemesters.map(sem => (
            <div 
              key={sem.id} 
              style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '16px 20px', 
                borderRadius: 12, 
                border: '1px solid #e5e5e5',
                background: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#111'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e5e5e5'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'
              }}
              onClick={() => router.push(`/admin/semesters/${sem.id}`)}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 16 }}>Semester {sem.number}</span>
                <span style={{ marginLeft: 12, color: '#888', fontSize: 13 }}>Manage courses →</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  handleUnlinkSemester(sem.id)
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#e53e3e',
                  cursor: 'pointer', 
                  fontSize: 13,
                  fontWeight: 500,
                  padding: '4px 8px'
                }}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}