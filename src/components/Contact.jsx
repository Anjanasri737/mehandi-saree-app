import { businessInfo } from '../config/businessInfo'
import './Contact.css'

function Contact() {
  const whatsappLink = `https://wa.me/${businessInfo.whatsapp}?text=Hi! I have a question about your services.`
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessInfo.address)}`

  return (
    <section id="contact" className="contact">
      <div className="contact-inner">
        <h2>Get In Touch</h2>
        <p className="contact-address">{businessInfo.address}</p>

        <div className="contact-buttons">
          <a href={`tel:${businessInfo.phone}`} className="btn btn-outline">📞 Call</a>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">💬 WhatsApp</a>
          <a href={`mailto:${businessInfo.email}`} className="btn btn-outline">✉️ Email</a>
          <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline">📍 Get Directions</a>
        </div>

        <a href={businessInfo.instagram} target="_blank" rel="noopener noreferrer" className="instagram-link">
          📷 Follow Me on Instagram
        </a>
      </div>
    </section>
  )
}

export default Contact