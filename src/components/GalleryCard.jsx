import { useEffect, useRef, useState } from 'react'
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
  gallery,
  cardId,
  photo,
  isAdmin,
  onPhotoChange,
}) {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  // free the temporary preview when it is no longer needed
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

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
      <img src={shownImage} alt={title} />
      <div className="gallery-card-info">
        <span className="gallery-card-category">{category}</span>
        <h4>{title}</h4>
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
    </div>
  )
}

export default GalleryCard