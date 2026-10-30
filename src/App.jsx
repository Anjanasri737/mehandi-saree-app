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
import MehandiGallery from './pages/MehandiGallery'
import { useReveal } from './hooks/useReveal'
import './Theme.css'
import AdminBookings from './pages/AdminBookings'

function App() {
  const [showAuth, setShowAuth] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [bookingService, setBookingService] = useState(null)
  const [bookingDesignId, setBookingDesignId] = useState(null)
  const { user, signOut, recovering, isAdmin } = useAuth()
  const [showAdminBookings, setShowAdminBookings] = useState(false)

  // 1. Read the address (#login, #booking, #mehandi-designs ...)
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash
      setShowAuth(hash === '#login')
      setShowGallery(hash === '#mehandi-designs')
      setShowAdminBookings(hash === '#admin-bookings')
      if (hash === '#booking' || hash.startsWith('#booking-mehandi')) {
        setBookingService('mehandi')
        setBookingDesignId(hash.split('/')[1] || null)
      } else if (hash === '#booking-saree') {
        setBookingService('saree')
        setBookingDesignId(null)
      } else {
        setBookingService(null)
        setBookingDesignId(null)
      }
    }

    // When the app first opens, always start on the Home page,
    // even if the phone remembered an old booking or login address.
    const startHash = window.location.hash
    if (startHash.startsWith('#booking') || startHash === '#login') {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search + '#home'
      )
    }

    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  // 2. Smooth-scroll to the section named in the address
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    const timer = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else if (id === 'home') window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 60)
    return () => clearTimeout(timer)
  }, [showAuth, showGallery, bookingService])

   useReveal(`${showAuth}-${showGallery}-${bookingService}`)

  // Everything below here is NOT a hook, so the returns are fine.
  if (recovering) {
    return (
      <div>
        <Header />
        <Auth />
        <Footer />
      </div>
    )
  }
  
  if (bookingService) {
    return (
      <div>
        <Header />
        {user
          ? bookingService === 'saree'
            ? <SareeBooking />
            : <Booking
                key={`${bookingService}-${bookingDesignId}`}
                service={bookingService}
                designId={bookingDesignId}
              />
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
     if (showAdminBookings) {
     return (
       <div>
         <Header />
         <AdminBookings />
         <Footer />
       </div>
     )
   }
  if (showGallery) {
    return (
      <div>
        <Header />
        <MehandiGallery />
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <Header />
      {user && (
        <div className="login-bar" style={{ textAlign: 'center', padding: '0.75rem' }}>
          Logged in as {user.email} —{' '}
             {isAdmin && (
        <>
          {' '}|{' '}
          <a href="#admin-bookings" style={{ color: '#7651A8' }}>Manage bookings</a>{' '}
        </>
        )}
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
        viewAllHref="#mehandi-designs"
        viewAllLabel="View All Mehandi Designs →"
      />
      <GalleryPreview
        id="saree-gallery"
        title="Saree Pre-Pleating Gallery"
        items={sareeDesigns}
      />
      <Reviews />
      <Contact />
      <Footer />
    </div>
  )
}

export default App