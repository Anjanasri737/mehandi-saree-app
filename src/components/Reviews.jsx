import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import './Reviews.css'

const MAX_MB = 5
const TYPES = ['image/jpeg', 'image/png', 'image/webp']
const serviceLabel = (s) => (s === 'saree' ? 'Saree Pre-Pleating' : 'Mehandi')

function Stars({ value }) {
  const n = Math.round(value)
  return (
    <span className="rv-stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? 'on' : ''}>★</span>
      ))}
    </span>
  )
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']
  const shown = hover || value
  return (
    <div className="rv-picker" role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          className={i <= shown ? 'on' : ''}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        >
          ★
        </button>
      ))}
      <span className="rv-picker-label">{labels[shown] || 'Tap a star'}</span>
    </div>
  )
}

function ReviewModal({ eligible, user, onClose, onDone }) {
  const [bookingId, setBookingId] = useState(eligible[0].id)
  const [name, setName] = useState((eligible[0].customer_name || '').slice(0, 40))
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const booking = eligible.find((b) => b.id === bookingId) || eligible[0]

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const pickFile = (e) => {
    const f = e.target.files?.[0]
    setError('')
    if (!f) return
    if (!TYPES.includes(f.type)) return setError('Please choose a JPG, PNG or WebP photo.')
    if (f.size > MAX_MB * 1024 * 1024) return setError(`Photo must be under ${MAX_MB} MB.`)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!rating) return setError('Please choose a star rating.')
    if (!name.trim()) return setError('Please enter the name to show with your review.')
    if (message.trim().length < 10) return setError('Please write at least 10 characters of feedback.')

    setBusy(true)
    let photoPath = null
    let photoUrl = null
    try {
      if (file) {
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
        photoPath = `${user.id}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('review-photos')
          .upload(photoPath, file, { contentType: file.type, upsert: false })
        if (upErr) throw upErr
        photoUrl = supabase.storage.from('review-photos').getPublicUrl(photoPath).data.publicUrl
      }

      const { error: insErr } = await supabase.from('reviews').insert({
        booking_id: booking.id,
        user_id: user.id,
        display_name: name.trim().slice(0, 40),
        service: booking.service || 'mehandi',
        rating,
        message: message.trim(),
        photo_path: photoPath,
        photo_url: photoUrl,
      })
      if (insErr) {
        if (photoPath) await supabase.storage.from('review-photos').remove([photoPath])
        throw insErr
      }
      onDone()
    } catch (err) {
      const msg = String(err?.message || '')
      if (err?.code === '23505' || msg.includes('duplicate')) setError('You have already reviewed this booking.')
      else if (msg.includes('row-level security')) setError('This booking is not eligible for a review yet.')
      else setError('Could not submit your review. Please try again.')
      setBusy(false)
    }
  }

  return createPortal(
    <div className="rv-overlay" onClick={onClose}>
      <form className="rv-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="rv-x" onClick={onClose} aria-label="Close">✕</button>
        <h3>Write a Review</h3>
        <p className="rv-modal-sub">Thank you for choosing us. Tell us about your experience.</p>

        {eligible.length > 1 ? (
          <label>
            Booking
            <select value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
              {eligible.map((b) => (
                <option key={b.id} value={b.id}>
                  {serviceLabel(b.service)} - {b.event_date}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Service
            <input value={`${serviceLabel(booking.service)} - ${booking.event_date}`} readOnly />
          </label>
        )}

        <label>
          Name shown with your review
          <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya S." />
        </label>

        <div className="rv-field">
          <span>Your rating</span>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <label>
          Your feedback
          <textarea
            rows={4}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How was the design, the work and the service?"
          />
          <small>{message.length}/1000</small>
        </label>

        <label>
          Photo of the work (optional)
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} />
          <small>JPG, PNG or WebP, up to {MAX_MB} MB</small>
        </label>
        {preview && <img className="rv-preview" src={preview} alt="Your photo preview" />}

        {error && <p className="rv-error" role="alert">{error}</p>}

        <button type="submit" className="rv-submit" disabled={busy}>
          {busy ? 'Submitting...' : 'Submit Review'}
        </button>
        <p className="rv-fine">Your review is shown after it has been approved.</p>
      </form>
    </div>,
    document.body
  )
}

function Reviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [eligible, setEligible] = useState([])
  const [waiting, setWaiting] = useState(0)
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const loadReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from('public_reviews')
      .select('id, display_name, service, rating, message, photo_url, admin_reply, created_at')
      .order('created_at', { ascending: false })
    if (error) setLoadError('Could not load reviews right now.')
    else {
      setReviews(data)
      setLoadError('')
    }
    setLoading(false)
  }, [])

  const loadMine = useCallback(async () => {
    if (!user) {
      setEligible([])
      setWaiting(0)
      return
    }
    const [{ data: bks }, { data: mine }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, service, customer_name, event_date, status')
        .eq('user_id', user.id)
        .ilike('status', 'completed'),
      supabase.from('reviews').select('booking_id, status').eq('user_id', user.id),
    ])
    const done = new Set((mine || []).map((r) => r.booking_id))
    setEligible((bks || []).filter((b) => !done.has(b.id)))
    setWaiting((mine || []).filter((r) => r.status === 'pending').length)
  }, [user])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])
  useEffect(() => {
    loadMine()
  }, [loadMine])

  const stats = useMemo(() => {
    const count = reviews.length
    const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
    return { count, avg }
  }, [reviews])

  const onWrite = () => {
    setNotice('')
    if (!user) {
      window.location.hash = '#login'
      return
    }
    if (eligible.length === 0) {
      setNotice(
        waiting > 0
          ? 'Your review is waiting for approval. Thank you!'
          : 'You can write a review once your booking has been marked Completed.'
      )
      return
    }
    setOpen(true)
  }

  const onDone = async () => {
    setOpen(false)
    setNotice('Thank you! Your review was submitted and will appear after approval.')
    await loadMine()
  }

  return (
    <section id="reviews" className="rv-section">
      <div className="rv-inner">
        <h2>Customer Reviews</h2>

        {stats.count > 0 && (
          <div className="rv-summary">
            <div className="rv-avg">{stats.avg.toFixed(1)}</div>
            <div>
              <Stars value={stats.avg} />
              <p>Based on {stats.count} verified {stats.count === 1 ? 'review' : 'reviews'}</p>
            </div>
          </div>
        )}

        <button type="button" className="rv-write" onClick={onWrite}>✍ Write a Review</button>
        {!user && <p className="rv-hint">Log in with the account you used to book.</p>}
        {notice && <p className="rv-notice" role="status">{notice}</p>}

        {loading && <p className="rv-empty">Loading reviews...</p>}
        {loadError && <p className="rv-error">{loadError}</p>}
        {!loading && !loadError && reviews.length === 0 && (
          <p className="rv-empty">No reviews yet. Be the first customer to share your experience.</p>
        )}

        <div className="rv-grid">
          {reviews.map((r) => (
            <article key={r.id} className="rv-item">
              <div className="rv-item-top">
                <Stars value={r.rating} />
                <span className="rv-verified">✔ Verified Customer</span>
              </div>
              <p className="rv-text">{r.message}</p>
              {r.photo_url && <img className="rv-photo" src={r.photo_url} alt="Customer's work" loading="lazy" />}
              <p className="rv-who">
                <strong>{r.display_name}</strong>
                <span>{serviceLabel(r.service)} · {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </p>
              {r.admin_reply && (
                <div className="rv-reply">
                  <strong>Reply from Anjana</strong>
                  <p>{r.admin_reply}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      {open && eligible.length > 0 && (
        <ReviewModal eligible={eligible} user={user} onClose={() => setOpen(false)} onDone={onDone} />
      )}
    </section>
  )
}

export default Reviews