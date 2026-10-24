import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  validatePhoto,
  saveGalleryPhoto,
  deleteGalleryPhoto,
} from '../services/galleryPhotos'
import './GalleryCard.css'

function GalleryCard({
  image,
  title,
  category,
  description,
  gallery,
  cardId,
  photo,
  isAdmin,
  onPhotoChange,
}) {
  const fileInputRef = useRef(null)
  const closeBtnRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // free the temporary preview when it is no longer needed
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // full-size viewer: Escape closes it, the page behind it does not scroll
  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (closeBtnRef.current) closeBtnRef.current.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [lightboxOpen])

  const clearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    setMessage(null)
    if (!file) return

    const problem = validatePhoto(file)
    if (problem) {
      setMessage({ type: 'error', text: problem })
      clearSelection()
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!selectedFile) return
    setBusy(true)
    setMessage(null)
    try {
      const saved = await saveGalleryPhoto(
        gallery,
        cardId,
        selectedFile,
        photo ? photo.path : null
      )
      onPhotoChange(cardId, saved)
      clearSelection()
      setMessage({ type: 'success', text: 'Photo saved.' })
    } catch (err) {
      console.log(err.message)
      setMessage({ type: 'error', text: 'Could not save the photo. Please try again.' })
    }
    setBusy(false)
  }

  const handleDelete = async () => {
    if (!photo) return
    if (!window.confirm(`Delete the photo for "${title}"?`)) return
    setBusy(true)
    setMessage(null)
    try {
      await deleteGalleryPhoto(gallery, cardId, photo.path)
      onPhotoChange(cardId, null)
      setMessage({ type: 'success', text: 'Photo deleted.' })
    } catch (err) {
      console.log(err.message)
      setMessage({ type: 'error', text: 'Could not delete the photo. Please try again.' })
    }
    setBusy(false)
  }

  const shownImage = previewUrl || (photo && photo.url) || image

  return (
    <div className="gallery-card">
      <button
        type="button"
        className="gallery-card-image-btn"
        onClick={() => setLightboxOpen(true)}
        aria-label={`View ${title} photo full size`}
      >
        <img src={shownImage} alt={title} />
      </button>

      <div className="gallery-card-info">
        <span className="gallery-card-category">{category}</span>
        <h4>{title}</h4>
        {description && <p className="gallery-card-desc">{description}</p>}
      </div>

      {isAdmin && (
        <div className="gallery-card-admin">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            hidden
          />

          {selectedFile ? (
            <>
              <button
                type="button"
                className="gallery-card-btn primary"
                onClick={handleSave}
                disabled={busy}
              >
                {busy ? 'Uploading...' : 'Save Photo'}
              </button>
              <button
                type="button"
                className="gallery-card-btn"
                onClick={clearSelection}
                disabled={busy}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="gallery-card-btn"
                onClick={() => fileInputRef.current.click()}
                disabled={busy}
              >
                {photo ? 'Replace Photo' : 'Upload Photo'}
              </button>
              {photo && (
                <button
                  type="button"
                  className="gallery-card-btn danger"
                  onClick={handleDelete}
                  disabled={busy}
                >
                  {busy ? 'Please wait...' : 'Delete Photo'}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {message && <p className={`gallery-card-msg ${message.type}`}>{message.text}</p>}

      {lightboxOpen &&
        createPortal(
          <div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={() => setLightboxOpen(false)}
          >
            <button
              ref={closeBtnRef}
              type="button"
              className="lightbox-close"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close full-size photo"
            >
              ✕
            </button>
            <img
              className="lightbox-image"
              src={shownImage}
              alt={title}
              onClick={(e) => e.stopPropagation()}
            />
            <p className="lightbox-caption">{title}</p>
          </div>,
          document.body
        )}
    </div>
  )
}

export default GalleryCard