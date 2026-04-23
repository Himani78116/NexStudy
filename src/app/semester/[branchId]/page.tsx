// src/app/semester/[branchId]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import type { Semester, Branch } from '@/types'

export default function SemesterPage() {
  const { branchId } = useParams<{ branchId: string }>()
  const [branch, setBranch] = useState<Branch | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!branchId) return

    async function load() {
      // Fetch branch name for the heading
      const { data: b } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId)
        .single()
      setBranch(b)

      // Fetch semesters for this branch
      const { data } = await supabase
        .from('semesters')
        .select('*')
        .eq('branch_id', branchId)
        .order('number')
      setSemesters(data ?? [])
      setLoading(false)
    }
    load()
  }, [branchId])

  if (loading) return <p style={{ padding: 32 }}>Loading...</p>

  return (
    <div style={{ padding: 32, maxWidth: 700 }}>

      {/* Breadcrumb */}
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        <span onClick={() => router.push('/dashboard')}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          Dashboard
        </span>
        {' → '}{branch?.name}
      </p>

      <h1 style={{ marginBottom: 8 }}>Select Semester</h1>
      <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>
        {branch?.name} — {branch?.code}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
        {semesters.map(sem => (
          <div key={sem.id}
            onClick={() => router.push(`/courses/${sem.id}`)}
            style={{ padding: '20px 16px', borderRadius: 10, textAlign: 'center',
              border: '1px solid #e5e5e5', cursor: 'pointer', background: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#111')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e5e5')}>
            <p style={{ fontWeight: 600, fontSize: 18 }}>Sem {sem.number}</p>
          </div>
        ))}
      </div>
    </div>
  )
}