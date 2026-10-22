import { useEffect, useState } from 'react'
import GalleryCard from './GalleryCard'
import { useIsAdmin } from '../hooks/useIsAdmin'
import { fetchGalleryPhotos } from '../services/galleryPhotos'
import './GalleryPreview.css'

function GalleryPreview({ id, title, items, viewAllHref, viewAllLabel }) {
  const gallery = id === 'saree-gallery' ? 'saree' : 'mehandi'
  const isAdmin = useIsAdmin()
  const [photos, setPhotos] = useState({})

  // load the saved photos for this gallery
  useEffect(() => {
    let cancelled = false
    fetchGalleryPhotos(gallery)
      .then((data) => {
        if (!cancelled) setPhotos(data)
      })
      .catch((err) => console.log(err.message))
    return () => {
      cancelled = true
    }
  }, [gallery])

  const handlePhotoChange = (cardId, photo) => {
    setPhotos((prev) => {
      const next = { ...prev }
      if (photo) next[String(cardId)] = photo
      else delete next[String(cardId)]
      return next
    })
  }

  return (
    <section id={id} className="gallery-preview">
      <div className="gallery-preview-inner">
        <h2>{title}</h2>

        <div className="gallery-grid">
          {items.map((item) => (
            <GalleryCard
              key={item.id}
              image={item.image}
              title={item.title}
              category={item.category}
              gallery={gallery}
              cardId={item.id}
              photo={photos[String(item.id)]}
              isAdmin={isAdmin}
              onPhotoChange={handlePhotoChange}
            />
          ))}
        </div>

        {viewAllLabel && (
          <a href={viewAllHref} className="btn btn-outline view-all-btn">{viewAllLabel}</a>
        )}
      </div>
    </section>
  )
}

export default GalleryPreview