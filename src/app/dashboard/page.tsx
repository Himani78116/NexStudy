// src/app/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import type { Branch } from '../../types'

export default function Dashboard() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      // 1. Get the logged in user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setEmail(user.email ?? '')

      // 2. Check their role from the profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setRole(profile?.role ?? 'user')

      // Fetch all branches
      const { data } = await supabase
        .from('branches')
        .select('*')
        .order('name')
      setBranches(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (role === null) return <p style={{ padding: 32 }}>Loading...</p>

  return (
    <div style={{ padding: 32 }}>
      <p style={{ color: '#888', marginBottom: 8 }}>Logged in as {email}</p>

      {role === 'admin' ? (
        <div>
          <h1 style={{ marginBottom: 16 }}>Admin Dashboard</h1>
          <p style={{ marginBottom: 24, color: '#555' }}>
            You have admin access. Manage the content from the admin panel.
          </p>
          <button
            onClick={() => router.push('/admin/branches')}
            style={{ padding: '10px 20px', background: '#111', color: '#fff',
              borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 15 }}>
            Go to Admin Panel →
          </button>
        </div>
      ) : (
        <div>
          <h1 style={{ marginBottom: 16 }}>Welcome back!</h1>
          <p style={{ color: '#555' }}>
            Select your branch to start studying.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {branches.map(branch => (
          <div key={branch.id}
            onClick={() => router.push(`/semester/${branch.id}`)}
            style={{ padding: '20px 24px', borderRadius: 10,
              border: '1px solid #e5e5e5', cursor: 'pointer',
              background: '#fff', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#111')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e5e5')}>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{branch.name}</p>
            <p style={{ color: '#888', fontSize: 13 }}>{branch.code}</p>
          </div>
        ))}
      </div>
        </div>
      )}
    </div>
  )
}