// src/components/admin/CrudList.tsx
'use client'
import { useEffect, useState } from 'react'
import { useAdminCrud } from '../../hooks/useAdminCrud'

interface Props {
  table: string
  label: string
  nameField?: string
  filters?: Record<string, any>
  extraFields?: { key: string; placeholder: string }[]
  extraData?: Record<string, any>;
  onSelect?: (item: any) => void
}

export default function CrudList({
  table, label, nameField = 'name',
  filters, extraFields = [], extraData, onSelect
}: Props) {
  const { list, add, remove } = useAdminCrud(table)
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setItems(await list(filters))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [JSON.stringify(filters)])

  async function handleAdd() {
    if (!form[nameField]?.trim()) return
    try {
      await add({ ...form, ...filters, ...extraData })
      setForm({})
      load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Delete this ${label}? Everything under it will also be deleted.`)) return
    try {
      await remove(id)
      load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <h2 style={{ marginBottom: 16 }}>{label}</h2>

      {error && (
        <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>
      )}

      {/* Add form */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          placeholder={`${label} name`}
          value={form[nameField] || ''}
          onChange={e => setForm(f => ({ ...f, [nameField]: e.target.value }))}
          style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 6,
            border: '1px solid #ccc', fontSize: 14 }}
        />
        {extraFields.map(f => (
          <input key={f.key} placeholder={f.placeholder} value={form[f.key] || ''}
            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
            style={{ width: 130, padding: '8px 12px', borderRadius: 6,
              border: '1px solid #ccc', fontSize: 14 }}
          />
        ))}
        <button onClick={handleAdd}
          style={{ padding: '8px 16px', borderRadius: 6, background: '#111',
            color: '#fff', cursor: 'pointer', fontSize: 14, border: 'none' }}>
          + Add {label}
        </button>
      </div>

      {/* List */}
      {loading ? <p>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.length === 0 && (
            <p style={{ color: '#888' }}>No {label.toLowerCase()}s yet. Add one above.</p>
          )}
          {items.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 8, border: '1px solid #e5e5e5',
              background: '#fafafa'
            }}>
              <span
                onClick={() => onSelect?.(item)}
                style={{ cursor: onSelect ? 'pointer' : 'default',
                  fontWeight: 500, flex: 1, fontSize: 14 }}>
                {item[nameField]}
                {item.code
                  ? <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>
                      {item.code}
                    </span>
                  : null}
                {item.number
                  ? <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>
                      Sem {item.number}
                    </span>
                  : null}
                {onSelect && (
                  <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>→</span>
                )}
              </span>
              <button onClick={() => handleDelete(item.id)}
                style={{ background: 'none', border: 'none', color: '#e53e3e',
                  cursor: 'pointer', fontSize: 13 }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}