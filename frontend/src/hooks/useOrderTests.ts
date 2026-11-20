import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { OrderTest, TestCheckItem } from '../types/database'

const TEST_SELECT = '*, tester:tested_by ( full_name )'

/** Pruebas hidráulicas de una orden, la más reciente primero */
export function useOrderTests(orderId: string | undefined) {
  const [tests, setTests] = useState<OrderTest[]>([])
  const [loading, setLoading] = useState(!!orderId)

  const load = useCallback(async () => {
    if (!orderId) return
    const { data } = await supabase
      .from('order_tests')
      .select(TEST_SELECT)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
    setTests((data ?? []) as OrderTest[])
    setLoading(false)
  }, [orderId])

  useEffect(() => {
    void load()
  }, [load])

  return { tests, loading, reload: load }
}

/** Registra la prueba; la base mueve la orden a "lista" o de vuelta a taller */
export async function recordOrderTest(input: {
  order_id: string
  checklist: TestCheckItem[]
  pressure_psi: number
  passed: boolean
  rework: boolean
  notes: string | null
}) {
  const { error } = await supabase.from('order_tests').insert(input)
  return error?.message ?? null
}
