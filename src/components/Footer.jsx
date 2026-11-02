import { businessInfo } from '../config/businessInfo'
import './Footer.css'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <p>{businessInfo.name}</p>
      <p className="footer-copy">© {year} All rights reserved.</p>
      <a href="/privacy.html" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy Policy</a>
    </footer>
  )
}

export default Footer