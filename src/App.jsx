import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Services from './components/Services'
import GalleryPreview from './components/GalleryPreview'
import Reviews from './components/Reviews'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Auth from './pages/Auth'
import { useAuth } from './context/AuthContext'
import { mehandiDesigns, sareeDesigns } from './data/sampleGalleryData'
import Booking from './pages/Booking'
import SareeBooking from './pages/SareeBooking'

function App() {
  const [showAuth, setShowAuth] = useState(false)
  const [bookingService, setBookingService] = useState(null)
  const { user, signOut } = useAuth()

      useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash
      setShowAuth(hash === '#login')
      if (hash === '#booking' || hash === '#booking-mehandi') {
        setBookingService('mehandi')
      } else if (hash === '#booking-saree') {
        setBookingService('saree')
      } else {
          setBookingService(null)
      }
    }
        checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  if (bookingService) {
  return (
    <div>
      <Header />
      {user
        ? bookingService === 'saree'
          ? <SareeBooking />
          : <Booking key={bookingService} service={bookingService} />
        : <Auth />}
      <Footer />
    </div>
  )
}
  if (showAuth && !user) {
    return (
      <div>
        <Header />
        <Auth />
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <Header />
      {user && (
        <div style={{ textAlign: 'center', padding: '0.75rem', background: '#F5EBDD' }}>
          Logged in as {user.email} —{' '}
          <button onClick={signOut} style={{ textDecoration: 'underline', background: 'none', color: '#7A9B57' }}>
            Logout
          </button>
        </div>
      )}
      <Hero />
      <Services />
      <GalleryPreview
        id="mehandi-gallery"
        title="Mehandi Gallery"
        items={mehandiDesigns}
        viewAllHref="#mehandi-gallery"
        viewAllLabel="View All Mehandi Designs →"
      />
      <GalleryPreview
        id="saree-gallery"
        title="Saree Pre-Pleating Gallery"
        items={sareeDesigns}
        viewAllHref="#saree-gallery"
        viewAllLabel="View All Saree Designs →"
      />
      <Reviews />
      <Contact />
      <Footer />
    </div>
  )
}

export default App