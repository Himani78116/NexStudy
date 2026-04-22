// src/app/admin/courses/[courseId]/page.tsx
'use client'
import { useRouter, useParams } from 'next/navigation'
import CrudList from '../../../../components/admin/CrudList'

export default function UnitsPage() {
  const router = useRouter()
  const params = useParams()
  const rawCourseId = params.courseId
  const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId
  const hasCourseId = typeof courseId === 'string' && courseId.trim().length > 0

  if (!hasCourseId) {
    return <p style={{ color: '#d32f2f' }}>Invalid course id in URL.</p>
  }

  return (
    <>
        <h1 style={{ marginBottom: 24 }}>Units</h1>
        <CrudList
            table="units"
            label="Unit"
            nameField="name"
            filters={{ course_id: courseId }}
            extraData={{ course_id: courseId }}
            onSelect={unit => {
              if (!unit?.id) return
              router.push(`/admin/units/${unit.id}`)
            }}
        />
    </>
  )
}

