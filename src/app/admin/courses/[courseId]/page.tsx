// src/app/admin/courses/[courseId]/page.tsx
'use client'
import { useRouter, useParams } from 'next/navigation'
import CrudList from '../../../../components/admin/CrudList'

export default function UnitsPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  return (
    <>
        <h1 style={{ marginBottom: 24 }}>Semesters</h1>
        <CrudList
            table="units"
            label="Unit"
            nameField="title"
            filters={{ course_id: courseId }}
            extraData={{ course_id: courseId }}
            onSelect={u => router.push(`/admin/units/${u.id}`)}
        />
    </>
  )
}

  