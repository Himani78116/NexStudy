'use client'

import { useRouter, useParams } from 'next/navigation'
import CrudList from '../../../../components/admin/CrudList'

export default function SemesterCoursesPage() {
	const router = useRouter()
	const params = useParams()
	const rawSemId = params.semId
	const semId = Array.isArray(rawSemId) ? rawSemId[0] : rawSemId
	const hasSemId = typeof semId === 'string' && semId.trim().length > 0

	if (!hasSemId) {
		return <p style={{ color: '#d32f2f' }}>Invalid semester id in URL.</p>
	}

	return (
		<>
			<h1 style={{ marginBottom: 24 }}>Courses</h1>
			<CrudList
				table="courses"
				label="Course"
				nameField="name"
				filters={{ semester_id: semId }}
				extraFields={[{ key: 'code', placeholder: 'Code e.g. CS301' }]}
				extraData={{ semester_id: semId }}
				onSelect={course => {
					if (!course?.id) return
					router.push(`/admin/courses/${course.id}`)
				}}
			/>
		</>
	)
}
