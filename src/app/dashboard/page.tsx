// src/app/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import type { Course, Unit, Topic } from '../../types'

interface ProgressData {
  overallPct: number
  totalTopics: number
  completedTopics: number
  courses: (Course & {
    pct: number
    completedTopics: number
    totalTopics: number
    units: (Unit & {
      pct: number
      completedTopics: number
      totalTopics: number
    })[]
  })[]
}

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // 1. Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, branches(name), semesters(number)')
          .eq('id', user.id)
          .single()

        if (!profileData || !profileData.branch_id || !profileData.semester_id) {
          router.push('/setup')
          return
        }

        setProfile(profileData)

        // ADMIN CHECK FIRST - before branch/sem check
        if (profileData.role === 'admin') {
          setLoading(false)
          return
        }

        // 2. Fetch Progress
        const semId = profileData.semester_id
        
        // Fetch all courses for this semester
        const { data: courses } = await supabase
          .from('courses')
          .select('*')
          .eq('semester_id', semId)
          .order('name')

        if (!courses || courses.length === 0) {
          setProgress({ overallPct: 0, totalTopics: 0, completedTopics: 0, courses: [] })
          setLoading(false)
          return
        }

        const courseIds = courses.map(c => c.id)

        // Fetch all units for these courses
        const { data: allUnits } = await supabase
          .from('units')
          .select('*')
          .in('course_id', courseIds)
          .order('order_index')

        const unitIds = (allUnits ?? []).map(u => u.id)

        // Fetch all topics for these units
        let allTopics: any[] = []
        if (unitIds.length > 0) {
          const { data: topicsData } = await supabase
            .from('topics')
            .select('id, unit_id')
            .in('unit_id', unitIds)
          allTopics = topicsData ?? []
        }

        const topicIds = allTopics.map(t => t.id)

        // Fetch all completed topics for this user in this semester
        let completedTopicIds = new Set<string>()
        if (topicIds.length > 0) {
          const { data: completedProgress } = await supabase
            .from('user_progress')
            .select('topic_id')
            .eq('user_id', user.id)
            .eq('completed', true)
            .in('topic_id', topicIds)
          
          if (completedProgress) {
            completedTopicIds = new Set(completedProgress.map(p => p.topic_id))
          }
        }

        // Process data in-memory for efficiency
        let totalTopicsSem = 0
        let completedTopicsSem = 0

        const coursesWithProgress = courses.map(course => {
          const courseUnits = (allUnits ?? []).filter(u => u.course_id === course.id)
          
          let totalTopicsCourse = 0
          let completedTopicsCourse = 0

          const unitsWithProgress = courseUnits.map(unit => {
            const unitTopics = allTopics.filter(t => t.unit_id === unit.id)
            const totalTopicsUnit = unitTopics.length
            const completedTopicsUnit = unitTopics.filter(t => completedTopicIds.has(t.id)).length

            totalTopicsCourse += totalTopicsUnit
            completedTopicsCourse += completedTopicsUnit

            return {
              ...unit,
              totalTopics: totalTopicsUnit,
              completedTopics: completedTopicsUnit,
              pct: totalTopicsUnit === 0 ? 0 : Math.round((completedTopicsUnit / totalTopicsUnit) * 100)
            }
          })

          totalTopicsSem += totalTopicsCourse
          completedTopicsSem += completedTopicsCourse

          return {
            ...course,
            units: unitsWithProgress,
            totalTopics: totalTopicsCourse,
            completedTopics: completedTopicsCourse,
            pct: totalTopicsCourse === 0 ? 0 : Math.round((completedTopicsCourse / totalTopicsCourse) * 100)
          }
        })

        setProgress({
          overallPct: totalTopicsSem === 0 ? 0 : Math.round((completedTopicsSem / totalTopicsSem) * 100),
          totalTopics: totalTopicsSem,
          completedTopics: completedTopicsSem,
          courses: coursesWithProgress
        })
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  if (loading || !profile) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading Dashboard...</div>

  if (profile?.role === 'admin') {
    return (
      <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 16 }}>Admin Portal</h1>
        <p style={{ marginBottom: 24, color: '#555' }}>Welcome, {profile.email}. You have administrative privileges.</p>
        <button onClick={() => router.push('/admin/branches')}
          style={{ padding: '12px 24px', background: '#111', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
          Manage Content →
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>My Dashboard</h1>
          <p style={{ color: '#666' }}>
            {profile.branches?.name} • Semester {profile.semesters?.number}
          </p>
        </div>
        <button onClick={() => router.push('/setup')}
          style={{ padding: '8px 16px', background: '#f0f0f0', border: '1px solid #e5e5e5', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          Change Branch/Sem
        </button>
      </div>

      {/* Overall Progress Card */}
      <div style={{ background: '#111', color: '#fff', padding: 32, borderRadius: 16, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 8 }}>OVERALL PROGRESS</p>
          <h2 style={{ fontSize: 48, fontWeight: 800 }}>{progress?.overallPct}%</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 }}>
            {progress?.completedTopics} of {progress?.totalTopics} topics completed
          </p>
        </div>
        <div style={{ 
          width: 100, 
          height: 100, 
          borderRadius: '50%', 
          background: `conic-gradient(#fff ${progress?.overallPct ?? 0}%, rgba(255,255,255,0.1) 0)`,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
           <div style={{ 
             width: 84, 
             height: 84, 
             borderRadius: '50%', 
             background: '#111', 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center' 
           }}>
              <span style={{ fontSize: 20, fontWeight: 700 }}>{progress?.overallPct}%</span>
           </div>
        </div>
      </div>

      <h3 style={{ marginBottom: 20, fontSize: 20 }}>Your Courses</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {progress?.courses.map(course => (
          <div key={course.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 24, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h4 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{course.name}</h4>
                <p style={{ color: '#888', fontSize: 12 }}>{course.code || 'No code'}</p>
              </div>
              <span style={{ fontWeight: 700, color: course.pct === 100 ? '#16a34a' : '#111' }}>{course.pct}%</span>
            </div>

            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 99, marginBottom: 20 }}>
              <div style={{ height: '100%', width: `${course.pct}%`, background: course.pct === 100 ? '#16a34a' : '#111', borderRadius: 99, transition: 'width 0.4s' }} />
            </div>

            <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Unit Progress</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {course.units.map(unit => (
                  <div key={unit.id} onClick={() => router.push(`/topics/${unit.id}`)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: 14, color: '#444' }}>{unit.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <div style={{ width: 60, height: 4, background: '#f0f0f0', borderRadius: 99 }}>
                          <div style={{ height: '100%', width: `${unit.pct}%`, background: '#888', borderRadius: 99 }} />
                       </div>
                       <span style={{ fontSize: 12, fontWeight: 500, color: '#888', minWidth: 35 }}>{unit.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => router.push(`/units/${course.id}`)}
              style={{ width: '100%', marginTop: 24, padding: '10px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              View Course
            </button>
          </div>
        ))}
      </div>
      
      {progress?.courses.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, background: '#f9f9f9', borderRadius: 12 }}>
          <p style={{ color: '#888' }}>No courses found for this semester.</p>
        </div>
      )}
    </div>
  )
}
