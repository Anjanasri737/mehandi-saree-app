import { useState } from 'react'
import { businessInfo } from '../config/businessInfo'
import './Header.css'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Services', href: '#services' },
    { label: 'Mehandi Gallery', href: '#mehandi-gallery' },
    { label: 'Saree Gallery', href: '#saree-gallery' },
    { label: 'Reviews', href: '#reviews' },
    { label: 'Booking', href: '#booking' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <header className="header">
      <div className="header-inner">
        <a href="#home" className="logo-area">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">{businessInfo.name}</span>
        </a>

        <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <a href="#login" className="login-link" onClick={() => setMenuOpen(false)}>
            Login
          </a>
        </nav>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
    </header>
  )
}

export default Header