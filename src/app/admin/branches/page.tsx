// src/app/admin/branches/page.tsx
'use client'
import { useRouter } from 'next/navigation'
import CrudList from '../../../components/admin/CrudList'

export default function BranchesPage() {
  const router = useRouter()
  return (
    <CrudList
      table="branches"
      label="Branch"
      extraFields={[{ key: 'code', placeholder: 'Code e.g. CS' }]}
      onSelect={b => router.push(`/admin/branches/${b.id}`)}
    />
  )
}