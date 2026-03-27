import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../services/api'
import { FiMail, FiLock, FiCpu, FiEye, FiEyeOff } from 'react-icons/fi'
import './Auth.css'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const suggestedEmail = location.state?.email
    if (suggestedEmail) {
      setForm((current) => ({ ...current, email: suggestedEmail }))
    }

    if (location.state?.pendingNotice) {
      toast.success('Registration successful. Waiting for admin approval.')
    }
  }, [location.state])

  const pendingNotice = Boolean(location.state?.pendingNotice)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await login(form.email.trim().toLowerCase(), form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Login failed. Check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

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
            <div className="auth-logo-sub">Student Management System</div>
          </div>
        </div>

        <h2 className="auth-heading">Welcome Back</h2>
        <p className="auth-sub">Sign in to your account to continue</p>

        <form onSubmit={submit} className="auth-form">
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-icon-wrap">
              <FiMail className="input-icon" size={16} />
              <input
                className="input-field input-with-icon"
                type="email"
                name="email"
                placeholder="user@school.com"
                value={form.email}
                onChange={handle}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="input-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: 14, color: '#8b5cf6', textDecoration: 'none' }}>Forgot Password?</Link>
            </div>
            <div className="input-icon-wrap">
              <FiLock className="input-icon" size={16} />
              <input
                className="input-field input-with-icon"
                type={showPwd ? 'text' : 'password'}
                name="password"
                placeholder="********"
                value={form.password}
                onChange={handle}
                autoComplete="current-password"
              />
              <button type="button" className="input-icon-right" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <><div className="btn-spinner" />Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register" className="auth-link">Register</Link>
        </p>

        <div className="auth-demo-hint">
          {pendingNotice
            ? 'Registration submitted. Please wait until any admin approves your account.'
            : 'First time? Create a student or teacher account and wait for admin approval.'}
        </div>
      </motion.div>
    </div>
  )
}
