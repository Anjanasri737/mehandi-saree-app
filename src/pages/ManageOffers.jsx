import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import './ManageServicePrices.css'
import './ManageOffers.css'

const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN')
const pad = (n) => String(n).padStart(2, '0')

function toDateInput(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const fmt = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function statusOf(o) {
  const now = Date.now()
  if (now > new Date(o.end_date).getTime()) return 'expired'
  if (!o.is_active) return 'off'
  if (now < new Date(o.start_date).getTime()) return 'scheduled'
  return 'live'
}

const STATUS_LABEL = {
  live: 'Live now',
  scheduled: 'Scheduled',
  expired: 'Expired',
  off: 'Off',
}

// ---------- Form used for both "Create" and "Edit" ----------
function OfferEditor({ initial, services, onSave, onCancel, saving }) {
  const [f, setF] = useState({
    offer_name: initial.offer_name ?? '',
    discount_type: initial.discount_type ?? 'percentage',
    discount_value: initial.discount_value ?? '',
    applies_to_all: initial.applies_to_all ?? false,
    selected: initial.applicable_services ?? [],
    minimum_booking_amount: initial.minimum_booking_amount ?? '',
    maximum_discount: initial.maximum_discount ?? '',
    start: initial.start_date ? toDateInput(initial.start_date) : toDateInput(new Date().toISOString()),
    end: initial.end_date ? toDateInput(initial.end_date) : '',
    is_active: initial.is_active ?? true,
  })
  const [err, setErr] = useState('')

  const set = (key) => (e) => setF({ ...f, [key]: e.target.value })

  const toggleService = (id) => {
    setF((prev) => ({
      ...prev,
      selected: prev.selected.includes(id)
        ? prev.selected.filter((x) => x !== id)
        : [...prev.selected, id],
    }))
  }

  const toggleGroup = (category) => {
    const ids = services.filter((s) => s.service_category === category).map((s) => s.id)
    const allOn = ids.every((id) => f.selected.includes(id))
    setF((prev) => ({
      ...prev,
      selected: allOn
        ? prev.selected.filter((id) => !ids.includes(id))
        : [...new Set([...prev.selected, ...ids])],
    }))
  }

  function submit(e) {
    e.preventDefault()
    setErr('')

    const name = f.offer_name.trim()
    const value = Number(f.discount_value)
    const minBook = f.minimum_booking_amount === '' ? 0 : Number(f.minimum_booking_amount)
    const maxDisc = f.maximum_discount === '' ? null : Number(f.maximum_discount)

    if (!name) return setErr('Please enter an offer name.')
    if (f.discount_value === '' || Number.isNaN(value) || value <= 0)
      return setErr('Please enter a discount above 0.')
    if (f.discount_type === 'percentage' && value > 100)
      return setErr('A percentage discount cannot be more than 100.')
    if (Number.isNaN(minBook) || minBook < 0) return setErr('Minimum booking amount must be 0 or more.')
    if (maxDisc !== null && (Number.isNaN(maxDisc) || maxDisc <= 0))
      return setErr('Maximum discount must be above 0, or leave it empty.')
    if (!f.applies_to_all && f.selected.length === 0)
      return setErr('Choose at least one service, or tick "Apply to all services".')
    if (!f.start || !f.end) return setErr('Please choose a start date and an end date.')
    if (f.end < f.start) return setErr('The end date cannot be before the start date.')

    onSave({
      offer_name: name,
      discount_type: f.discount_type,
      discount_value: value,
      applies_to_all: f.applies_to_all,
      applicable_services: f.applies_to_all ? [] : f.selected,
      minimum_booking_amount: minBook,
      maximum_discount: maxDisc,
      start_date: new Date(f.start + 'T00:00:00').toISOString(),
      end_date: new Date(f.end + 'T23:59:59').toISOString(),
      is_active: f.is_active,
    })
  }

  const groups = [
    { key: 'mehandi', label: 'Mehandi services' },
    { key: 'saree', label: 'Saree Pre-Pleating services' },
  ]

  return (
    <form className="msp-editor" onSubmit={submit}>
      <div className="msp-grid">
        <label>
          Offer name
          <input value={f.offer_name} onChange={set('offer_name')} placeholder="e.g. Festival Special" />
        </label>
        <label>
          Discount type
          <select value={f.discount_type} onChange={set('discount_type')}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed amount (₹)</option>
          </select>
        </label>
        <label>
          {f.discount_type === 'percentage' ? 'Discount (%)' : 'Discount amount (₹)'}
          <input type="number" min="0" step="0.01" value={f.discount_value} onChange={set('discount_value')} />
        </label>
        <label>
          Minimum booking amount (₹, optional)
          <input type="number" min="0" step="0.01" value={f.minimum_booking_amount} onChange={set('minimum_booking_amount')} />
        </label>
        <label>
          Maximum discount (₹, optional)
          <input type="number" min="0" step="0.01" value={f.maximum_discount} onChange={set('maximum_discount')} />
        </label>
        <span />
        <label>
          Start date
          <input type="date" value={f.start} onChange={set('start')} />
        </label>
        <label>
          End date (offer lasts through this day)
          <input type="date" value={f.end} onChange={set('end')} />
        </label>
      </div>

      <label className="mo-check mo-top">
        <input
          type="checkbox"
          checked={f.applies_to_all}
          onChange={(e) => setF({ ...f, applies_to_all: e.target.checked })}
        />
        Apply to all services
      </label>

      {!f.applies_to_all && (
        <div className="mo-picker">
          {groups.map((g) => {
            const list = services.filter((s) => s.service_category === g.key)
            if (list.length === 0) return null
            return (
              <div className="mo-group" key={g.key}>
                <div className="mo-group-head">
                  <strong>{g.label}</strong>
                  <button type="button" className="mo-link" onClick={() => toggleGroup(g.key)}>
                    Select / clear all
                  </button>
                </div>
                {list.map((s) => (
                  <label className="mo-check" key={s.id}>
                    <input
                      type="checkbox"
                      checked={f.selected.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                    />
                    {s.service_name}
                    {!s.is_active && <em className="mo-hidden"> (hidden)</em>}
                  </label>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <label className="mo-check mo-top">
        <input
          type="checkbox"
          checked={f.is_active}
          onChange={(e) => setF({ ...f, is_active: e.target.checked })}
        />
        Offer is active
      </label>

      {err && <p className="msp-error">{err}</p>}
      <div className="msp-actions">
        <button type="submit" className="msp-btn msp-btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Offer'}
        </button>
        <button type="button" className="msp-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

// ---------- Main page ----------
export default function ManageOffers() {
  const { user, isAdmin } = useAuth()
  const [offers, setOffers] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [o, s] = await Promise.all([
      supabase.from('offers').select('*').order('created_at', { ascending: false }),
      supabase
        .from('services')
        .select('id, service_name, service_category, is_active')
        .order('sort_order')
        .order('service_name'),
    ])
    if (o.error) setMessage({ type: 'error', text: 'Could not load offers: ' + o.error.message })
    else setOffers(o.data)
    if (!s.error) setServices(s.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user && isAdmin) load()
  }, [user, isAdmin, load])

  async function addOffer(payload) {
    setSaving(true)
    const { error } = await supabase.from('offers').insert(payload)
    setSaving(false)
    if (error) return setMessage({ type: 'error', text: error.message })
    setAdding(false)
    setMessage({ type: 'ok', text: 'Offer saved. It shows on the website during its dates.' })
    load()
  }

  async function saveEdit(id, payload) {
    setSaving(true)
    const { error } = await supabase.from('offers').update(payload).eq('id', id)
    setSaving(false)
    if (error) return setMessage({ type: 'error', text: error.message })
    setEditingId(null)
    setMessage({ type: 'ok', text: 'Offer updated.' })
    load()
  }

  async function toggleActive(o) {
    const { error } = await supabase.from('offers').update({ is_active: !o.is_active }).eq('id', o.id)
    if (error) return setMessage({ type: 'error', text: error.message })
    setMessage({ type: 'ok', text: o.is_active ? 'Offer turned off.' : 'Offer turned on.' })
    load()
  }

  async function removeOffer(o) {
    if (!window.confirm(`Delete the offer "${o.offer_name}"? Old bookings keep their saved discount. You can use Turn off instead.`)) return
    const { error } = await supabase.from('offers').delete().eq('id', o.id)
    if (error) return setMessage({ type: 'error', text: error.message })
    setMessage({ type: 'ok', text: 'Offer deleted.' })
    load()
  }

  if (!user || !isAdmin) {
    return (
      <div className="msp-page msp-center">
        <p>Only the admin can view this page.</p>
        <a href="#home" className="msp-btn msp-back">← Back to Home</a>
      </div>
    )
  }

  const nameOf = (id) => services.find((s) => s.id === id)?.service_name

  return (
    <div className="msp-page">
      <a href="#home" className="msp-btn msp-back">← Back to Home</a>
      <h2>Manage Offers &amp; Discounts</h2>
      <p className="msp-sub">
        Customers see an active offer between its start and end dates. Expired offers stop on their own.
        If several offers match a service, the customer gets only the single best one.
        A fixed amount (like ₹50 OFF) is taken off the booking total once.
      </p>

      {message && <p className={message.type === 'ok' ? 'msp-ok' : 'msp-error'}>{message.text}</p>}

      {!adding ? (
        <button className="msp-btn msp-btn-primary" onClick={() => { setAdding(true); setEditingId(null) }}>
          + Create New Offer
        </button>
      ) : (
        <div className="msp-card">
          <h3>Create New Offer</h3>
          <OfferEditor
            initial={{}}
            services={services}
            saving={saving}
            onSave={addOffer}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {loading && <p>Loading...</p>}

      {offers.map((o) => {
        const status = statusOf(o)
        const names = (o.applicable_services || []).map(nameOf).filter(Boolean)
        return (
          <div className="msp-card" key={o.id}>
            <div className="msp-row">
              <div>
                <h3>
                  {o.offer_name}{' '}
                  <span className={`msp-badge mo-${status}`}>{STATUS_LABEL[status]}</span>
                </h3>
                <p className="msp-price">
                  {o.discount_type === 'percentage'
                    ? `${Number(o.discount_value)}% OFF`
                    : `${rupees(o.discount_value)} OFF`}
                </p>
                <p className="msp-desc">
                  <strong>Applies to:</strong>{' '}
                  {o.applies_to_all ? 'All services' : names.length ? names.join(', ') : 'No services selected'}
                </p>
                <p className="msp-desc">
                  <strong>Dates:</strong> {fmt(o.start_date)} to {fmt(o.end_date)}
                </p>
                {Number(o.minimum_booking_amount) > 0 && (
                  <p className="msp-desc"><strong>Minimum booking:</strong> {rupees(o.minimum_booking_amount)}</p>
                )}
                {o.maximum_discount != null && (
                  <p className="msp-desc"><strong>Maximum discount:</strong> {rupees(o.maximum_discount)}</p>
                )}
              </div>
              <div className="msp-actions">
                <button className="msp-btn" onClick={() => { setEditingId(editingId === o.id ? null : o.id); setAdding(false) }}>
                  {editingId === o.id ? 'Close' : 'Edit'}
                </button>
                <button className="msp-btn" onClick={() => toggleActive(o)}>
                  {o.is_active ? 'Turn off' : 'Turn on'}
                </button>
                <button className="msp-btn msp-btn-danger" onClick={() => removeOffer(o)}>Delete</button>
              </div>
            </div>
            {editingId === o.id && (
              <OfferEditor
                initial={o}
                services={services}
                saving={saving}
                onSave={(payload) => saveEdit(o.id, payload)}
                onCancel={() => setEditingId(null)}
              />
            )}
          </div>
        )
      })}

      {!loading && offers.length === 0 && <p>No offers yet. Press "Create New Offer" to add one.</p>}
    </div>
  )
}