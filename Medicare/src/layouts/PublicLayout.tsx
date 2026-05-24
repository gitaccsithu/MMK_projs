import { Link } from 'react-router-dom'
import { paths } from '@/routes/routes'

interface PublicLayoutProps {
  children: React.ReactNode
  fullWidth?: boolean
}

export function PublicLayout({ children, fullWidth }: PublicLayoutProps) {
  return (
    <div className="site-page">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to={paths.landing} className="site-logo">
            <span className="site-logo-icon">M+</span>
            MediCare+
          </Link>
          <nav>
            <ul className="site-nav">
              <li><Link to={paths.help}>Help</Link></li>
              <li><Link to={paths.faq}>FAQ</Link></li>
              <li><Link to={paths.terms}>Terms</Link></li>
              <li><Link to={paths.login} className="site-nav-login">Login</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className={fullWidth ? 'site-main-full' : 'site-main'}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <h4>MediCare+</h4>
            <ul>
              <li><Link to={paths.landing}>Home</Link></li>
              <li><Link to={paths.help}>Help Center</Link></li>
              <li><Link to={paths.faq}>FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li><Link to={paths.terms}>Terms of Service</Link></li>
              <li><Link to={paths.privacy}>Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:support@medicare.example.com">support@medicare.example.com</a></li>
              <li><a href="tel:+15551234567">+1 (555) 123-4567</a></li>
            </ul>
          </div>
        </div>
        <div className="site-footer-bottom">
          © 2026 MediCare+, Inc. All rights reserved. Demo application.
        </div>
      </footer>
    </div>
  )
}
