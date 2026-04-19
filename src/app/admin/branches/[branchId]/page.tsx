// src/app/admin/branches/[branchId]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import CrudList from '../../../../components/admin/CrudList'

export default function SemestersPage() {
  const router = useRouter()
  const params = useParams()
  const branchId = params.branchId as string

  return (
    <>
      <h1 style={{ marginBottom: 24 }}>Semesters</h1>
      <CrudList
        table="semesters"
        label="Semester"
        nameField="number"
        filters={{ branch_id: branchId }}
        extraFields={[{ key: 'number', placeholder: 'Sem number (1–8)' }]}
        extraData={{ branch_id: branchId }} // 🔥 critical fix
        onSelect={s => router.push(`/admin/semesters/${s.id}`)}
      />
    </>
  )
}