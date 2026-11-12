import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import './Services.css'

const UNIT_LABELS = {
  per_hand: 'per hand',
  both_hands: 'both hands',
  per_foot: 'per foot',
  both_feet: 'both feet',
  per_event: 'per event',
  per_saree: 'per saree',
}

const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN')

// Your original lists. They are shown ONLY for a category that has no
// active priced services yet, so the site never looks empty.
const FALLBACK_MEHANDI = [
  'Bridal Mehandi',
  'Arabic Mehandi',
  'Simple Mehandi',
  'Traditional Mehandi',
  'Festival Mehandi',
  'Baby shower mehndi design',
]

const FALLBACK_SAREE = [
  'Wedding Saree Fluffy Pre-Pleating with Hanger Folding',
  'Hanger Pleating',
  'Party Wear Saree Preparation',
  'Cotton Saree Pleating with Box Folding',
  'Semi Fluffy Pleats',
  'Full Fluffy Pleats',
]

function offerBadge(s) {
  if (!s.offer_name || Number(s.discount_amount) <= 0) return null
  return s.discount_type === 'percentage'
    ? `${Number(s.discount_value)}% OFF`
    : `₹${Number(s.discount_value)} OFF`
}

function PriceCard({ s, bookHref }) {
  const badge = offerBadge(s)
  const hasRange = s.minimum_price != null || s.maximum_price != null

  return (
    <div className="svc-item">
      {badge && <span className="svc-badge">{badge}</span>}

      {s.image_url ? (
        <img className="svc-img" src={s.image_url} alt={s.service_name} loading="lazy" />
      ) : (
        <div className="svc-img svc-img-empty">
          {s.service_category === 'saree' ? '🥻' : '🌿'}
        </div>
      )}

      <h4>{s.service_name}</h4>
      {s.description && <p className="svc-desc">{s.description}</p>}

      <div className="svc-prices">
        {badge && <span className="svc-old">{rupees(s.original_price)}</span>}
        <span className="svc-final">{rupees(s.final_price)}</span>
        <span className="svc-unit">{UNIT_LABELS[s.pricing_unit]}</span>
      </div>

      {hasRange && (
        <p className="svc-range">
          Range {s.minimum_price != null ? rupees(s.minimum_price) : '—'} to{' '}
          {s.maximum_price != null ? rupees(s.maximum_price) : '—'}
        </p>
      )}

      {badge && (
        <p className="svc-offername">
          {s.offer_name} · You save {rupees(s.discount_amount)}
        </p>
      )}

      <a href={bookHref} className="btn btn-primary">Book Now</a>
    </div>
  )
}

function CategoryBlock({ icon, title, live, fallback, bookHref, bookLabel }) {
  // No active priced services yet: show the original card unchanged
  if (live.length === 0) {
    return (
      <div className="service-card">
        <h3>{icon} {title}</h3>
        <ul>
          {fallback.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <a href={bookHref} className="btn btn-primary">{bookLabel}</a>
      </div>
    )
  }

  return (
    <div className="service-card svc-wide">
      <h3>{icon} {title}</h3>
      <div className="svc-grid">
        {live.map((s) => (
          <PriceCard key={s.service_id} s={s} bookHref={bookHref} />
        ))}
      </div>
    </div>
  )
}

function Services() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase.rpc('get_public_service_prices')
      if (!cancelled && !error && data) setItems(data)
    }

    load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const mehandi = items.filter((i) => i.service_category === 'mehandi')
  const saree = items.filter((i) => i.service_category === 'saree')

  return (
    <section id="services" className="services">
      <div className="services-inner">
        <h2>Our Services</h2>

        <div className="service-cards">
          <CategoryBlock
            icon="🌿"
            title="Mehandi"
            live={mehandi}
            fallback={FALLBACK_MEHANDI}
            bookHref="#booking-mehandi"
            bookLabel="Book Mehandi"
          />
          <CategoryBlock
            icon="🥻"
            title="Saree Pre-Pleating"
            live={saree}
            fallback={FALLBACK_SAREE}
            bookHref="#booking-saree"
            bookLabel="Book Saree Pre-Pleating"
          />
        </div>
      </div>
    </section>
  )
}

export default Services