import { useEffect, useState } from 'react'
import { businessInfo } from '../config/businessInfo'
import './Header.css'
import './Nav.css'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'Mehandi Gallery', href: '#mehandi-gallery' },
  { label: 'Saree Gallery', href: '#saree-gallery' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Booking', href: '#booking' },
  { label: 'Contact', href: '#contact' },
]

const sectionIds = ['home', 'services', 'mehandi-gallery', 'saree-gallery', 'reviews', 'contact']

function activeFromHash(hash) {
  if (hash.startsWith('#booking')) return '#booking'
  if (hash === '#mehandi-designs') return '#mehandi-gallery'
  if (hash === '#login') return '#login'
  return hash || '#home'
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hash, setHash] = useState(window.location.hash)
  const [active, setActive] = useState(activeFromHash(window.location.hash))

  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash)
      setActive(activeFromHash(window.location.hash))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // While scrolling the home page, highlight the section currently in view.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    let observer
    const frame = requestAnimationFrame(() => {
      const els = sectionIds.map((id) => document.getElementById(id)).filter(Boolean)
      if (!els.length) return
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) setActive('#' + en.target.id)
          })
        },
        { rootMargin: '-45% 0px -50% 0px' }
      )
      els.forEach((el) => observer.observe(el))
    })
    return () => {
      cancelAnimationFrame(frame)
      if (observer) observer.disconnect()
    }
  }, [hash])

  return (
    <header className="header">
      <div className="header-inner">
        <a href="#home" className="logo-area">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">{businessInfo.name}</span>
        </a>

        <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={active === link.href ? 'nav-active' : ''}
              aria-current={active === link.href ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a href="#login" className="login-link" onClick={() => setMenuOpen(false)}>
            Login
          </a>
        </nav>

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
    </header>
  )
}

export default Header