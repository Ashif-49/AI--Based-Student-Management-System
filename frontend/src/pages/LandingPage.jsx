import { Link } from 'react-router-dom'
import {
  FiActivity,
  FiArrowRight,
  FiCommand,
  FiCpu,
  FiLayers,
  FiShield,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi'
import './LandingPage.css'

const brandLogos = ['NEXUSLABS', 'VERTEX ONE', 'QUANTIQ', 'LUMINA AI', 'DATAPULSE', 'ZENBYTE']

const features = [
  {
    icon: FiActivity,
    title: 'Predictive Intelligence',
    description: 'Identify risk patterns and intervene faster with always-on AI monitoring.',
  },
  {
    icon: FiLayers,
    title: 'Workflow Automation',
    description: 'Auto-route attendance, grading, and performance updates into one smart pipeline.',
  },
  {
    icon: FiShield,
    title: 'Secure Data Fabric',
    description: 'Role-based controls and encrypted activity streams keep operations protected.',
  },
]

const quickStats = [
  { value: '99.4%', label: 'Prediction Accuracy' },
  { value: '240K+', label: 'Automations Executed' },
  { value: '3.8x', label: 'Faster Decisions' },
]

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-grid-overlay" />
      <div className="landing-radial radial-purple" />
      <div className="landing-radial radial-pink" />
      <div className="landing-radial radial-blue" />

      <header className="landing-nav glass-shell">
        <div className="landing-brand">
          <span className="brand-mark"><FiCpu size={17} /></span>
          <span className="brand-name">Flash AI</span>
        </div>

        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#platform">Platform</a>
          <a href="#partners">Partners</a>
        </nav>

        <div className="landing-nav-actions">
          <Link to="/login" className="nav-link-btn">Sign In</Link>
          <Link to="/register" className="nav-primary-btn">
            Start Free
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section" id="platform">
          <div className="hero-copy">
            <span className="hero-badge">
              <FiZap size={14} />
              AI Workflow Platform
            </span>

            <h1>Build Autonomous Student Operations With One Intelligent SaaS Layer</h1>

            <p>
              Orchestrate attendance, grading, risk scoring, and performance reporting with a premium
              AI-native workspace designed for speed, clarity, and scale.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="hero-primary-cta">
                Launch Your Workflow
                <FiArrowRight size={16} />
              </Link>
              <Link to="/dashboard" className="hero-secondary-cta">
                Open Dashboard
              </Link>
            </div>

            <div className="hero-stats">
              {quickStats.map((stat) => (
                <article key={stat.label} className="hero-stat-card glass-shell">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="hero-visual glass-shell">
            <svg className="chip-network" viewBox="0 0 520 420" aria-hidden="true">
              <g stroke="rgba(137, 152, 255, 0.48)" strokeWidth="1.1" fill="none">
                <path d="M60 90 H190" />
                <path d="M60 330 H190" />
                <path d="M330 90 H460" />
                <path d="M330 330 H460" />
                <path d="M260 35 V145" />
                <path d="M260 275 V385" />
                <path d="M130 210 H210" />
                <path d="M310 210 H390" />
                <path d="M130 210 V90" />
                <path d="M130 210 V330" />
                <path d="M390 210 V90" />
                <path d="M390 210 V330" />
              </g>
              <g fill="rgba(110, 196, 255, 0.85)">
                <circle cx="60" cy="90" r="4.3" />
                <circle cx="60" cy="330" r="4.3" />
                <circle cx="460" cy="90" r="4.3" />
                <circle cx="460" cy="330" r="4.3" />
                <circle cx="260" cy="35" r="4.3" />
                <circle cx="260" cy="385" r="4.3" />
                <circle cx="130" cy="90" r="3.3" />
                <circle cx="130" cy="330" r="3.3" />
                <circle cx="390" cy="90" r="3.3" />
                <circle cx="390" cy="330" r="3.3" />
              </g>
            </svg>

            <div className="ai-chip-core">
              <FiCommand size={30} />
              <span>AI CORE</span>
            </div>

            <article className="floating-ui-card card-one glass-shell">
              <FiActivity size={16} />
              <div>
                <strong>Live Risk Scan</strong>
                <span>24 students flagged</span>
              </div>
            </article>

            <article className="floating-ui-card card-two glass-shell">
              <FiTrendingUp size={16} />
              <div>
                <strong>Score Momentum</strong>
                <span>+18.6% this month</span>
              </div>
            </article>

            <article className="floating-ui-card card-three glass-shell">
              <FiZap size={16} />
              <div>
                <strong>Auto Actions</strong>
                <span>142 workflows active</span>
              </div>
            </article>
          </div>
        </section>

        <section className="partners-section" id="partners">
          <p>Teams building modern AI operations trust the platform</p>
          <div className="logo-strip">
            {brandLogos.map((logo) => (
              <span key={logo} className="logo-item">{logo}</span>
            ))}
          </div>
        </section>

        <section className="features-section" id="features">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <article key={feature.title} className="feature-card glass-shell">
                <span className="feature-icon">
                  <Icon size={18} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
