export function PrivacyPage() {
  return (
    <div className="content-page">
      <h1>Privacy Policy</h1>
      <p className="content-lead">Local-first demo — no PHI egress guarantees required here.</p>
      <h2>Indexing & Storage</h2>
      <p>Synthetic clinic data hydrates browser local storage for offline resilience demos. Clearing storage mirrors a full sandbox reset.</p>
      <h2>Messaging Previews</h2>
      <p>Notification studio renders HTML, email, and SMS mocks client-side exclusively — nothing leaves this browser tab.</p>
      <h2>Audit Surfacing</h2>
      <p>Operational monitoring surfaces synthesized logs for SOC storytelling. Production builds would wire into SIEM backplanes.</p>
      <div style={{ marginTop: 24, padding: 16, background: '#ECEFF1', border: '1px solid #CFD8DC' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#546E7A' }}>
          Need contract-grade policies? Invite MediCare legal before publishing — this scaffold is purposely lightweight.
        </p>
      </div>
    </div>
  )
}
