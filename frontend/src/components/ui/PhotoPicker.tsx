import { useId, useRef } from 'react'

interface Props {
  label: string
  multiple?: boolean
  capture?: boolean
  disabled?: boolean
  /** Texto bajo el botón, p. ej. "2 fotos seleccionadas" */
  hint?: string
  onPick: (files: File[]) => void
}

/** Botón grande para tomar o elegir fotos (el selector nativo sale en inglés y es diminuto) */
export function PhotoPicker({ label, multiple, capture, disabled, hint, onPick }: Props) {
  const id = useId()
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div>
      <input
        ref={ref}
        id={id}
        type="file"
        accept="image/*"
        multiple={multiple}
        capture={capture ? 'environment' : undefined}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onPick(files)
          e.target.value = ''
        }}
      />
      <label
        htmlFor={id}
        className={`btn-touch btn-ghost inline-flex w-full cursor-pointer items-center justify-center gap-2 sm:w-auto ${disabled ? 'pointer-events-none opacity-55' : ''}`}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        {label}
      </label>
      {hint && <p className="mt-1 text-sm text-steel-600">{hint}</p>}
    </div>
  )
}
