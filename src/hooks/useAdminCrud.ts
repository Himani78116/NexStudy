// src/hooks/useAdminCrud.ts
import { supabase } from '../lib/supabaseClient'
// ↑ This points to YOUR existing supabaseClient.ts — no change needed there
//   Just check that file exports a named export called 'supabase'

export function useAdminCrud(table: string) {

  async function list(filters?: Record<string, any>) {
    let query = supabase.from(table).select('*')
    if (filters) {
      Object.entries(filters).forEach(([col, val]) => {
        query = query.eq(col, val)
      })
    }
    const { data, error } = await query.order('created_at', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  async function add(payload: Record<string, any>) {
    const { error } = await supabase.from(table).insert(payload)
    if (error) throw error
  }

  async function remove(id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
  }

  async function update(id: string, payload: Record<string, any>) {
    const { error } = await supabase.from(table).update(payload).eq('id', id)
    if (error) throw error
  }

  return { list, add, remove, update }
}