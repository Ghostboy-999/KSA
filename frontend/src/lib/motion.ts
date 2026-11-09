import type { CSSProperties } from 'react'

/** Índice para la aparición en cascada (.stagger / .grow-x en index.css) */
export function staggerStyle(i: number): CSSProperties {
  return { '--i': i } as CSSProperties
}
