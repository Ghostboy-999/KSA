import { useEffect, useState } from 'react'
import { signedPhotoUrls } from '../../hooks/useClientRequests'
import { FadeImage } from '../ui/FadeImage'

export function RequestPhotos({ paths }: { paths: string[] }) {
  const key = paths.join('|')
  const [result, setResult] = useState<{ key: string; urls: string[] } | null>(null)

  useEffect(() => {
    let alive = true
    void signedPhotoUrls(key ? key.split('|') : []).then((urls) => {
      if (alive) setResult({ key, urls })
    })
    return () => {
      alive = false
    }
  }, [key])

  if (paths.length === 0) return null
  const urls = result?.key === key ? result.urls : null

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {urls === null
        ? paths.map((p) => <span key={p} className="skeleton h-20 w-20 rounded-lg" aria-hidden="true" />)
        : urls.map((u) => (
            <a key={u} href={u} target="_blank" rel="noreferrer" className="rounded-lg">
              <FadeImage src={u} alt="Foto de la solicitud" className="h-20 w-20 rounded-lg" />
            </a>
          ))}
    </div>
  )
}
