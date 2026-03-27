import { motion } from 'framer-motion'

export default function PrivacyPolicy() {
  return (
    <div className="animate-fadeInUp" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Privacy Policy</h1>
        <p className="page-subtitle">Last updated: March 18, 2026</p>
      </div>
      
      <div className="glass-card" style={{ padding: '32px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>1. Introduction</h2>
          <p>Welcome to Flash AI. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your data when you use our Student Management System.</p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>2. Information We Collect</h2>
          <p>We collect personal information that you provide to us such as name, email address, student identification codes, and academic records. This information is necessary for the functional operation of the management system.</p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>3. How We Use Your Information</h2>
          <p>We use your information to facilitate student administration, track attendance, manage grades, and provide AI-driven performance predictions to help identify students who may need additional support.</p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>4. Data Security</h2>
          <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.</p>
        </section>
      </div>
    </div>
  )
}
