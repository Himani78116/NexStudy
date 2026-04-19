// src/app/admin/semesters/[semId]/page.tsx
'use client'
import { useRouter, useParams } from 'next/navigation'
import CrudList from '../../../../components/admin/CrudList'

export default function CoursesPage() {
  const router = useRouter()
  const params = useParams()
  const semesterId = params.semId as string
  return (
    <>
    <h1 style={{ marginBottom: 24 }}>Courses</h1>
    <CrudList
      table="courses"
      label="Course"
      filters={{ semester_id: params.semId }}
      extraFields={[{ key: 'code', placeholder: 'Code e.g. CS301' }]}
      extraData={{ semester_id: semesterId }}
      onSelect={c => router.push(`/admin/courses/${c.id}`)}
    />
    </>
  )
}

