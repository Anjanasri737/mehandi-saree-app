import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabase'

const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN')

export default function SareeTypesManager() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | a type id
  const [form, setForm] = useState({ type_name: '', additional_charge: '', sort_order: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('saree_types')
      .select('*')
      .order('sort_order')
      .order('type_name')
    if (error) setMessage({ type: 'error', text: 'Could not load saree types: ' + error.message })
    else setTypes(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  function startAdd() {
    setErr('')
    setEditing('new')
    setForm({ type_name: '', additional_charge: '0', sort_order: String(types.length + 1) })
  }

  function startEdit(t) {
    setErr('')
    setEditing(t.id)
    setForm({
      type_name: t.type_name,
      additional_charge: String(t.additional_charge),
      sort_order: String(t.sort_order),
    })
  }

  async function save(e) {
    e.preventDefault()
    setErr('')
    const name = form.type_name.trim()
    const charge = Number(form.additional_charge)
    if (!name) return setErr('Please enter a saree type name.')
    if (form.additional_charge === '' || Number.isNaN(charge) || charge < 0)
      return setErr('Please enter an additional charge of 0 or more.')

    const payload = {
      type_name: name,
      additional_charge: charge,
      sort_order: parseInt(form.sort_order, 10) || 0,
    }

    setSaving(true)
    const result =
      editing === 'new'
        ? await supabase.from('saree_types').insert({ ...payload, is_active: true })
        : await supabase.from('saree_types').update(payload).eq('id', editing)
    setSaving(false)

    if (result.error) {
      return setErr(
        result.error.code === '23505'
          ? 'A saree type with this name already exists.'
          : result.error.message
      )
    }
    setEditing(null)
    setMessage({ type: 'ok', text: 'Saved. The website shows the new charges straight away.' })
    load()
  }

  async function toggleActive(t) {
    const { error } = await supabase
      .from('saree_types')
      .update({ is_active: !t.is_active })
      .eq('id', t.id)
    if (error) return setMessage({ type: 'error', text: error.message })
    load()
  }

  async function remove(t) {
    if (!window.confirm(`Delete saree type "${t.type_name}"? Old bookings keep their saved price. You can use Deactivate instead.`)) return
    const { error } = await supabase.from('saree_types').delete().eq('id', t.id)
    if (error) return setMessage({ type: 'error', text: error.message })
    setMessage({ type: 'ok', text: 'Saree type deleted.' })
    load()
  }

  const formEl = (
    <form className="msp-editor" onSubmit={save}>
      <div className="msp-grid">
        <label>
          Saree type name
          <input value={form.type_name} onChange={set('type_name')} placeholder="e.g. Banarasi Silk" />
        </label>
        <label>
          Additional charge (₹)
          <input type="number" min="0" step="0.01" value={form.additional_charge} onChange={set('additional_charge')} />
        </label>
        <label>
          Display order
          <input type="number" value={form.sort_order} onChange={set('sort_order')} />
        </label>
      </div>
      {err && <p className="msp-error">{err}</p>}
      <div className="msp-actions">
        <button type="submit" className="msp-btn msp-btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" className="msp-btn" onClick={() => setEditing(null)}>Cancel</button>
      </div>
    </form>
  )

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <h2>Saree Type Additional Charges</h2>
      <p className="msp-sub">
        This amount is added to the pleating price for every saree of that type.
        Example: Soft Silk (+₹30) with Semi Fluffy Pleats (₹250) = ₹280 per saree.
      </p>

      {message && <p className={message.type === 'ok' ? 'msp-ok' : 'msp-error'}>{message.text}</p>}

      {editing === 'new' ? (
        <div className="msp-card">
          <h3>Add Saree Type</h3>
          {formEl}
        </div>
      ) : (
        <button className="msp-btn msp-btn-primary" onClick={startAdd}>+ Add Saree Type</button>
      )}

      {loading && <p>Loading...</p>}

      {types.map((t) => (
        <div className="msp-card" key={t.id}>
          <div className="msp-row">
            <div>
              <h3>
                {t.type_name}{' '}
                <span className={t.is_active ? 'msp-badge live' : 'msp-badge off'}>
                  {t.is_active ? 'Live' : 'Hidden'}
                </span>
              </h3>
              <p className="msp-price">
                {Number(t.additional_charge) > 0 ? `+ ${rupees(t.additional_charge)}` : 'No extra charge'}
              </p>
            </div>
            <div className="msp-actions">
              <button className="msp-btn" onClick={() => (editing === t.id ? setEditing(null) : startEdit(t))}>
                {editing === t.id ? 'Close' : 'Edit'}
              </button>
              <button className="msp-btn" onClick={() => toggleActive(t)}>
                {t.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button className="msp-btn msp-btn-danger" onClick={() => remove(t)}>Delete</button>
            </div>
          </div>
          {editing === t.id && formEl}
        </div>
      ))}
    </div>
  )
}