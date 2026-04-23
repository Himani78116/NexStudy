// src/app/admin/layout.tsx
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 200, padding: '24px 16px',
        borderRight: '1px solid #e5e5e5', background: '#fafafa' }}>
        <p style={{ fontWeight: 600, marginBottom: 20, fontSize: 15 }}>Admin Panel</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
          <Link href="/admin/branches">Branches</Link>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 32 }}>
        {children}
      </main>
    </div>
  )
}