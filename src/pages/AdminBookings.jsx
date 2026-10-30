import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import './AdminBookings.css'

const FILTERS = ['all', 'pending', 'completed']

function AdminBookings() {
  const { isAdmin } = useAuth()
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [loadingRows, setLoadingRows] = useState(true)

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    supabase
      .from('bookings')
      .select('id, customer_name, whatsapp_number, service, mehandi_type, event_date, status, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError('Could not load bookings. Please run the SQL step first.')
        else setRows(data)
        setLoadingRows(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const setStatus = async (id, status) => {
    setBusyId(id)
    setError('')
    const { data, error: err } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select('id, status')
      .single()
    if (err) setError('Could not update this booking.')
    else setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: data.status } : r)))
    setBusyId(null)
  }

  if (!isAdmin) {
    return (
      <main className="ab-page">
        <div className="ab-inner">
          <a href="#home" className="ab-back">← Back to Home</a>
          <p className="ab-empty">Only the business owner can open this page.</p>
        </div>
      </main>
    )
  }

  const shown = rows.filter((r) => filter === 'all' || (r.status || '').toLowerCase() === filter)
  const count = (f) => rows.filter((r) => f === 'all' || (r.status || '').toLowerCase() === f).length

  return (
    <main className="ab-page">
      <div className="ab-inner">
        <a href="#home" className="ab-back">← Back to Home</a>
        <h1>Manage Bookings</h1>
        <p className="ab-hint">
          Mark a booking <strong>Completed</strong> after the work is done. That customer can then write a review.
        </p>

        {error && <p className="ab-error" role="alert">{error}</p>}

        <div className="ab-tabs">
          {FILTERS.map((f) => (
            <button key={f} className={f === filter ? 'ab-tab active' : 'ab-tab'} onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)} <span>{count(f)}</span>
            </button>
          ))}
        </div>

        {loadingRows && <p className="ab-empty">Loading bookings...</p>}
        {!loadingRows && shown.length === 0 && <p className="ab-empty">No bookings here.</p>}

        <div className="ab-list">
          {shown.map((r) => {
            const done = (r.status || '').toLowerCase() === 'completed'
            return (
              <div key={r.id} className="ab-card">
                <div className="ab-top">
                  <strong>{r.customer_name}</strong>
                  <span className={done ? 'ab-badge done' : 'ab-badge'}>{r.status || 'pending'}</span>
                </div>
                <p>
                  {r.service === 'saree' ? 'Saree Pre-Pleating' : `Mehandi${r.mehandi_type ? ` - ${r.mehandi_type}` : ''}`}
                </p>
                <p>Event date: {r.event_date}</p>
                <p>
                  <a href={`https://wa.me/91${r.whatsapp_number}`} target="_blank" rel="noreferrer">
                    WhatsApp {r.whatsapp_number}
                  </a>
                </p>
                <div className="ab-actions">
                  {done ? (
                    <button className="ab-ghost" disabled={busyId === r.id} onClick={() => setStatus(r.id, 'pending')}>
                      Undo (mark pending)
                    </button>
                  ) : (
                    <button disabled={busyId === r.id} onClick={() => setStatus(r.id, 'completed')}>
                      {busyId === r.id ? 'Saving...' : 'Mark Completed'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

export default AdminBookings