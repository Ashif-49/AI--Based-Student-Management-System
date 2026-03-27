import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { authAPI, getApiErrorMessage } from '../services/api'
import { FiLock, FiCpu, FiEye, FiEyeOff } from 'react-icons/fi'
import './Auth.css'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (!form.password || !form.confirm) return toast.error('Please fill in all fields')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    
    setLoading(true)
    try {
      await authAPI.resetPassword(token, form.password)
      toast.success('Your password has been successfully reset. Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to reset password. Token may be invalid or expired.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-orb auth-orb-1" />
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
            <div className="auth-logo-sub">Password Recovery</div>
          </div>
        </div>

        <h2 className="auth-heading">Reset Password</h2>
        <p className="auth-sub">Enter your new password below.</p>
        
        <form onSubmit={submit} className="auth-form">
          <div className="input-group">
            <label className="input-label">New Password</label>
            <div className="input-icon-wrap">
              <FiLock className="input-icon" size={16} />
              <input
                className="input-field input-with-icon"
                type={showPwd ? 'text' : 'password'}
                name="password"
                placeholder="********"
                value={form.password}
                onChange={handle}
                required
              />
              <button type="button" className="input-icon-right" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <div className="input-icon-wrap">
              <FiLock className="input-icon" size={16} />
              <input
                className="input-field input-with-icon"
                type={showPwd ? 'text' : 'password'}
                name="confirm"
                placeholder="********"
                value={form.confirm}
                onChange={handle}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <><div className="btn-spinner" />Resetting...</> : 'Save New Password'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: 20 }}>
          <Link to="/login" className="auth-link">Cancel and return to Sign In</Link>
        </div>
      </motion.div>
    </div>
  )
}
