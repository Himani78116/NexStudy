'use client'
import { useRouter } from 'next/navigation'
import CrudList from '../../../components/admin/CrudList'

export default function CoursesPage() {
  const router = useRouter()
  return (
    <CrudList
      table="courses"
      label="Course"
      nameField="name"
      extraFields={[{ key: 'code', placeholder: 'Code e.g. CS301' }]}
      onSelect={course => {
        if (!course?.id) return
        router.push(`/admin/courses/${course.id}`)
      }}
    />
  )
}