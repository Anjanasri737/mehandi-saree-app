import { useServicePrices } from '../hooks/useServicePrices'
import './ServicePrice.css'

const UNIT_LABELS = {
  per_hand: 'per hand',
  both_hands: 'both hands',
  per_foot: 'per foot',
  both_feet: 'both feet',
  per_event: 'per event',
  per_saree: 'per saree',
}

const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN')

export default function ServicePrice({ serviceName }) {
  const prices = useServicePrices()
  if (!serviceName) return null

  const s = prices[serviceName.trim().toLowerCase()]
  if (!s) return null // service not active yet: show nothing, never ₹0

  const hasOffer = s.offer_name && Number(s.discount_amount) > 0
  const badge = hasOffer
    ? s.discount_type === 'percentage'
      ? `${Number(s.discount_value)}% OFF`
      : `₹${Number(s.discount_value)} OFF`
    : null

  return (
    <div className="sp">
      {badge && <span className="sp-badge">{badge}</span>}
      <div className="sp-line">
        {badge && <span className="sp-old">{rupees(s.original_price)}</span>}
        <span className="sp-final">{rupees(s.final_price)}</span>
        <span className="sp-unit">{UNIT_LABELS[s.pricing_unit]}</span>
      </div>
    </div>
  )
}