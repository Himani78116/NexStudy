// src/app/units/[courseId]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import type { Unit, Course } from '@/types'

export default function UnitsPage() {
  const params = useParams()
  const courseId = params?.courseId as string
  const [course, setCourse] = useState<Course | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!courseId) return

    async function load() {
      const { data: c } = await supabase
        .from('courses')
        .select('*, semesters(number, branch_id, branches(name))')
        .eq('id', courseId)
        .single()
      setCourse(c)

      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('course_id', courseId)

      console.log(data, error)  
      console.log('params:', params)
      console.log('courseId:', courseId)
      setUnits(data ?? [])
      setLoading(false)
    }
    load()
  }, [courseId])

  if (loading) return <p style={{ padding: 32 }}>Loading...</p>

  const sem = (course as any)?.semesters

  return (
    <div style={{ padding: 32, maxWidth: 700 }}>

      {/* Breadcrumb */}
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        <span onClick={() => router.push('/dashboard')}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}>Dashboard</span>
        {' → '}
        <span onClick={() => router.push(`/semester/${sem?.branch_id}`)}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          {sem?.branches?.name}
        </span>
        {' → '}
        <span onClick={() => router.push(`/courses/${course?.semester_id}`)}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          Sem {sem?.number}
        </span>
        {' → '}{course?.name}
      </p>

      <h1 style={{ marginBottom: 24 }}>{course?.name}</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {units.map((unit, index) => (
          <div key={unit.id}
            onClick={() => router.push(`/topics/${unit.id}`)}
            style={{ padding: '16px 20px', borderRadius: 10,
              border: '1px solid #e5e5e5', cursor: 'pointer',
              background: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#111')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e5e5')}>
            <span style={{ width: 32, height: 32, borderRadius: '50%',
              background: '#f4f4f4', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 600, fontSize: 14,
              flexShrink: 0 }}>
              {index + 1}
            </span>
            <span style={{ fontWeight: 500 }}>{unit.title}</span>
            <span style={{ marginLeft: 'auto', color: '#aaa', fontSize: 13 }}>→</span>
          </div>
        ))}

        {units.length === 0 && (
          <p style={{ color: '#888' }}>No units added for this course yet.</p>
        )}
      </div>
    </div>
  )
}