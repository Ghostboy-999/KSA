import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Order, OrderStage } from '../types/database'

const ORDER_SELECT = `
  *,
  clients ( name, phone ),
  profiles:assignee_id ( full_name )
`

export function useOrders(filter?: { assigneeId?: string; activeOnly?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('orders')
      .select(ORDER_SELECT)
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true, nullsFirst: false })

    if (filter?.assigneeId) {
      query = query.eq('assignee_id', filter.assigneeId)
    }
    if (filter?.activeOnly) {
      query = query.neq('stage', 'entregada')
    }

    const { data, error: err } = await query
    if (err) {
      setError(err.message)
      setOrders([])
    } else {
      setOrders((data ?? []) as Order[])
    }
    setLoading(false)
  }, [filter?.assigneeId, filter?.activeOnly])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          void load()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [load])

  const updateStage = useCallback(
    async (orderId: string, stage: OrderStage) => {
      const { error: err } = await supabase
        .from('orders')
        .update({ stage })
        .eq('id', orderId)

      if (err) return err.message
      await load()
      return null
    },
    [load],
  )

  return { orders, loading, error, reload: load, updateStage }
}

export async function createOrder(input: {
  code: string
  client_id: string
  description: string
  priority: Order['priority']
  due_date: string | null
  assignee_id: string | null
  created_by: string
  notes?: string
}) {
  const { data, error } = await supabase
    .from('orders')
    .insert(input)
    .select(ORDER_SELECT)
    .single()

  return { data: data as Order | null, error: error?.message ?? null }
}

export function workshopLoad(orders: Order[]) {
  const active = orders.filter((o) =>
    ['materiales', 'en_taller', 'pruebas'].includes(o.stage),
  )
  const byStage = active.reduce<Record<string, number>>((acc, o) => {
    acc[o.stage] = (acc[o.stage] ?? 0) + 1
    return acc
  }, {})
  return { total: active.length, byStage }
}
