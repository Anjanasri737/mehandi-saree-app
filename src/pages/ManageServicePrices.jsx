import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import './ManageServicePrices.css'
import SareeTypesManager from '../components/SareeTypesManager'

const UNIT_LABELS = {
  per_hand: 'per hand',
  both_hands: 'both hands',
  per_foot: 'per foot',
  both_feet: 'both feet',
  per_event: 'per event',
  per_saree: 'per saree',
}

const UNITS_BY_CATEGORY = {
  mehandi: ['per_hand', 'both_hands', 'per_foot', 'both_feet', 'per_event'],
  saree: ['per_saree'],
}

const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN')

// ---------- Form used for both "Add new" and "Edit" ----------
function ServiceEditor({ initial, onSave, onCancel, saving, showCategory }) {
  const [f, setF] = useState({
    service_name: initial.service_name ?? '',
    service_category: initial.service_category,
    description: initial.description ?? '',
    image_url: initial.image_url ?? '',
    price: initial.price ?? '',
    minimum_price: initial.minimum_price ?? '',
    maximum_price: initial.maximum_price ?? '',
    pricing_unit: initial.pricing_unit,
    sort_order: initial.sort_order ?? 0,
  })
  const [err, setErr] = useState('')

  const set = (key) => (e) => {
    const value = e.target.value
    if (key === 'service_category') {
      // keep the unit valid for the chosen category
      setF({ ...f, service_category: value, pricing_unit: UNITS_BY_CATEGORY[value][0] })
    } else {
      setF({ ...f, [key]: value })
    }
  }

  function submit(e) {
    e.preventDefault()
    setErr('')
    const name = f.service_name.trim()
    const price = Number(f.price)
    const min = f.minimum_price === '' ? null : Number(f.minimum_price)
    const max = f.maximum_price === '' ? null : Number(f.maximum_price)

    if (!name) return setErr('Please enter a service name.')
    if (f.price === '' || Number.isNaN(price) || price < 0) return setErr('Please enter a valid price (0 or more).')
    if ((min !== null && (Number.isNaN(min) || min < 0)) || (max !== null && (Number.isNaN(max) || max < 0)))
      return setErr('Minimum and maximum prices must be 0 or more.')
    if (min !== null && max !== null && min > max) return setErr('Minimum price cannot be more than maximum price.')

    onSave({
      service_name: name,
      service_category: f.service_category,
      description: f.description.trim() || null,
      image_url: f.image_url.trim() || null,
      price,
      minimum_price: min,
      maximum_price: max,
      pricing_unit: f.pricing_unit,
      sort_order: parseInt(f.sort_order, 10) || 0,
    })
  }

  const units = UNITS_BY_CATEGORY[f.service_category]

  return (
    <form className="msp-editor" onSubmit={submit}>
      <div className="msp-grid">
        {showCategory && (
          <label>
            Category
            <select value={f.service_category} onChange={set('service_category')}>
              <option value="mehandi">Mehandi</option>
              <option value="saree">Saree Pre-Pleating</option>
            </select>
          </label>
        )}
        <label>
          Service name
          <input value={f.service_name} onChange={set('service_name')} />
        </label>
        <label>
          Price (₹)
          <input type="number" min="0" step="0.01" value={f.price} onChange={set('price')} />
        </label>
        <label>
          Pricing unit
          <select value={f.pricing_unit} onChange={set('pricing_unit')}>
            {units.map((u) => (
              <option key={u} value={u}>{UNIT_LABELS[u]}</option>
            ))}
          </select>
        </label>
        <label>
          Minimum price (optional)
          <input type="number" min="0" step="0.01" value={f.minimum_price} onChange={set('minimum_price')} />
        </label>
        <label>
          Maximum price (optional)
          <input type="number" min="0" step="0.01" value={f.maximum_price} onChange={set('maximum_price')} />
        </label>
        <label>
          Display order
          <input type="number" value={f.sort_order} onChange={set('sort_order')} />
        </label>
        <label>
          Image link (optional)
          <input value={f.image_url} onChange={set('image_url')} placeholder="https://..." />
        </label>
      </div>
      <label className="msp-full">
        Description
        <textarea rows="3" value={f.description} onChange={set('description')} />
      </label>
      {err && <p className="msp-error">{err}</p>}
      <div className="msp-actions">
        <button type="submit" className="msp-btn msp-btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" className="msp-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

// ---------- Main page ----------
export default function ManageServicePrices() {
  const { user, isAdmin } = useAuth()
  const [services, setServices] = useState([])
  const [live, setLive] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('mehandi')
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'ok' | 'error', text }

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('sort_order')
      .order('service_name')
    if (error) {
      setMessage({ type: 'error', text: 'Could not load services: ' + error.message })
    } else {
      setServices(data)
    }
    // Prices customers currently see (includes any active offer)
    const { data: prices } = await supabase.rpc('get_public_service_prices')
    const map = {}
    ;(prices || []).forEach((p) => { map[p.service_id] = p })
    setLive(map)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user && isAdmin) load()
  }, [user, isAdmin, load])

  function showError(error) {
    const text = error.code === '23505'
      ? 'A service with this name already exists in this category.'
      : error.message
    setMessage({ type: 'error', text })
  }

  async function saveEdit(id, payload) {
    setSaving(true)
    const { error } = await supabase.from('services').update(payload).eq('id', id)
    setSaving(false)
    if (error) return showError(error)
    setEditingId(null)
    setMessage({ type: 'ok', text: 'Saved. The website now shows the updated price.' })
    load()
  }

  async function addService(payload) {
    setSaving(true)
    // New services start hidden; the admin turns them on with "Activate"
    const { error } = await supabase.from('services').insert({ ...payload, is_active: false })
    setSaving(false)
    if (error) return showError(error)
    setAdding(false)
    setTab(payload.service_category)
    setMessage({ type: 'ok', text: 'Service added (hidden). Press Activate to show it on the website.' })
    load()
  }

  async function toggleActive(s) {
    if (!s.is_active && Number(s.price) <= 0) {
      return setMessage({ type: 'error', text: 'Set a price above ₹0 before activating this service.' })
    }
    const { error } = await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id)
    if (error) return showError(error)
    setMessage({ type: 'ok', text: s.is_active ? 'Service hidden from the website.' : 'Service is now live on the website.' })
    load()
  }

  async function removeService(s) {
    if (!window.confirm(`Delete "${s.service_name}" permanently? Old bookings keep their saved price. You can use Deactivate instead.`)) return
    const { error } = await supabase.from('services').delete().eq('id', s.id)
    if (error) return showError(error)
    setMessage({ type: 'ok', text: 'Service deleted.' })
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

  const visible = services.filter((s) => s.service_category === tab)

  return (
    <div className="msp-page">
      <a href="#home" className="msp-btn msp-back">← Back to Home</a>
      <h2>Manage Service Prices</h2>
      <p className="msp-sub">
        Changes are saved to the database and appear on the website straight away.
        Services marked Hidden are not shown to customers.
      </p>

      <div className="msp-tabs">
        <button className={tab === 'mehandi' ? 'active' : ''} onClick={() => setTab('mehandi')}>
          Mehandi
        </button>
        <button className={tab === 'saree' ? 'active' : ''} onClick={() => setTab('saree')}>
          Saree Pre-Pleating
        </button>
      </div>

      {message && <p className={message.type === 'ok' ? 'msp-ok' : 'msp-error'}>{message.text}</p>}

      {!adding ? (
        <button className="msp-btn msp-btn-primary" onClick={() => { setAdding(true); setEditingId(null) }}>
          + Add New Service
        </button>
      ) : (
        <div className="msp-card">
          <h3>Add New Service</h3>
          <ServiceEditor
            showCategory
            saving={saving}
            initial={{ service_category: tab, pricing_unit: UNITS_BY_CATEGORY[tab][0], sort_order: visible.length + 1 }}
            onSave={addService}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {loading && <p>Loading...</p>}

      {visible.map((s) => {
        const l = live[s.id]
        const hasOffer = l && Number(l.discount_amount) > 0
        return (
          <div className="msp-card" key={s.id}>
            <div className="msp-row">
              <div>
                <h3>
                  {s.service_name}{' '}
                  <span className={s.is_active ? 'msp-badge live' : 'msp-badge off'}>
                    {s.is_active ? 'Live' : 'Hidden'}
                  </span>
                </h3>
                <p className="msp-price">
                  {rupees(s.price)} <small>{UNIT_LABELS[s.pricing_unit]}</small>
                                    {(s.minimum_price != null || s.maximum_price != null) && (
                    <small className="msp-range">
                      {' '}·{' '}
                      {s.minimum_price != null && s.maximum_price != null
                        ? `Range ${rupees(s.minimum_price)} to ${rupees(s.maximum_price)}`
                        : s.maximum_price != null
                          ? `Up to ${rupees(s.maximum_price)}`
                          : `From ${rupees(s.minimum_price)}`}
                    </small>
                  )}
                </p>
                {hasOffer && (
                  <p className="msp-offer">
                    Offer "{l.offer_name}": <s>{rupees(l.original_price)}</s> → <strong>{rupees(l.final_price)}</strong>
                  </p>
                )}
                {s.description && <p className="msp-desc">{s.description}</p>}
              </div>
              <div className="msp-actions">
                <button className="msp-btn" onClick={() => { setEditingId(editingId === s.id ? null : s.id); setAdding(false) }}>
                  {editingId === s.id ? 'Close' : 'Edit'}
                </button>
                <button className="msp-btn" onClick={() => toggleActive(s)}>
                  {s.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="msp-btn msp-btn-danger" onClick={() => removeService(s)}>Delete</button>
              </div>
            </div>
            {editingId === s.id && (
              <ServiceEditor
                initial={s}
                saving={saving}
                onSave={(payload) => saveEdit(s.id, payload)}
                onCancel={() => setEditingId(null)}
              />
            )}
          </div>
        )
      })}

      {!loading && visible.length === 0 && <p>No services in this category yet.</p>}
      {tab === 'saree' && <SareeTypesManager />}
    </div>
  )
}