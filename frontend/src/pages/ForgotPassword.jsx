
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { authAPI, getApiErrorMessage } from '../services/api'
import { FiMail, FiCpu, FiArrowLeft } from 'react-icons/fi'
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')
    
    setLoading(true)
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase())
      setSent(true)
      toast.success('Password reset link sent to your email!')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send reset link.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      
      <motion.div
        className="auth-card glass-panel"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="auth-logo">
          <div className="auth-logo-icon"><FiCpu size={28} /></div>
          <div>
            <div className="auth-logo-title">Flash AI</div>
            <div className="auth-logo-sub">Password Recovery</div>
          </div>
        </div>

        <h2 className="auth-heading">Forgot Password</h2>
        
        {sent ? (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ color: '#10b981', marginBottom: 20, fontSize: 16 }}>
              Success! Check your email inbox for the reset link.
            </p>
            <Link to="/login" className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}>
              Return to Sign In
            </Link>
          </div>
        ) : (
          <>
            <p className="auth-sub">Enter your email address and we'll send you a link to reset your password.</p>
            <form onSubmit={submit} className="auth-form">
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div className="input-icon-wrap">
                  <FiMail className="input-icon" size={16} />
                  <input
                    className="input-field input-with-icon"
                    type="email"
                    placeholder="user@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                {loading ? <><div className="btn-spinner" />Sending...</> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        <div className="auth-footer" style={{ marginTop: 20 }}>
          <Link to="/login" className="auth-link" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <FiArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
