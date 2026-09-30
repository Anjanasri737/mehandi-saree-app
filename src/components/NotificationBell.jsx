import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import './NotificationBell.css'

function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function describe(b) {
  const isSaree = b.service === 'saree'
  return {
    title: isSaree ? '🩷 New Saree Pre-Pleating Booking' : '💚 New Mehandi Booking',
    typeLabel: isSaree ? 'Pleats Type' : 'Mehandi',
    typeValue: isSaree ? b.saree_type : b.mehandi_type,
  }
}

function NotificationBell() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState('')

  // 1. Only the owner (admin) gets the bell
  useEffect(() => {
    let cancelled = false
    if (!user) {
      setIsAdmin(false)
      return
    }
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (cancelled) return
      if (error) console.log(error.message)
      setIsAdmin(data === true)
    })
    return () => { cancelled = true }
  }, [user])

  const loadBookings = useCallback(async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) {
      console.log(error.message)
      setError('Could not load notifications.')
      return
    }
    setError('')
    setItems(data)
  }, [])

  // 2. Load, then listen for new bookings in real time
  useEffect(() => {
    if (!isAdmin) return
    loadBookings()

    const channel = supabase
      .channel('booking-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) =>
          setItems((prev) => [
            payload.new,
            ...prev.filter((i) => i.id !== payload.new.id),
          ])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        (payload) =>
          setItems((prev) =>
            prev.map((i) => (i.id === payload.new.id ? payload.new : i))
          )
      )
      .subscribe()

    // safety net: refresh every 30 seconds in case realtime drops
    const timer = setInterval(loadBookings, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [isAdmin, loadBookings])

  const markRead = async (id) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_read: true } : i)))
    const { error } = await supabase
      .from('bookings')
      .update({ is_read: true })
      .eq('id', id)
    if (error) {
      console.log(error.message)
      loadBookings()
    }
  }

  const markAllRead = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })))
    const { error } = await supabase
      .from('bookings')
      .update({ is_read: true })
      .eq('is_read', false)
    if (error) {
      console.log(error.message)
      loadBookings()
    }
  }

  const closePanel = () => {
    setOpen(false)
    setSelectedId(null)
  }

  if (!isAdmin) return null

  const unread = items.filter((i) => !i.is_read).length
  const selected = items.find((i) => i.id === selectedId)

  return (
    <div className="notif-wrap">
      <button
        type="button"
        className="btn btn-outline notif-btn"
        onClick={() => (open ? closePanel() : setOpen(true))}
        aria-label={`Notifications, ${unread} unread`}
      >
        🔔 Notifications
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>

      {open && (
        <>
          <div className="notif-backdrop" onClick={closePanel} />
          <div className="notif-panel">
            <div className="notif-header">
              <strong>Notifications</strong>
              <button
                type="button"
                className="notif-link"
                onClick={markAllRead}
                disabled={unread === 0}
              >
                Mark All as Read
              </button>
              <button
                type="button"
                className="notif-close"
                onClick={closePanel}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && <p className="notif-error">{error}</p>}

            {selected ? (
              <div className="notif-detail">
                <h4>{describe(selected).title}</h4>
                <dl>
                  <dt>Customer</dt>
                  <dd>{selected.customer_name}</dd>
                  <dt>WhatsApp</dt>
                  <dd>{selected.whatsapp_number}</dd>
                  <dt>Address</dt>
                  <dd>{selected.address}</dd>
                  <dt>{describe(selected).typeLabel}</dt>
                  <dd>{describe(selected).typeValue}</dd>
                  <dt>Date</dt>
                  <dd>{formatDate(selected.event_date)}</dd>
                  <dt>Status</dt>
                  <dd>{selected.status}</dd>
                  <dt>Received</dt>
                  <dd>{new Date(selected.created_at).toLocaleString('en-IN')}</dd>
                </dl>
                <div className="notif-actions">
                  <button type="button" className="notif-link" onClick={() => setSelectedId(null)}>
                    ← Back
                  </button>
                  {!selected.is_read && (
                    <button
                      type="button"
                      className="notif-link"
                      onClick={() => markRead(selected.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ) : items.length === 0 ? (
              <p className="notif-empty">No bookings yet.</p>
            ) : (
              <ul className="notif-list">
                {items.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      className={`notif-item ${b.is_read ? '' : 'unread'}`}
                      onClick={() => setSelectedId(b.id)}
                    >
                      <span className="notif-title">{describe(b).title}</span>
                      <span className="notif-line">
                        {b.customer_name} · {describe(b).typeValue}
                      </span>
                      <span className="notif-line">
                        Date: {formatDate(b.event_date)}
                      </span>
                    </button>
                    {!b.is_read && (
                      <button
                        type="button"
                        className="notif-link notif-mark"
                        onClick={() => markRead(b.id)}
                      >
                        Mark as Read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell