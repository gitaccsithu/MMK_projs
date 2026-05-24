import { Link } from 'react-router-dom'
import { paths } from '@/routes/routes'

export function LandingPage() {
  return (
    <>
      <section className="hero-band">
        <div className="hero-band-inner">
          <div>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#00796B', marginBottom: 12 }}>
              MediCare+ Healthcare Platform
            </p>
            <h1>Complete healthcare management for your clinic</h1>
            <p>
              Schedule appointments, manage patient records, process billing, and conduct teleconsultations — all from one integrated platform built for modern healthcare providers.
            </p>
            <div className="hero-actions">
              <Link to={paths.login} className="btn-primary-classic">Sign In to Dashboard</Link>
              <Link to={paths.help} className="btn-secondary-classic">Contact Support</Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <strong>50+</strong>
                <span>Active patients in demo</span>
              </div>
              <div className="hero-stat">
                <strong>20+</strong>
                <span>Verified doctors</span>
              </div>
              <div className="hero-stat">
                <strong>100+</strong>
                <span>Appointments managed</span>
              </div>
              <div className="hero-stat">
                <strong>4 Roles</strong>
                <span>Patient, Doctor, Receptionist, Admin</span>
              </div>
            </div>
          </div>
          <div className="hero-panel">
            <div className="hero-panel-header">
              <div className="hero-panel-icon">M+</div>
              <div>
                <p style={{ fontSize: 11, textTransform: 'uppercase', color: '#78909C', margin: 0 }}>Platform Overview</p>
                <p style={{ fontSize: 16, fontWeight: 'bold', margin: '4px 0 0', color: '#37474F' }}>MediCare+ Dashboard</p>
              </div>
            </div>
            {[
              { title: 'Appointment Scheduling', desc: 'Book, reschedule, and manage patient appointments online.' },
              { title: 'Teleconsultation', desc: 'Conduct virtual visits with integrated video consultation tools.' },
              { title: 'Prescription Management', desc: 'Create, track, and manage prescriptions with refill reminders.' },
            ].map((item) => (
              <div key={item.title} className="hero-panel-item">
                <span className="hero-panel-check">✓</span>
                <div>
                  <p style={{ fontWeight: 'bold', margin: 0, fontSize: 14 }}>{item.title}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#78909C' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="section-band-inner">
          <h2>Why Choose MediCare+?</h2>
          <p className="section-subtitle">A comprehensive solution for healthcare providers of all sizes</p>
          <div className="feature-grid">
            <div className="feature-box">
              <h3>Patient Portal</h3>
              <p>Patients can book appointments, view records, manage prescriptions, and message their doctors.</p>
            </div>
            <div className="feature-box">
              <h3>Doctor Workspace</h3>
              <p>Doctors manage schedules, conduct consultations, write prescriptions, and track patient health.</p>
            </div>
            <div className="feature-box">
              <h3>Front Desk Tools</h3>
              <p>Receptionists handle registration, queue management, scheduling, and billing operations.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-band section-band-alt">
        <div className="section-band-inner">
          <h2>Get Started Today</h2>
          <p className="section-subtitle">Try the demo with pre-configured accounts for each role</p>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to={paths.login} className="btn-primary-classic">Access Demo Dashboard</Link>
          </div>
        </div>
      </section>
    </>
  )
}
