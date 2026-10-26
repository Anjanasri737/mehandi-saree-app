import { businessInfo } from '../config/businessInfo'
import './Hero.css'
import NotificationBell from './NotificationBell'
import InstagramIcon from './InstagramIcon'
import { INSTAGRAM_DM_URL, INSTAGRAM_USERNAME } from '../config/instagram'

function Hero() {
  const whatsappLink = `https://wa.me/${businessInfo.whatsapp}?text=Hi! I'm interested in your Mehandi/Saree services.`

  return (
    <section id="home" className="hero">
      <div className="hero-inner">
        <h1>Beautiful Mehandi & Perfect Saree Pleats for Your Special Moments</h1>
        <p>
          Elegant Mehandi designs and neatly pre-pleated sarees for weddings,
          festivals, functions and special occasions.
        </p>

        <div className="hero-buttons">
          <a href="#booking-mehandi" className="btn btn-primary">Book Mehandi</a>
          <a href="#booking-saree" className="btn btn-primary">Book Saree Pre-Pleating</a>
          <a href="#mehandi-gallery" className="btn btn-outline">View Mehandi Designs</a>
          <a href="#saree-gallery" className="btn btn-outline">View Saree Designs</a>
        </div>

        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
          💬 WhatsApp Me
        </a>

                <a
          href={INSTAGRAM_DM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline hero-instagram"
        >
          <InstagramIcon /> @{INSTAGRAM_USERNAME}
        </a>
          
        
          <NotificationBell />
      
      </div>
    </section>
  )
}

export default Hero