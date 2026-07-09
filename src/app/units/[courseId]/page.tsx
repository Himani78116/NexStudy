// src/app/units/[courseId]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import type { Unit, Course } from '@/types'

interface UnitWithProgress extends Unit {
  completedTopics: number
  totalTopics: number
}

export default function UnitsPage() {
  const params = useParams()
  const courseId = params?.courseId as string
  const [course, setCourse] = useState<any>(null)
  const [units, setUnits] = useState<UnitWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [errorInfo, setErrorInfo] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!courseId) return

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // 1. Fetch Course directly (FK join to semesters does not exist in DB)
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .maybeSingle()

        if (courseError) {
          console.error('Course Error:', courseError)
          setErrorInfo(courseError.message)
          setLoading(false)
          return
        }

        if (!courseData) {
          setErrorInfo('Course not found')
          setLoading(false)
          return
        }

        // 2. Fetch semester/branch info for breadcrumb via semester_course join table
        let semNumber: number | null = null
        let branchData: any = null
        let branchSemId: string | null = null

        const { data: relData } = await supabase
          .from('semester_course')
          .select('semester_id, semesters!inner(number)')
          .eq('course_id', courseId)
          .maybeSingle()

        if (relData) {
          const sem = Array.isArray(relData.semesters)
            ? relData.semesters[0]
            : relData.semesters
          semNumber = sem?.number ?? null

          const { data: bsData } = await supabase
            .from('branch_semesters')
            .select('id, branch_id, branches!inner(id, name, code)')
            .eq('semester_id', relData.semester_id)
            .maybeSingle()

          if (bsData) {
            branchSemId = bsData.id
            branchData = Array.isArray(bsData.branches)
              ? bsData.branches[0]
              : bsData.branches
          }
        }

        setCourse({
          ...courseData,
          semesters: semNumber ? { number: semNumber, branches: branchData } : null,
          branchSemesterId: branchSemId
        })

        // Fetch Units
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true })

        if (unitsError) {
          console.error('Units Error:', unitsError)
          setErrorInfo(unitsError.message)
          setLoading(false)
          return
        }

        if (!unitsData || unitsData.length === 0) {
          setUnits([])
          setLoading(false)
          return
        }

        // Fetch Topics for these units
        const unitIds = unitsData.map(u => u.id)
        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('id, unit_id')
          .in('unit_id', unitIds)

        if (topicsError) console.error('Topics Error:', topicsError)
        const topics = topicsData ?? []

        // Fetch Progress
        const topicIds = topics.map(t => t.id)
        let completedIds = new Set<string>()
        if (topicIds.length > 0) {
          const { data: progressData } = await supabase
            .from('user_progress')
            .select('topic_id')
            .eq('user_id', user.id)
            .eq('completed', true)
            .in('topic_id', topicIds)
          
          if (progressData) {
            completedIds = new Set(progressData.map(p => p.topic_id))
          }
        }

        const withProgress = unitsData.map(unit => {
          const unitTopics = topics.filter(t => t.unit_id === unit.id)
          const total = unitTopics.length
          const completed = unitTopics.filter(t => completedIds.has(t.id)).length
          return {
            ...unit,
            totalTopics: total,
            completedTopics: completed
          }
        })

        setUnits(withProgress)
      } catch (err: any) {
        console.error('Critical Load Error:', err)
        setErrorInfo(err.message || JSON.stringify(err, null, 2) || 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, router])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading units...</div>
  
  if (errorInfo) return (
    <div style={{ padding: 40, color: 'red', textAlign: 'center' }}>
      <p>Error loading content: {errorInfo}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 16 }}>Retry</button>
    </div>
  )

  // Extract breadcrumb info
  const sem = course?.semesters
  const branch = sem?.branches

  return (
    <div style={{ padding: '32px 20px', maxWidth: 700, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: '#888', marginBottom: 24, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Dashboard</span>
        <span>→</span>
        {branch && (
          <>
            <span onClick={() => router.push(`/semester/${branch.id}`)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{branch.name}</span>
            <span>→</span>
          </>
        )}
        {sem && course?.branchSemesterId && (
          <>
            <span onClick={() => router.push(`/courses/${course.branchSemesterId}`)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Sem {sem.number}</span>
            <span>→</span>
          </>
        )}
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>{course?.name}</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {units.map((unit, index) => {
          const pct = unit.totalTopics === 0 ? 0 : Math.round((unit.completedTopics / unit.totalTopics) * 100)
          const isDone = pct === 100 && unit.totalTopics > 0

          return (
            <div key={unit.id}
              onClick={() => router.push(`/topics/${unit.id}`)}
              style={{ 
                padding: '18px 24px', borderRadius: 12,
                border: '1px solid #e5e5e5', cursor: 'pointer',
                background: '#fff', display: 'flex', alignItems: 'center', gap: 16,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#111'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e5e5e5'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'
              }}>
              
              <span style={{ 
                width: 36, height: 36, borderRadius: '50%',
                background: isDone ? '#16a34a' : '#f4f4f4', 
                color: isDone ? '#fff' : '#111',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 600, fontSize: 15,
                flexShrink: 0 
              }}>
                {isDone ? '✓' : index + 1}
              </span>
              
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 16, color: '#111' }}>{unit.title}</span>
                {unit.totalTopics > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, maxWidth: 100, height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: isDone ? '#16a34a' : '#111' }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>
                      {unit.completedTopics}/{unit.totalTopics} topics
                    </span>
                  </div>
                )}
              </div>

              <span style={{ color: '#ccc', fontSize: 18 }}>→</span>
            </div>
          )
        })}

        {units.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f9f9f9', borderRadius: 16, border: '1px dashed #ddd' }}>
            <p style={{ color: '#888', fontSize: 15 }}>No units found for this course yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
