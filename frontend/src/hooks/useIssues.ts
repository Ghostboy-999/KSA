import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { IssueType, OrderIssue } from '../types/database'

// Aviso local para que todas las listas se refresquen al reportar o resolver,
// sin depender de que llegue el evento de Realtime.
const ISSUES_CHANGED = 'ksa:issues-changed'
function notifyIssuesChanged() {
  window.dispatchEvent(new Event(ISSUES_CHANGED))
}

const ISSUE_SELECT = `
  *,
  reporter:reported_by ( full_name ),
  resolver:resolved_by ( full_name ),
  orders ( code, description )
`

/**
 * Inconvenientes en tiempo real.
 * Con orderId: los de esa orden (abiertos y resueltos).
 * Sin orderId: todos los abiertos, más los resueltos si includeResolved.
 */
export function useIssues(opts: { orderId?: string; includeResolved?: boolean; enabled?: boolean } = {}) {
  const { orderId, includeResolved = false, enabled = true } = opts
  const [issues, setIssues] = useState<OrderIssue[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled) return
    let query = supabase
      .from('order_issues')
      .select(ISSUE_SELECT)
      .order('created_at', { ascending: false })

    if (orderId) query = query.eq('order_id', orderId)
    else if (!includeResolved) query = query.eq('status', 'abierto')
    else query = query.limit(100)

    const { data, error: err } = await query
    setError(err?.message ?? null)
    setIssues((data ?? []) as OrderIssue[])
    setLoading(false)
  }, [orderId, includeResolved, enabled])

  useEffect(() => {
    if (!enabled) return
    void load()

    const channel = supabase
      .channel(`order-issues-${orderId ?? 'all'}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_issues',
          ...(orderId ? { filter: `order_id=eq.${orderId}` } : {}),
        },
        () => {
          void load()
        },
      )
      .subscribe()

    const onLocalChange = () => {
      void load()
    }
    window.addEventListener(ISSUES_CHANGED, onLocalChange)

    return () => {
      window.removeEventListener(ISSUES_CHANGED, onLocalChange)
      void supabase.removeChannel(channel)
    }
  }, [load, enabled, orderId, includeResolved])

  return { issues, loading, error, reload: load }
}

export async function reportIssue(input: {
  order_id: string
  type: IssueType
  description: string
}) {
  const { error } = await supabase.from('order_issues').insert({
    order_id: input.order_id,
    type: input.type,
    description: input.description.trim(),
  })
  if (!error) notifyIssuesChanged()
  return error?.message ?? null
}

export async function setIssueResolved(id: string, resolved: boolean, resolution?: string) {
  const { error } = await supabase
    .from('order_issues')
    .update({
      status: resolved ? 'resuelto' : 'abierto',
      resolution: resolved ? resolution?.trim() || null : null,
    })
    .eq('id', id)
  if (!error) notifyIssuesChanged()
  return error?.message ?? null
}
