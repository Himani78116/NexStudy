// src/app/courses/[semId]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import type { Course, Semester } from '@/types'

interface CourseWithProgress extends Course {
  totalTopics: number
  completedTopics: number
}

export default function CoursesPage() {
  const params = useParams()
  const semId = params?.semId as string
  const [sem, setSem] = useState<Semester | null>(null)
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Fetch semester info
      const { data: semData } = await supabase
        .from('semesters')
        .select('*, branches(name, code)')
        .eq('id', semId)
        .single()
      setSem(semData)

      // Fetch courses for this semester
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('semester_id', semId)
        .order('name')

      if (!coursesData) { setLoading(false); return }

      // For each course, count total topics and completed topics
      const withProgress = await Promise.all(
        coursesData.map(async (course) => {
          // Get all topic IDs under this course
          const { data: units } = await supabase
            .from('units')
            .select('id')
            .eq('course_id', course.id)

          const unitIds = (units ?? []).map(u => u.id)

          if (unitIds.length === 0) {
            return { ...course, totalTopics: 0, completedTopics: 0 }
          }

          const { data: topics } = await supabase
            .from('topics')
            .select('id')
            .in('unit_id', unitIds)

          const topicIds = (topics ?? []).map(t => t.id)
          const totalTopics = topicIds.length

          if (totalTopics === 0) {
            return { ...course, totalTopics: 0, completedTopics: 0 }
          }

          // Count how many of those topics this user completed
          const { count } = await supabase
            .from('user_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('completed', true)
            .in('topic_id', topicIds)

          return { ...course, totalTopics, completedTopics: count ?? 0 }
        })
      )

      setCourses(withProgress)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p style={{ padding: 32 }}>Loading...</p>

  return (
    <div style={{ padding: 32, maxWidth: 700 }}>

      {/* Breadcrumb */}
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        <span onClick={() => router.push('/dashboard')}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}>Dashboard</span>
        {' → '}
        <span onClick={() => router.push(`/semester/${(sem as any)?.branch_id}`)}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          {(sem as any)?.branches?.name}
        </span>
        {' → '}Semester {sem?.number}
      </p>

      <h1 style={{ marginBottom: 8 }}>Semester {sem?.number} Courses</h1>
      <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>
        Click a course to view its units and notes.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {courses.map((course, index) => {
          const pct = course.totalTopics === 0
            ? 0
            : Math.round((course.completedTopics / course.totalTopics) * 100)
          const courseKey = `${course.id ?? course.code ?? 'course'}-${index}`

          return (
            <div key={courseKey}
              onClick={() => router.push(`/units/${course.id}`)}
              style={{ padding: '20px 24px', borderRadius: 10,
                border: '1px solid #e5e5e5', cursor: 'pointer', background: '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#111')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e5e5')}>

              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
                    {course.name}
                  </p>
                  {course.code && (
                    <p style={{ color: '#888', fontSize: 12 }}>{course.code}</p>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500,
                  color: pct === 100 ? '#16a34a' : '#888' }}>
                  {pct}%
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, background: '#f0f0f0', borderRadius: 99 }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: pct === 100 ? '#16a34a' : '#111',
                  borderRadius: 99,
                  transition: 'width 0.4s ease'
                }} />
              </div>

              <p style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>
                {course.completedTopics} / {course.totalTopics} topics completed
              </p>
            </div>
          )
        })}

        {courses.length === 0 && (
          <p style={{ color: '#888' }}>No courses added for this semester yet.</p>
        )}
      </div>
    </div>
  )
}