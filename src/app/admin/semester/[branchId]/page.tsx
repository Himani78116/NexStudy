// src/app/semester/[branchId]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import CrudList from '../../../../components/admin/CrudList'
import type { Semester, Branch } from '@/types'

export default function SemesterPage() {
	const params = useParams()
  const branchId = params?.branchId as string
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

      // Fetch semesters through the branch_semesters join table
      const { data, error } = await supabase
        .from('branch_semesters')
        .select(`
          id,
          semester_id,
          semesters (
            id,
            number,
            created_at
          )
        `)
        .eq('branch_id', branchId)

      if (error) {
        console.error('Error fetching semesters:', error)
        setSemesters([])
      } else {
        const fetchedSems = (data ?? [])
          .filter((item): item is any => item && item.semesters !== null)
          .map(item => ({
            id: item.id,
            number: item.semesters.number,
            created_at: item.semesters.created_at
          })) as Semester[]
        
        fetchedSems.sort((a, b) => a.number - b.number)
        setSemesters(fetchedSems)
      }
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