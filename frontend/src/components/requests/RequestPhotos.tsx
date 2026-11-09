import { useEffect, useState } from 'react'
import { signedPhotoUrls } from '../../hooks/useClientRequests'

export function RequestPhotos({ paths }: { paths: string[] }) {
  const [urls, setUrls] = useState<string[]>([])
  const key = paths.join('|')

  useEffect(() => {
    let alive = true
    void signedPhotoUrls(key ? key.split('|') : []).then((u) => {
      if (alive) setUrls(u)
    })
    return () => {
      alive = false
    }
  }, [key])

  if (urls.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {urls.map((u) => (
        <a key={u} href={u} target="_blank" rel="noreferrer">
          <img src={u} alt="Foto de la solicitud" className="h-20 w-20 rounded-lg object-cover" />
        </a>
      ))}
    </div>
  )
}
