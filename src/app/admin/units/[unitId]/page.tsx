// src/app/admin/units/[unitId]/page.tsx
'use client'
import { useRouter, useParams } from 'next/navigation'
import CrudList from '../../../../components/admin/CrudList'

export default function TopicsPage() {
  const router = useRouter()
	const params = useParams()
  const unitId = params?.unitId as string
  return (
    <CrudList
      table="topics"
      label="Topic"
      nameField="name"
      filters={{ unit_id: unitId }}
      onSelect={t => router.push(`/admin/topics/${t.id}`)}
    />
  )
}