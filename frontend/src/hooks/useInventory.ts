import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Material, OrderShortage } from '../types/database'

export function useInventory() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [shortages, setShortages] = useState<OrderShortage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [matRes, shortRes] = await Promise.all([
      supabase
        .from('materials')
        .select('*, suppliers ( name )')
        .order('grade'),
      supabase.from('order_shortages').select('*'),
    ])

    if (matRes.error) setError(matRes.error.message)
    setMaterials((matRes.data ?? []) as Material[])
    setShortages((shortRes.data ?? []) as OrderShortage[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const channel = supabase
      .channel('inventory-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'materials' },
        () => void load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_materials' },
        () => void load(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [load])

  const addStock = useCallback(
    async (materialId: string, qty: number, reason: string, userId: string) => {
      const { error: err } = await supabase.from('stock_movements').insert({
        material_id: materialId,
        qty_change: qty,
        reason,
        user_id: userId,
      })
      if (err) return err.message
      await load()
      return null
    },
    [load],
  )

  return { materials, shortages, loading, error, reload: load, addStock }
}

export async function checkOrderCanEnterShop(orderId: string) {
  const { data, error } = await supabase
    .from('order_shortages')
    .select('*')
    .eq('order_id', orderId)

  if (error) return { ok: false, shortages: [], error: error.message }
  const shortages = (data ?? []) as OrderShortage[]
  return { ok: shortages.length === 0, shortages, error: null }
}
