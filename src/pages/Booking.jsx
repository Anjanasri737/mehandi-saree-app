import { useState } from 'react';
import { supabase } from '../services/supabase';
import { mehandiTypes } from '../data/mehandiTypes';
import './Booking.css';

function Booking({ service = 'mehandi' }) {
  const isSaree = service === 'saree';

  const emptyForm = {
    Name: '',
    Whatsapp_number: '',
    Address: '',
    mehandi_type: '',
    saree_count: '',
    event_date: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!/^[6-9]\d{9}$/.test(form.whatsapp_number.trim())) {
      setError('Enter a valid 10-digit WhatsApp number.');
      return;
    }

    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setError('Please login before booking.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('bookings').insert({
      user_id: userData.user.id,
      service: service,
      Name: form.Name.trim(),
      whatsapp_number: form.whatsapp_number.trim(),
      Address: form.Address.trim(),
      mehandi_type: isSaree ? null : form.mehandi_type,
      saree_count: isSaree ? Number(form.saree_count) : null,
      event_date: form.event_date,
    });

    setLoading(false);

    if (insertError) {
      console.log(insertError.message);
      setError('Could not save your booking. Please try again.');
      return;
    }

    setMessage('Booking submitted! We will contact you on WhatsApp.');
    setForm(emptyForm);
  };

  return (
    <div className="booking-page">
      <form className="booking-card" onSubmit={handleSubmit}>
        <h2>{isSaree ? 'Book Saree Pre-Pleating' : 'Book Mehandi'}</h2>

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
          WhatsApp Number
          <input
            type="tel"
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
            value={form.Address}
            onChange={handleChange}
            rows={3}
            required
          />
        </label>

        {isSaree ? (
          <label>
            Number of Sarees
            <input
              type="number"
              name="saree_count"
              value={form.saree_count}
              onChange={handleChange}
              min={1}
              max={20}
              required
            />
          </label>
        ) : (
          <label>
            Mehandi Type
            <select
              name="mehandi_type"
              value={form.mehandi_type}
              onChange={handleChange}
              required
            >
              <option value="">Select type</option>
              {mehandiTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
        )}

        <label>
          {isSaree ? 'Pleating Date' : 'Event Date'}
          <input
            type="date"
            name="event_date"
            value={form.event_date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </label>

        {error && <p className="booking-error">{error}</p>}
        {message && <p className="booking-success">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Book Now'}
        </button>
      </form>
    </div>
  );
}

export default Booking;