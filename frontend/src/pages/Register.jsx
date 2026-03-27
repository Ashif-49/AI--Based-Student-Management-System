import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../services/api'
import { FiMail, FiLock, FiUser, FiCpu, FiShield } from 'react-icons/fi'
import './Auth.css'

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'student',
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Fill all fields')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')

    const trimmedEmail = form.email.trim().toLowerCase()
    const trimmedName = form.name.trim()

    setLoading(true)
    try {
      const response = await register({
        name: trimmedName,
        email: trimmedEmail,
        password: form.password,
        role: form.role,
      })
      toast.success(response?.message || 'Account created. Waiting for admin approval.')
      navigate('/login', { state: { email: trimmedEmail, pendingNotice: true } })
    } catch (err) {
      const message = getApiErrorMessage(err, 'Registration failed.')
      if (err.response?.status === 409) {
        toast.error('Email already registered. Please sign in instead.')
        navigate('/login', { state: { email: trimmedEmail } })
        return
      }
      toast.error(message)
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
            <div className="auth-logo-sub">Create your account</div>
          </div>
        </div>

        <h2 className="auth-heading">Create Account</h2>
        <p className="auth-sub">Register as a student or teacher. Access is enabled after admin approval.</p>

        <form onSubmit={submit} className="auth-form">
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div className="input-icon-wrap">
              <FiUser className="input-icon" size={16} />
              <input
                className="input-field input-with-icon"
                name="name"
                placeholder="Dr. John Smith"
                value={form.name}
                onChange={handle}
              />
            </div>
          </div>

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
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Role</label>
            <div className="input-icon-wrap">
              <FiShield className="input-icon" size={16} />
              <select
                className="input-field input-with-icon"
                name="role"
                value={form.role}
                onChange={handle}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          </div>

          <div className="grid grid-2 gap-3">
            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" size={16} />
                <input
                  className="input-field input-with-icon"
                  type="password"
                  name="password"
                  placeholder="********"
                  value={form.password}
                  onChange={handle}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" size={16} />
                <input
                  className="input-field input-with-icon"
                  type="password"
                  name="confirm"
                  placeholder="********"
                  value={form.confirm}
                  onChange={handle}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <><div className="btn-spinner" />Submitting...</> : `Request ${form.role.charAt(0).toUpperCase() + form.role.slice(1)} Access`}
          </button>
        </form>

        <p className="auth-footer">Already have an account? <Link to="/login" className="auth-link">Sign In</Link></p>
      </motion.div>
    </div>
  )
}
