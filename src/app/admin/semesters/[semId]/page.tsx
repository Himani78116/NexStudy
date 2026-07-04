// src/app/admin/semesters/[semId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabaseClient'
import type { Course } from '@/types'

interface LinkedCourse {
  relationId: string // semester_course.id
  id: string // course_id
  name: string
  code: string | null
}

export default function SemesterCoursesPage() {
  const router = useRouter()
  const params = useParams()
  const rawSemId = params.semId
  const semId = Array.isArray(rawSemId) ? rawSemId[0] : rawSemId

  const [branchSemInfo, setBranchSemInfo] = useState<any>(null)
  const [courses, setCourses] = useState<LinkedCourse[]>([])
  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadData() {
    if (!semId) return
    try {
      // 1. Fetch branch semester detail (branch name, sem number)
      const { data: bsData, error: bsErr } = await supabase
        .from('branch_semesters')
        .select(`
          id,
          branch_id,
          branches (
            name,
            code
          ),
          semesters (
            id,
            number
          )
        `)
        .eq('id', semId)
        .single()
      
      if (bsErr) throw bsErr
      setBranchSemInfo(bsData)

      const actualSemesterId = (bsData?.semesters as any)?.id; // Extract actual semester_id from the joined semesters table

      if (!actualSemesterId) {
        setError('Semester ID not found for the selected branch semester.');
        setLoading(false);
        return;
      }

      // 2. Fetch courses linked to this semester
      const { data: relData, error: relErr } = await supabase
        .from('semester_course')
        .select(`
          id,
          course_id,
          courses (
            id,
            name,
            code
          )
        `)
        .eq('semester_id', actualSemesterId) // Use the actual semester_id from the 'semesters' table
      if (relErr) throw relErr

      const mapped = (relData ?? [])
        .filter(item => item.courses !== null)
        .map(item => ({
          relationId: item.id,
          id: (item.courses as any).id,
          name: (item.courses as any).name,
          code: (item.courses as any).code
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
      
      setCourses(mapped)
    } catch (e: any) {
      setError(e.message || 'Failed to load courses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [semId])

  async function handleAddCourse() {
    if (!courseName.trim()) return
    setError('')
    setSaving(true)

    const actualSemesterId = (branchSemInfo?.semesters as any)?.id;
    if (!actualSemesterId) {
      setError('Semester information not loaded. Please try refreshing the page.');
      setSaving(false);
      return;
    }

    try {
      // 1. Insert course
      const { data: newCourse, error: courseErr } = await supabase
        .from('courses')
        .insert({
          name: courseName.trim(),
          code: courseCode.trim() || null
        })
        .select()
        .single()

      if (courseErr) throw courseErr

      // 2. Insert semester_course association
      const { error: relErr } = await supabase
        .from('semester_course')
        .insert({
          semester_id: actualSemesterId, // Use the actual semester_id
          course_id: newCourse.id
        })

      if (relErr) {
        // Rollback course if mapping fails
        await supabase.from('courses').delete().eq('id', newCourse.id)
        throw relErr
      }

      setCourseName('')
      setCourseCode('')
      await loadData()
    } catch (e: any) {
      setError(e.message || 'Failed to add course.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCourse(relationId: string, courseId: string) {
    if (!confirm('Are you sure you want to delete this course? All units, topics, and notes under it will also be deleted.')) return
    setError('')
    try {
      // Deleting course itself triggers cascade in DB for units/topics/notes and semester_course relation
      const { error: delErr } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
      if (delErr) throw delErr
      await loadData()
    } catch (e: any) {
      setError(e.message || 'Failed to delete course.')
    }
  }

  if (loading) return <p style={{ padding: 32, color: '#666' }}>Loading Courses...</p>

  const branchesObj = branchSemInfo?.branches
  const branch = Array.isArray(branchesObj) ? branchesObj[0] : branchesObj
  const branchName = branch?.name
  const branchCode = branch?.code

  const semestersObj = branchSemInfo?.semesters
  const sem = Array.isArray(semestersObj) ? semestersObj[0] : semestersObj
  const semNumber = sem?.number

  return (
    <div style={{ maxWidth: 700 }}>
      {/* Breadcrumb */}
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        <span onClick={() => router.push('/admin/branches')}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          Branches
        </span>
        {' → '}
        <span onClick={() => router.push(`/admin/branches/${branchSemInfo?.branch_id}`)}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          {branchName}
        </span>
        {' → '}Semester {semNumber}
      </p>

      <h1 style={{ marginBottom: 8, fontSize: 28, fontWeight: 700 }}>Courses</h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        Manage courses for {branchName} ({branchCode}) — Semester {semNumber}
      </p>

      {error && (
        <p style={{ color: '#e53e3e', background: '#fef2f2', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {error}
        </p>
      )}

      {/* Add Course Form */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <input 
          placeholder="Course Name (e.g. Programming in C)" 
          value={courseName}
          onChange={e => setCourseName(e.target.value)}
          style={{ 
            flex: 2, 
            minWidth: 200, 
            padding: '10px 14px', 
            borderRadius: 8, 
            border: '1px solid #ddd', 
            fontSize: 14,
            outline: 'none'
          }} 
        />
        <input 
          placeholder="Code (e.g. CS101)" 
          value={courseCode}
          onChange={e => setCourseCode(e.target.value)}
          style={{ 
            flex: 1, 
            minWidth: 100, 
            padding: '10px 14px', 
            borderRadius: 8, 
            border: '1px solid #ddd', 
            fontSize: 14,
            outline: 'none'
          }} 
        />
        <button 
          onClick={handleAddCourse}
          disabled={saving || !courseName.trim()}
          style={{ 
            padding: '10px 20px', 
            borderRadius: 8, 
            background: '#111', 
            color: '#fff', 
            border: 'none', 
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 14,
            opacity: saving || !courseName.trim() ? 0.6 : 1
          }}
        >
          {saving ? 'Adding...' : '+ Add Course'}
        </button>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {courses.length === 0 ? (
          <p style={{ color: '#888', fontSize: 14 }}>No courses added for this semester yet. Add one above.</p>
        ) : (
          courses.map(course => (
            <div 
              key={course.id} 
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
              onClick={() => router.push(`/admin/courses/${course.id}`)}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 16 }}>{course.name}</span>
                {course.code && (
                  <span style={{ marginLeft: 8, color: '#888', fontSize: 13, background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
                    {course.code}
                  </span>
                )}
                <span style={{ marginLeft: 12, color: '#888', fontSize: 13 }}>Manage units →</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteCourse(course.relationId, course.id)
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
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
