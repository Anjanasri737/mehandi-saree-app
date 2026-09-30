import { businessInfo } from '../config/businessInfo'
import './Footer.css'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <p>{businessInfo.name}</p>
      <p className="footer-copy">© {year} All rights reserved.</p>
    </footer>
  )
}

export default Footer