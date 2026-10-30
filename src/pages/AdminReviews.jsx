import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import './AdminReviews.css'

const TABS = ['pending', 'approved', 'rejected', 'all']
const serviceLabel = (s) => (s === 'saree' ? 'Saree Pre-Pleating' : 'Mehandi')

function AdminReviews() {
  const { isAdmin } = useAuth()
  const [rows, setRows] = useState([])
  const [tab, setTab] = useState('pending')
  const [loadingRows, setLoadingRows] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [replyFor, setReplyFor] = useState(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    supabase
      .from('reviews')
      .select('*, bookings(customer_name, event_date, status, service)')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError('Could not load reviews.')
        else setRows(data)
        setLoadingRows(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const stats = useMemo(() => {
    const approved = rows.filter((r) => r.status === 'approved')
    const avg = approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : 0
    return {
      pending: rows.filter((r) => r.status === 'pending').length,
      approved: approved.length,
      rejected: rows.filter((r) => r.status === 'rejected').length,
      avg,
    }
  }, [rows])

  const patch = async (id, changes) => {
    setBusyId(id)
    setError('')
    const { data, error: err } = await supabase
      .from('reviews')
      .update(changes)
      .eq('id', id)
      .select('*, bookings(customer_name, event_date, status, service)')
      .single()
    if (err) setError('Could not save that change.')
    else setRows((prev) => prev.map((r) => (r.id === id ? data : r)))
    setBusyId(null)
    return !err
  }

  const removePhoto = async (r) => {
    if (!window.confirm('Remove this photo from the review?')) return
    const ok = await patch(r.id, { photo_url: null, photo_path: null })
    if (ok && r.photo_path) await supabase.storage.from('review-photos').remove([r.photo_path])
  }

  const deleteReview = async (r) => {
    if (!window.confirm('Delete this review permanently?')) return
    setBusyId(r.id)
    const { error: err } = await supabase.from('reviews').delete().eq('id', r.id)
    if (err) setError('Could not delete that review.')
    else {
      if (r.photo_path) await supabase.storage.from('review-photos').remove([r.photo_path])
      setRows((prev) => prev.filter((x) => x.id !== r.id))
    }
    setBusyId(null)
  }

  const saveReply = async (r) => {
    const text = replyText.trim()
    const ok = await patch(r.id, { admin_reply: text || null })
    if (ok) setReplyFor(null)
  }

  if (!isAdmin) {
    return (
      <main className="ar-page">
        <div className="ar-inner">
          <a href="#home" className="ar-back">← Back to Home</a>
          <p className="ar-empty">Only the business owner can open this page.</p>
        </div>
      </main>
    )
  }

  const shown = rows.filter((r) => tab === 'all' || r.status === tab)

  return (
    <main className="ar-page">
      <div className="ar-inner">
        <a href="#home" className="ar-back">← Back to Home</a>
        <h1>Manage Reviews</h1>
        <p className="ar-hint">
          Approve genuine reviews, including honest low ratings. Reject only spam, abuse or inappropriate photos.
          Customer stars and text can never be edited.
        </p>

        <div className="ar-stats">
          <div><strong>{stats.pending}</strong><span>Pending</span></div>
          <div><strong>{stats.approved}</strong><span>Approved</span></div>
          <div><strong>{stats.rejected}</strong><span>Rejected</span></div>
          <div><strong>{stats.approved ? stats.avg.toFixed(1) : '-'}</strong><span>Average rating</span></div>
        </div>

        {error && <p className="ar-error" role="alert">{error}</p>}

        <div className="ar-tabs">
          {TABS.map((t) => (
            <button key={t} className={t === tab ? 'ar-tab active' : 'ar-tab'} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loadingRows && <p className="ar-empty">Loading reviews...</p>}
        {!loadingRows && shown.length === 0 && <p className="ar-empty">No reviews here.</p>}

        <div className="ar-list">
          {shown.map((r) => (
            <article key={r.id} className="ar-card">
              <div className="ar-top">
                <span className="ar-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <span className={`ar-badge ${r.status}`}>{r.status}</span>
              </div>
              <p className="ar-msg">{r.message}</p>
              {r.photo_url && <img className="ar-photo" src={r.photo_url} alt="Customer's work" loading="lazy" />}
              <p className="ar-meta">
                <strong>{r.display_name}</strong> · {serviceLabel(r.service)} · {new Date(r.created_at).toLocaleDateString('en-IN')}
              </p>
              <p className="ar-meta">
                Booking: {r.bookings?.customer_name || 'unknown'}, event {r.bookings?.event_date || '-'},
                status <strong>{r.bookings?.status || '-'}</strong>
              </p>
              {r.admin_reply && <div className="ar-reply"><strong>Your reply:</strong> {r.admin_reply}</div>}

              {replyFor === r.id ? (
                <div className="ar-replybox">
                  <textarea rows={3} maxLength={1000} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a public reply..." />
                  <div className="ar-actions">
                    <button disabled={busyId === r.id} onClick={() => saveReply(r)}>Save reply</button>
                    <button className="ar-ghost" onClick={() => setReplyFor(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="ar-actions">
                  {r.status !== 'approved' && <button disabled={busyId === r.id} onClick={() => patch(r.id, { status: 'approved' })}>Approve</button>}
                  {r.status !== 'rejected' && <button className="ar-ghost" disabled={busyId === r.id} onClick={() => patch(r.id, { status: 'rejected' })}>Reject</button>}
                  {r.status !== 'pending' && <button className="ar-ghost" disabled={busyId === r.id} onClick={() => patch(r.id, { status: 'pending' })}>Set pending</button>}
                  <button className="ar-ghost" onClick={() => { setReplyFor(r.id); setReplyText(r.admin_reply || '') }}>Reply</button>
                  {r.photo_url && <button className="ar-ghost" onClick={() => removePhoto(r)}>Remove photo</button>}
                  <button className="ar-danger" disabled={busyId === r.id} onClick={() => deleteReview(r)}>Delete</button>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}

export default AdminReviews