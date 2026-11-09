import { useState } from 'react'

interface Props {
  src: string
  alt: string
  className?: string
}

/** Imagen que muestra un esqueleto mientras descarga y aparece con un fundido */
export function FadeImage({ src, alt, className = '' }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <span className={`relative inline-block overflow-hidden ${className}`}>
      {!loaded && !failed && <span className="skeleton absolute inset-0" aria-hidden="true" />}
      {failed ? (
        <span className="flex h-full w-full items-center justify-center bg-steel-100 p-2 text-center text-xs text-steel-600">
          No se pudo cargar la foto
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </span>
  )
}
