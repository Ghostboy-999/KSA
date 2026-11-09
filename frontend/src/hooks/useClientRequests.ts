import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ClientOrder, ClientRequest, RequestStatus } from '../types/database'

export const REQUEST_PHOTOS_BUCKET = 'request-photos'

const REQUESTS_CHANGED = 'ksa:requests-changed'
function notifyRequestsChanged() {
  window.dispatchEvent(new Event(REQUESTS_CHANGED))
}

const REQUEST_SELECT = `
  *,
  clients ( name, phone, email ),
  orders ( code )
`

/**
 * Solicitudes de clientes. RLS decide qué se ve:
 * el cliente solo las suyas, gerencia todas.
 */
export function useClientRequests(opts: { onlyOpen?: boolean; enabled?: boolean } = {}) {
  const { onlyOpen = false, enabled = true } = opts
  const [requests, setRequests] = useState<ClientRequest[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled) return
    let query = supabase
      .from('client_requests')
      .select(REQUEST_SELECT)
      .order('created_at', { ascending: false })
      .limit(200)
    if (onlyOpen) query = query.in('status', ['pendiente', 'en_revision'])
    const { data, error: err } = await query
    setError(err?.message ?? null)
    setRequests((data ?? []) as ClientRequest[])
    setLoading(false)
  }, [onlyOpen, enabled])

  useEffect(() => {
    if (!enabled) return
    void load()
    const channel = supabase
      .channel(`client-requests-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_requests' }, () => {
        void load()
      })
      .subscribe()
    const onLocal = () => {
      void load()
    }
    window.addEventListener(REQUESTS_CHANGED, onLocal)
    return () => {
      window.removeEventListener(REQUESTS_CHANGED, onLocal)
      void supabase.removeChannel(channel)
    }
  }, [load, enabled])

  return { requests, loading, error, reload: load }
}

/** Vincula la cuenta del cliente con su ficha (por correo confirmado). */
export async function claimClientAccount(createIfMissing: boolean) {
  const { data, error } = await supabase.rpc('claim_client_account', {
    create_if_missing: createIfMissing,
  })
  return { clientId: (data as string | null) ?? null, error: error?.message ?? null }
}

export async function fetchClientOrders() {
  const { data, error } = await supabase.rpc('client_orders')
  return { orders: (data ?? []) as ClientOrder[], error: error?.message ?? null }
}

function safeName(name: string) {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '') : 'jpg'
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext || 'jpg'}`
}

export async function submitClientRequest(input: {
  userId: string
  description: string
  measures: string
  quantity: number
  desiredDate: string
  photos: File[]
}) {
  const { clientId, error: claimErr } = await claimClientAccount(true)
  if (!clientId) {
    return claimErr ?? 'Tu cuenta aún no está lista. Confirma tu correo e inténtalo de nuevo.'
  }

  const paths: string[] = []
  for (const file of input.photos) {
    const path = `${input.userId}/${safeName(file.name)}`
    const { error } = await supabase.storage
      .from(REQUEST_PHOTOS_BUCKET)
      .upload(path, file, { contentType: file.type || undefined })
    if (error) return `No se pudo subir ${file.name}: ${error.message}`
    paths.push(path)
  }

  const { error } = await supabase.from('client_requests').insert({
    client_id: clientId,
    description: input.description.trim(),
    measures: input.measures.trim() || null,
    quantity: input.quantity,
    desired_date: input.desiredDate || null,
    photo_paths: paths,
  })
  if (error) return error.message
  notifyRequestsChanged()
  return null
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
  extra: { response?: string | null; order_id?: string | null } = {},
) {
  const { error } = await supabase
    .from('client_requests')
    .update({ status, ...extra })
    .eq('id', id)
  if (!error) notifyRequestsChanged()
  return error?.message ?? null
}

export async function signedPhotoUrls(paths: string[]) {
  if (paths.length === 0) return []
  const { data } = await supabase.storage
    .from(REQUEST_PHOTOS_BUCKET)
    .createSignedUrls(paths, 60 * 60)
  return (data ?? []).map((d) => d.signedUrl).filter((u): u is string => !!u)
}
