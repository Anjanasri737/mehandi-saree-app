import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import './SareePricing.css'

const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN')

export default function SareePricing() {
  const [services, setServices] = useState([])
  const [types, setTypes] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [p, t] = await Promise.all([
        supabase.rpc('get_public_service_prices'),
        supabase
          .from('saree_types')
          .select('id, type_name, additional_charge')
          .eq('is_active', true)
          .order('sort_order')
          .order('type_name'),
      ])
      if (cancelled) return
      if (!p.error && p.data) setServices(p.data.filter((s) => s.service_category === 'saree'))
      if (!t.error && t.data) setTypes(t.data)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (services.length === 0) return null

  return (
    <section id="saree-pricing" className="spr">
      <div className="spr-inner">
        <h2>Saree Pre-Pleating Pricing</h2>
        <p className="spr-sub">
          Choose your pleating style, then add the small extra charge for your saree type.
        </p>

        <div className="spr-grid">
          {services.map((s) => {
            const hasOffer = s.offer_name && Number(s.discount_amount) > 0
            const badge = hasOffer
              ? s.discount_type === 'percentage'
                ? `${Number(s.discount_value)}% OFF`
                : `₹${Number(s.discount_value)} OFF`
              : null
            return (
              <div className="spr-card" key={s.service_id}>
                {badge && <span className="spr-badge">{badge}</span>}
                <h3>{s.service_name}</h3>
                {s.description && <p className="spr-desc">{s.description}</p>}
                <div className="spr-price">
                  {badge && <span className="spr-old">{rupees(s.original_price)}</span>}
                  <span className="spr-final">{rupees(s.final_price)}</span>
                  <span className="spr-unit">per saree</span>
                </div>
                <a href="#booking-saree" className="btn btn-primary">Book Now</a>
              </div>
            )
          })}
        </div>

        {types.length > 0 && (
          <div className="spr-types">
            <h3>Saree Type Additional Charges</h3>
            <ul>
              {types.map((t) => (
                <li key={t.id}>
                  <span>{t.type_name}</span>
                  <strong>
                    {Number(t.additional_charge) > 0 ? `+ ${rupees(t.additional_charge)}` : 'No extra charge'}
                  </strong>
                </li>
              ))}
            </ul>
            <p className="spr-note">
              Total per saree = pleating price + saree type charge.
              Example: Soft Silk with Semi Fluffy Pleats = ₹250 + ₹30 = ₹280.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}