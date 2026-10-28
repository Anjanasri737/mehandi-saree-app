import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchCategories,
  fetchDesigns,
  uploadDesign,
  updateDesign,
  replaceDesignImage,
  deleteDesign,
  MAX_PER_CATEGORY,
} from '../services/mehandiDesigns'
import './MehandiGallery.css'

function MehandiGallery() {
  const { isAdmin } = useAuth()
  const [categories, setCategories] = useState([])
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeCat, setActiveCat] = useState('bridal')
  const [adminMode, setAdminMode] = useState(true)
  const [lightbox, setLightbox] = useState(null)
  const [broken, setBroken] = useState({})
  const [notice, setNotice] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [form, setForm] = useState({ title: '', description: '', categoryId: 'bridal', file: null })
  const [preview, setPreview] = useState('')

  const showAdmin = isAdmin && adminMode

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchCategories(), fetchDesigns(isAdmin)])
      .then(([cats, list]) => {
        if (cancelled) return
        setCategories(cats)
        setDesigns(list)
        setLoadError('')
      })
      .catch(() => !cancelled && setLoadError('Could not load designs. Please refresh.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const counts = useMemo(() => {
    const c = {}
    designs.forEach((d) => {
      if (showAdmin || d.is_published) c[d.category_id] = (c[d.category_id] || 0) + 1
    })
    return c
  }, [designs, showAdmin])

  const visible = designs.filter(
    (d) => d.category_id === activeCat && (showAdmin || d.is_published) && !broken[d.id]
  )
  const activeName = categories.find((c) => c.id === activeCat)?.name || ''

  const say = (type, text) => setNotice({ type, text })

  const onFile = (e) => {
    const file = e.target.files?.[0] || null
    setForm((f) => ({ ...f, file }))
    setPreview(file ? URL.createObjectURL(file) : '')
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if ((counts[form.categoryId] || 0) >= MAX_PER_CATEGORY) {
      say('error', 'This category already has 50 designs. Delete one first.')
      return
    }
    setBusy(true)
    try {
      const created = await uploadDesign(form)
      setDesigns((prev) => [created, ...prev])
      setForm({ title: '', description: '', categoryId: form.categoryId, file: null })
      setPreview('')
      e.target.reset()
      setActiveCat(created.category_id)
      say('success', 'Design uploaded.')
    } catch (err) {
      say('error', err.message)
    }
    setBusy(false)
  }

  const startEdit = (d) => {
    setEditingId(d.id)
    setEditForm({
      title: d.title,
      description: d.description || '',
      category_id: d.category_id,
      is_published: d.is_published,
    })
  }

  const saveEdit = async (d) => {
    setBusy(true)
    try {
      const updated = await updateDesign(d.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        category_id: editForm.category_id,
        is_published: editForm.is_published,
      })
      setDesigns((prev) => prev.map((x) => (x.id === d.id ? updated : x)))
      setEditingId(null)
      say('success', 'Saved.')
    } catch (err) {
      say('error', err.message)
    }
    setBusy(false)
  }

  const replacePhoto = async (d, file) => {
    if (!file) return
    setBusy(true)
    try {
      const updated = await replaceDesignImage(d, file)
      setDesigns((prev) => prev.map((x) => (x.id === d.id ? updated : x)))
      say('success', 'Photo replaced.')
    } catch (err) {
      say('error', err.message)
    }
    setBusy(false)
  }

  const remove = async (d) => {
    if (!window.confirm(`Delete "${d.title}" permanently?`)) return
    setBusy(true)
    try {
      await deleteDesign(d)
      setDesigns((prev) => prev.filter((x) => x.id !== d.id))
      say('success', 'Deleted.')
    } catch (err) {
      say('error', err.message)
    }
    setBusy(false)
  }

  const shareLink = (d) =>
    `https://wa.me/?text=${encodeURIComponent(`${d.title} - Anjana Mehandi & Saree Pleats\n${d.image_url}`)}`

  return (
    <main className="mg-page">
      <div className="mg-inner">
        <a href="#home" className="mg-back">← Back to Home</a>
        <h1>Mehandi Designs Gallery</h1>

        {isAdmin && (
          <label className="mg-toggle">
            <input type="checkbox" checked={adminMode} onChange={(e) => setAdminMode(e.target.checked)} />
            Admin mode (manage designs)
          </label>
        )}

        {notice.text && <p className={`mg-notice mg-${notice.type}`}>{notice.text}</p>}

        {showAdmin && (
          <form className="mg-admin" onSubmit={handleUpload}>
            <h2>Upload a new design</h2>
            <label>
              Category
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                {categories.map((c) => {
                  const n = counts[c.id] || 0
                  return (
                    <option key={c.id} value={c.id} disabled={n >= MAX_PER_CATEGORY}>
                      {c.name} ({n}/{MAX_PER_CATEGORY})
                    </option>
                  )
                })}
              </select>
            </label>
            <label>
              Design name
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
            <label>
              Description (optional)
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label>
              Photo (JPG, PNG or WebP, max 5 MB)
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} required />
            </label>
            {preview && <img src={preview} alt="Preview" className="mg-preview" />}
            <button type="submit" disabled={busy}>{busy ? 'Please wait...' : 'Upload design'}</button>
          </form>
        )}

        <div className="mg-tabs">
          {categories.map((c) => (
            <button
              key={c.id}
              className={c.id === activeCat ? 'mg-tab active' : 'mg-tab'}
              onClick={() => setActiveCat(c.id)}
            >
              {c.name}
              <span>{showAdmin ? `${counts[c.id] || 0}/${MAX_PER_CATEGORY}` : counts[c.id] || 0}</span>
            </button>
          ))}
        </div>

        <h2 className="mg-cat-title">{activeName}</h2>

        {loading && <p className="mg-empty">Loading designs...</p>}
        {loadError && <p className="mg-notice mg-error">{loadError}</p>}
        {!loading && !loadError && visible.length === 0 && (
          <p className="mg-empty">Designs coming soon</p>
        )}

        <div className="mg-grid">
          {visible.map((d) => (
            <div key={d.id} className="mg-card">
              <img
                src={d.image_url}
                alt={d.title}
                loading="lazy"
                onClick={() => setLightbox(d)}
                onError={() => !showAdmin && setBroken((b) => ({ ...b, [d.id]: true }))}
              />
              <div className="mg-card-body">
                {editingId === d.id ? (
                  <>
                    <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                    <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                    <select value={editForm.category_id} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <label className="mg-check">
                      <input type="checkbox" checked={editForm.is_published} onChange={(e) => setEditForm({ ...editForm, is_published: e.target.checked })} />
                      Published
                    </label>
                    <div className="mg-row">
                      <button disabled={busy} onClick={() => saveEdit(d)}>Save</button>
                      <button className="mg-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>{d.title}</h3>
                    {d.description && <p>{d.description}</p>}
                    {showAdmin && !d.is_published && <span className="mg-badge">Hidden from customers</span>}
                    <div className="mg-row">
                      <a className="mg-btn" href={`#booking-mehandi/${d.id}`}>Book this design</a>
                      <a className="mg-btn mg-ghost" href={shareLink(d)} target="_blank" rel="noreferrer">WhatsApp share</a>
                    </div>
                    {showAdmin && (
                      <div className="mg-row mg-admin-row">
                        <button className="mg-ghost" onClick={() => startEdit(d)}>Edit</button>
                        <label className="mg-ghost mg-file">
                          Replace photo
                          <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => replacePhoto(d, e.target.files?.[0])} />
                        </label>
                        <button className="mg-danger" disabled={busy} onClick={() => remove(d)}>Delete</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightbox && (
        <div className="mg-lightbox" onClick={() => setLightbox(null)}>
          <button className="mg-close" aria-label="Close">✕</button>
          <img src={lightbox.image_url} alt={lightbox.title} onClick={(e) => e.stopPropagation()} />
          <p>{lightbox.title}</p>
        </div>
      )}
    </main>
  )
}

export default MehandiGallery