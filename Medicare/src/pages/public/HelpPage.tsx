import { Link } from 'react-router-dom'
import { paths } from '@/routes/routes'

export function HelpPage() {
  return (
    <div className="content-page">
      <h1>Help Center</h1>
      <p className="content-lead">Get support for MediCare+ platform questions and technical issues.</p>
      <div className="feature-grid" style={{ marginTop: 24 }}>
        <div className="feature-box">
          <h3>Email Support</h3>
          <p>clinical-success@medicare.plus — guaranteed first response SLAs mock for coordinators.</p>
          <a href="mailto:clinical-success@medicare.plus" className="btn-primary-classic" style={{ display: 'inline-block', marginTop: 12 }}>
            Send Email
          </a>
        </div>
        <div className="feature-box">
          <h3>Live Chat</h3>
          <p>Desk hours 24/7 in demo persona — escalate to Incident Response from Admin Monitoring.</p>
          <Link to="/admin/monitoring" className="btn-secondary-classic" style={{ display: 'inline-block', marginTop: 12 }}>
            Open Monitoring
          </Link>
        </div>
      </div>
      <p style={{ marginTop: 24, textAlign: 'center' }}>
        Prefer self-serve FAQs? <Link to={paths.faq} style={{ color: '#00796B' }}>Browse FAQ</Link>
      </p>
    </div>
  )
}
