/** Fechas legibles en español de Colombia: "20 nov" o "20 nov 2025" si es de otro año */
export function formatDate(iso: string | null | undefined) {
  if (!iso) return ''
  // Las fechas sin hora (YYYY-MM-DD) se leen como día local, no UTC
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) }).replace('.', '')
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return ''
  return `${formatDate(iso)}, ${new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}`
}

/** La fecha de compromiso ya pasó (sin contar hoy) */
export function isOverdue(iso: string | null | undefined) {
  if (!iso) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${iso.slice(0, 10)}T00:00:00`) < today
}
