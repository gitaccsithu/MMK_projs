const faqs = [
  {
    q: 'Is MediCare+ HIPAA certified?',
    a: 'This repository is purely synthetic. Production deployments leverage BAA-aligned hosting — talk to MediCare alliances when activating.',
  },
  {
    q: 'How do queue updates work with SMS notifications?',
    a: 'Queue snapshots flow through MediCare Notifications Studio; SMS templates mirror queue position updates.',
  },
  {
    q: 'Can I try different user roles quickly?',
    a: 'Auth screens ship with demo accounts powering one-tap login for receptionists, clinicians, admins, and patients.',
  },
  {
    q: 'Does the demo work offline?',
    a: 'Yes. Data is stored locally in your browser. An offline indicator appears when you lose connectivity.',
  },
]

export function FAQPage() {
  return (
    <div className="content-page">
      <h1>Frequently Asked Questions</h1>
      <p className="content-lead">Answers for desk staff, clinicians, and IT leaders.</p>
      <ul className="faq-list">
        {faqs.map(({ q, a }, idx) => (
          <li key={idx} className="faq-item">
            <details>
              <summary className="faq-question">{q}</summary>
              <div className="faq-answer">{a}</div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  )
}
