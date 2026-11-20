import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from './Loading'

export interface SelectOption<V extends string = string> {
  value: V
  label: string
  /** Texto pequeño debajo: stock, permisos del rol… */
  hint?: string
  /** Punto de color, ícono o insignia a la izquierda */
  lead?: ReactNode
}

interface Props<V extends string> {
  value: V
  onChange: (value: V) => void
  options: SelectOption<V>[]
  /** Texto cuando el valor no coincide con ninguna opción */
  placeholder?: string
  label?: string
  ariaLabel?: string
  disabled?: boolean
  busy?: boolean
  busyText?: string
  required?: boolean
  /** Muestra buscador; por defecto con más de 7 opciones */
  searchable?: boolean
  /** Panel alineado a la derecha del botón (pantallas anchas) */
  align?: 'left' | 'right'
  /** Botón compacto (filas de una lista) */
  compact?: boolean
  className?: string
  id?: string
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Por debajo de este ancho el menú se abre como hoja inferior */
const SHEET_BELOW = 640

/**
 * Menú desplegable con la marca KSA, en lugar del <select> del navegador.
 * En el celular se abre como hoja inferior; en pantallas anchas, como panel flotante.
 * Teclado: flechas, Inicio/Fin, Enter, Escape y escribir para saltar.
 */
export function Select<V extends string>({
  value,
  onChange,
  options,
  placeholder = 'Elegir…',
  label,
  ariaLabel,
  disabled,
  busy,
  busyText = 'Guardando…',
  required,
  searchable,
  align = 'left',
  compact,
  className = '',
  id,
}: Props<V>) {
  const autoId = useId()
  const baseId = id ?? autoId
  const listId = `${baseId}-list`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [sheet, setSheet] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const typeahead = useRef({ text: '', at: 0 })

  const withSearch = searchable ?? options.length > 7
  const selected = options.find((o) => o.value === value)
  const shown = useMemo(() => {
    if (!query.trim()) return options
    const q = normalize(query.trim())
    return options.filter((o) => normalize(`${o.label} ${o.hint ?? ''}`).includes(q))
  }, [options, query])

  function openMenu() {
    if (disabled || busy) return
    const rect = buttonRef.current?.getBoundingClientRect()
    const isSheet = window.innerWidth < SHEET_BELOW
    setSheet(isSheet)
    if (rect && !isSheet) {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const width = Math.min(Math.max(rect.width, 256), vw - 16)
      const below = vh - rect.bottom - 12
      const above = rect.top - 12
      const up = below < 280 && above > below
      const left = Math.min(Math.max(8, align === 'right' ? rect.right - width : rect.left), vw - width - 8)
      const maxH = Math.max(160, Math.min(360, up ? above : below) - (withSearch ? 60 : 0))
      setDropUp(up)
      setPanelStyle({
        position: 'fixed',
        left,
        width,
        ...(up ? { bottom: vh - rect.top + 8 } : { top: rect.bottom + 8 }),
        ['--select-max-h' as string]: `${maxH}px`,
      })
    }
    setQuery('')
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  function close(focusButton = true) {
    setOpen(false)
    if (focusButton) buttonRef.current?.focus()
  }

  function choose(o: SelectOption<V>) {
    if (o.value !== value) onChange(o.value)
    close()
  }

  useEffect(() => {
    if (!open) return
    const inside = (t: EventTarget | null) =>
      !!t && (rootRef.current?.contains(t as Node) || panelRef.current?.contains(t as Node))
    const onDown = (e: PointerEvent) => {
      if (!inside(e.target)) setOpen(false)
    }
    // El panel flotante no sigue al botón: si la página se desplaza o cambia de tamaño, se cierra
    const onScroll = (e: Event) => {
      if (!sheet && !inside(e.target)) setOpen(false)
    }
    const onResize = () => setOpen(false)
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    // La hoja inferior no deja desplazar la página de fondo
    const prevOverflow = document.body.style.overflow
    if (sheet) document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = prevOverflow
    }
  }, [open, sheet])

  // Foco al abrir (el buscador en celular no abre el teclado de golpe)
  useEffect(() => {
    if (!open) return
    if (withSearch && !sheet) searchRef.current?.focus()
    else listRef.current?.focus()
  }, [open, withSearch, sheet])

  // La opción activa siempre visible
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function onKey(e: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openMenu()
      }
      return
    }
    const last = shown.length - 1
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => Math.min(last, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(last)
        break
      case 'Enter':
        e.preventDefault()
        if (shown[active]) choose(shown[active])
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        setOpen(false)
        break
      default:
        // Sin buscador: escribir salta a la opción que empieza así
        if (!withSearch && e.key.length === 1) {
          const t = typeahead.current
          t.text = e.timeStamp - t.at > 700 ? e.key : t.text + e.key
          t.at = e.timeStamp
          const i = shown.findIndex((o) => normalize(o.label).startsWith(normalize(t.text)))
          if (i >= 0) setActive(i)
        }
    }
  }

  const triggerSize = compact ? 'min-h-12 px-3 py-2 text-base' : 'min-h-14 px-4 py-3 text-lg'
  const activeId = shown[active] ? `${baseId}-opt-${active}` : undefined

  const search = withSearch && (
    <div className="border-b border-steel-200 p-2">
      <input
        ref={searchRef}
        type="search"
        className="w-full rounded-lg bg-steel-100 px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ksa-yellow"
        placeholder="Buscar…"
        aria-label="Buscar"
        aria-controls={listId}
        aria-activedescendant={activeId}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
        }}
      />
    </div>
  )

  const list = (
    <ul
      ref={listRef}
      id={listId}
      role="listbox"
      tabIndex={-1}
      aria-label={label ?? ariaLabel}
      aria-activedescendant={activeId}
      className={`overflow-y-auto overscroll-contain p-1.5 outline-none ${sheet ? 'max-h-[60vh] pb-[max(0.5rem,env(safe-area-inset-bottom))]' : 'max-h-(--select-max-h)'}`}
    >
      {shown.map((o, i) => {
        const isSel = o.value === value
        return (
          <li
            key={o.value || '__empty'}
            id={`${baseId}-opt-${i}`}
            data-index={i}
            role="option"
            aria-selected={isSel}
            onPointerMove={() => setActive(i)}
            onClick={() => choose(o)}
            className={`relative flex cursor-pointer items-center gap-3 rounded-lg py-2 pr-3 pl-4 ${sheet ? 'min-h-14' : 'min-h-12'} ${i === active ? 'bg-ksa-yellow-soft' : ''}`}
          >
            {isSel && <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-ksa-yellow-dark" aria-hidden="true" />}
            {o.lead && <span className="shrink-0">{o.lead}</span>}
            <span className="min-w-0 flex-1">
              <span className={`block ${isSel ? 'font-bold' : 'font-medium'} text-steel-900`}>{o.label}</span>
              {o.hint && <span className="block text-sm text-steel-600">{o.hint}</span>}
            </span>
            {isSel && (
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-ksa-green" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
          </li>
        )
      })}
      {shown.length === 0 && <li className="px-3 py-3 text-steel-600">Nada coincide con «{query}»</li>}
    </ul>
  )

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKey}>
      {label && (
        <span id={`${baseId}-label`} className="mb-1 block font-semibold">
          {label}
        </span>
      )}
      <button
        ref={buttonRef}
        id={baseId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={label ? `${baseId}-label ${baseId}` : undefined}
        aria-label={label ? undefined : ariaLabel}
        disabled={disabled || busy}
        onClick={() => (open ? close() : openMenu())}
        className={`select-trigger flex w-full items-center gap-3 rounded-xl border-2 bg-white text-left ${triggerSize} ${open ? 'border-ksa-black' : 'border-steel-400'}`}
      >
        {busy ? (
          <span className="flex flex-1 items-center gap-2 text-steel-600">
            <Spinner /> {busyText}
          </span>
        ) : (
          <>
            {selected?.lead && <span className="shrink-0">{selected.lead}</span>}
            <span className="min-w-0 flex-1">
              <span className={`block truncate ${selected ? 'font-semibold text-steel-900' : 'text-steel-600'}`}>
                {selected?.label ?? placeholder}
              </span>
              {selected?.hint && !compact && <span className="block truncate text-sm text-steel-600">{selected.hint}</span>}
            </span>
          </>
        )}
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 shrink-0 text-steel-700 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Para que "required" funcione con la validación del formulario */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          onFocus={() => buttonRef.current?.focus()}
          className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0"
        />
      )}

      {open &&
        createPortal(
          sheet ? (
            <div className="fixed inset-0 z-50 flex flex-col justify-end">
              <div className="select-backdrop absolute inset-0 bg-ksa-black/50" aria-hidden="true" onClick={() => close()} />
              <div ref={panelRef} className="select-sheet relative overflow-hidden rounded-t-2xl border-t-4 border-ksa-yellow bg-white">
                <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-1">
                  <p className="font-display text-xl font-bold">{label ?? ariaLabel ?? 'Elegir'}</p>
                  <button type="button" className="calendar-nav h-11 w-11" aria-label="Cerrar" onClick={() => close()}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
                {search}
                {list}
              </div>
            </div>
          ) : (
            <div
              ref={panelRef}
              style={panelStyle}
              className={`select-panel z-50 overflow-hidden rounded-xl border-2 border-ksa-black bg-white ${dropUp ? 'origin-bottom' : 'origin-top'}`}
            >
              {search}
              {list}
            </div>
          ),
          document.body,
        )}
    </div>
  )
}

/** Punto de color para prioridades */
export function Dot({ className }: { className: string }) {
  return <span className={`block h-3 w-3 rounded-full ${className}`} aria-hidden="true" />
}

/** Círculo con la inicial (clientes, trabajadores) */
export function Initial({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ksa-black font-display text-base font-bold text-ksa-yellow" aria-hidden="true">
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}

/** Círculo con "+" para "nuevo" */
export function PlusBadge() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ksa-yellow text-ksa-black" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
        <path d="M12 6v12M6 12h12" />
      </svg>
    </span>
  )
}
