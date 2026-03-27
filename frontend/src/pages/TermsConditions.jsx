import { motion } from 'framer-motion'

export default function TermsConditions() {
  return (
    <div className="animate-fadeInUp" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Terms & Conditions</h1>
        <p className="page-subtitle">Last updated: March 18, 2026</p>
      </div>
      
      <div className="glass-card" style={{ padding: '32px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>1. Agreement to Terms</h2>
          <p>By accessing and using Flash AI, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you are prohibited from using the system.</p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>2. User Representations</h2>
          <p>By using the system, you represent and warrant that all registration information you submit will be true, accurate, current, and complete; and you will maintain the accuracy of such information.</p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>3. Prohibited Activities</h2>
          <p>Users may not access or use the system for any purpose other than that for which we make the platform available. Unauthorized use of the system, including collecting usernames or email addresses of users by electronic or other means is prohibited.</p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>4. Modifications and Interruptions</h2>
          <p>We reserve the right to change, modify, or remove the contents of the system at any time or for any reason at our sole discretion without notice. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the system.</p>
        </section>
      </div>
    </div>
  )
}
