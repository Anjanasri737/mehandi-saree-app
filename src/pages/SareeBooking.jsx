import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import './Booking.css'
import './SareeBooking.css'

const sareePleatTypes = [
  'Saree Pre-Pleating',
  'Hanger Pleating',
  'Box Pleats',
  'Traditional Pleating',
  'Wedding Saree Preparation',
  'Party Wear Saree Preparation',
]

// today's date in the user's own timezone, as YYYY-MM-DD
function getToday() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

function formatDate(isoDate) {
  const [y, m, d] = isoDate.split('-')
  return `${d}-${m}-${y}`
}

const emptyForm = {
  customer_name: '',
  whatsapp_number: '',
  address: '',
  saree_type: '',
  event_date: '',
}

function SareeBooking() {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    // mobile field accepts digits only
    const cleaned = name === 'whatsapp_number' ? value.replace(/\D/g, '') : value
    setForm({ ...form, [name]: cleaned })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const name = form.customer_name.trim()
    const mobile = form.whatsapp_number.trim()
    const address = form.address.trim()

    if (!name || !address || !form.saree_type || !form.event_date) {
      setError('Please fill all required fields.')
      return
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8 or 9).')
      return
    }
    if (form.event_date < getToday()) {
      setError('Booking date cannot be in the past.')
      return
    }
    if (!user) {
      setError('Please login before booking.')
      return
    }

    setLoading(true)

    const booking = {
      user_id: user.id,
      service: 'saree',
      customer_name: name,
      whatsapp_number: mobile,
      address: address,
      saree_type: form.saree_type,
      event_date: form.event_date,
    }

    const { error: insertError } = await supabase.from('bookings').insert(booking)

    setLoading(false)

    if (insertError) {
      console.log(insertError.message)
      setError('Could not save your booking. Please try again.')
      return
    }

    setConfirmed(booking)
    setForm(emptyForm)
  }

  if (confirmed) {
    return (
      <div className="booking-page">
        <div className="booking-card saree-confirmation">
          <h2>Booking Confirmed ✓</h2>
          <p className="booking-success">
            Thank you! Your Saree Pre-Pleating booking has been received.
          </p>
          <dl className="saree-summary">
            <dt>Customer Name</dt>
            <dd>{confirmed.customer_name}</dd>
            <dt>WhatsApp / Mobile</dt>
            <dd>{confirmed.whatsapp_number}</dd>
            <dt>Address</dt>
            <dd>{confirmed.address}</dd>
            <dt>Saree Pleats Type</dt>
            <dd>{confirmed.saree_type}</dd>
            <dt>Booking Date</dt>
            <dd>{formatDate(confirmed.event_date)}</dd>
          </dl>
          <p>We will contact you on WhatsApp to confirm.</p>
          <button type="button" onClick={() => setConfirmed(null)}>
            Book Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-page">
      <form className="booking-card" onSubmit={handleSubmit}>
        <h2>Book Saree Pre-Pleating</h2>

        <label>
          Name
          <input
            type="text"
            name="customer_name"
            value={form.customer_name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Mobile / WhatsApp Number
          <input
            type="tel"
            inputMode="numeric"
            name="whatsapp_number"
            value={form.whatsapp_number}
            onChange={handleChange}
            maxLength={10}
            placeholder="10-digit number"
            required
          />
        </label>

        <label>
          Address
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={3}
            required
          />
        </label>

        <label>
          Saree Pleats Type
          <select
            name="saree_type"
            value={form.saree_type}
            onChange={handleChange}
            required
          >
            <option value="">Select type</option>
            {sareePleatTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>

        <label>
          Booking Date
          <input
            type="date"
            name="event_date"
            value={form.event_date}
            onChange={handleChange}
            min={getToday()}
            required
          />
        </label>

        {error && <p className="booking-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Book Now'}
        </button>
      </form>
    </div>
  )
}

export default SareeBooking