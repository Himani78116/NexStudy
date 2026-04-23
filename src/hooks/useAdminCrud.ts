// src/hooks/useAdminCrud.ts
import { supabase } from '../lib/supabaseClient'
// ↑ This points to YOUR existing supabaseClient.ts — no change needed there
//   Just check that file exports a named export called 'supabase'

export function useAdminCrud(table: string) {
  function isInvalidValue(val: any) {
    if (val === undefined || val === null) return true
    if (typeof val === 'string') {
      const normalized = val.trim().toLowerCase()
      return normalized === '' || normalized === 'undefined' || normalized === 'null'
    }
    return false
  }

  function sanitizeRecord(record?: Record<string, any>) {
    if (!record) return {}
    return Object.fromEntries(
      Object.entries(record).filter(([, val]) => !isInvalidValue(val))
    )
  }

  async function list(filters?: Record<string, any>) {
    let query = supabase.from(table).select('*')
    const safeFilters = sanitizeRecord(filters)
    if (Object.keys(safeFilters).length > 0) {
      Object.entries(safeFilters).forEach(([col, val]) => {
        query = query.eq(col, val)
      })
    }
    const { data, error } = await query.order('created_at', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  async function add(payload: Record<string, any>) {
    const safePayload = sanitizeRecord(payload)
    const { error } = await supabase.from(table).insert(safePayload)
    if (error) throw error
  }

  async function remove(id: string) {
    if (isInvalidValue(id)) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
  }

  async function update(id: string, payload: Record<string, any>) {
    if (isInvalidValue(id)) return
    const safePayload = sanitizeRecord(payload)
    const { error } = await supabase.from(table).update(safePayload).eq('id', id)
    if (error) throw error
  }

  return { list, add, remove, update }
}