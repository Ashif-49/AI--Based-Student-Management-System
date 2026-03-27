import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FiCamera,
  FiCheckCircle,
  FiEdit2,
  FiLock,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiTrash2,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { getApiErrorMessage, profileAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import UserAvatar from '../components/common/UserAvatar'
import './Profile.css'

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(new Error('Unable to read the selected image.'))
  reader.readAsDataURL(file)
})

export default function Profile() {
  const { user, setAuthenticatedUser, refreshUser } = useAuth()
  const fileInputRef = useRef(null)

  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    avatar: null,
    role: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!user) return

    setProfileForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || '',
      avatar: user.avatar || null,
      role: user.role || '',
    })
  }, [user])

  const roleLabel = useMemo(() => {
    if (!user?.role) return 'User'
    return user.role.charAt(0).toUpperCase() + user.role.slice(1)
  }, [user?.role])

  const departmentLabel = user?.role === 'student' ? 'Department / Course' : 'Department'

  const resetProfileForm = () => {
    if (!user) return
    setProfileForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || '',
      avatar: user.avatar || null,
      role: user.role || '',
    })
    setEditMode(false)
  }

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setProfileForm((current) => ({ ...current, [name]: value }))
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordForm((current) => ({ ...current, [name]: value }))
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }

    if (file.size > 1024 * 1024) {
      toast.error('Please choose an image smaller than 1 MB.')
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setEditMode(true)
      setProfileForm((current) => ({ ...current, avatar: dataUrl }))
      toast.success('Profile photo ready to save.')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast.error('Full name and email are required.')
      return
    }

    setSaving(true)
    try {
      const response = await profileAPI.update({
        name: profileForm.name.trim(),
        email: profileForm.email.trim().toLowerCase(),
        phone: profileForm.phone.trim(),
        department: profileForm.department.trim(),
        avatar: profileForm.avatar,
        role: user?.role,
      })
      setAuthenticatedUser(response.data.data)
      setEditMode(false)
      toast.success(response.data.message || 'Profile updated successfully.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update profile'))
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields.')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match.')
      return
    }

    setChangingPassword(true)
    try {
      const response = await profileAPI.changePassword(passwordForm)
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      toast.success(response.data.message || 'Password changed successfully.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to change password'))
    } finally {
      setChangingPassword(false)
    }
  }

  const handleRefreshProfile = async () => {
    try {
      const nextUser = await refreshUser()
      if (nextUser) {
        toast.success('Profile reloaded.')
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to reload profile'))
    }
  }

  if (!user) return null

  return (
    <div className="profile-page animate-fadeInUp">
      <div className="page-header">
        <h1 className="page-title">User Profile</h1>
        <p className="page-subtitle">Manage your account details, profile photo, and sign-in security.</p>
      </div>

      <section className="profile-hero">
        <motion.div
          className="glass-card profile-hero-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="profile-avatar-shell">
            <UserAvatar user={{ ...user, avatar: profileForm.avatar }} className="profile-avatar" />
            <button
              type="button"
              className="profile-avatar-btn"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile photo"
            >
              <FiCamera size={16} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="profile-hidden-input"
            onChange={handleAvatarUpload}
          />

          <div className="profile-name">{profileForm.name || user.name}</div>
          <div className="page-subtitle">{profileForm.email || user.email}</div>

          <div className="profile-meta">
            <span className="profile-meta-pill"><FiShield size={14} /> {roleLabel}</span>
            <span className="profile-meta-pill"><FiPhone size={14} /> {user.phone || 'No phone added'}</span>
            <span className="profile-meta-pill"><FiMail size={14} /> Secure account</span>
          </div>

          <div className="profile-photo-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
              <FiCamera size={14} /> Change Photo
            </button>
            {profileForm.avatar && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditMode(true)
                  setProfileForm((current) => ({ ...current, avatar: null }))
                }}
              >
                <FiTrash2 size={14} /> Remove Photo
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          className="glass-card profile-section"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="profile-section-header">
            <div>
              <div className="profile-section-title">Account Snapshot</div>
              <div className="profile-section-subtitle">A quick view of your current profile details.</div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleRefreshProfile}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>

          <div className="profile-overview">
            <div className="profile-overview-card">
              <div className="profile-overview-label">Role</div>
              <div className="profile-overview-value">{roleLabel}</div>
            </div>
            <div className="profile-overview-card">
              <div className="profile-overview-label">{departmentLabel}</div>
              <div className="profile-overview-value">{user.department || 'Not set'}</div>
            </div>
            <div className="profile-overview-card">
              <div className="profile-overview-label">Phone</div>
              <div className="profile-overview-value">{user.phone || 'Not set'}</div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="profile-grid">
        <motion.div
          className="glass-card profile-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="profile-section-header">
            <div>
              <div className="profile-section-title">Basic Information</div>
              <div className="profile-section-subtitle">View and update your personal profile details.</div>
            </div>
            {!editMode ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>
                <FiEdit2 size={14} /> Edit Profile
              </button>
            ) : (
              <button type="button" className="btn btn-secondary btn-sm" onClick={resetProfileForm}>
                <FiX size={14} /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="profile-form-grid">
              <div className="input-group">
                <label className="input-label">Full Name</label>
                {editMode ? (
                  <input className="input-field" name="name" value={profileForm.name} onChange={handleProfileChange} />
                ) : (
                  <div className="profile-static">{user.name || '-'}</div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Email ID</label>
                {editMode ? (
                  <input className="input-field" type="email" name="email" value={profileForm.email} onChange={handleProfileChange} />
                ) : (
                  <div className="profile-static">{user.email || '-'}</div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Phone Number</label>
                {editMode ? (
                  <input className="input-field" name="phone" value={profileForm.phone} onChange={handleProfileChange} placeholder="+91 98765 43210" />
                ) : (
                  <div className="profile-static">{user.phone || 'Not provided'}</div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Role</label>
                <div className="profile-static">{roleLabel}</div>
                <div className="profile-hint">Role is visible here, but locked for security and access control.</div>
              </div>

              <div className="input-group profile-full-width">
                <label className="input-label">{departmentLabel}</label>
                {editMode ? (
                  <input
                    className="input-field"
                    name="department"
                    value={profileForm.department}
                    onChange={handleProfileChange}
                    placeholder={user.role === 'student' ? 'Computer Science' : 'Student Affairs'}
                  />
                ) : (
                  <div className="profile-static">{user.department || 'Not provided'}</div>
                )}
              </div>
            </div>

            {editMode && (
              <div className="profile-actions">
                <button type="button" className="btn btn-secondary" onClick={resetProfileForm}>
                  <FiX size={14} /> Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><div className="btn-spinner" />Saving...</> : <><FiSave size={14} /> Save Changes</>}
                </button>
              </div>
            )}
          </form>
        </motion.div>

        <div className="profile-side-stack">
          <motion.div
            className="glass-card profile-password-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="profile-section-header">
              <div>
                <div className="profile-section-title">Password Management</div>
                <div className="profile-section-subtitle">Change your password with current-password verification.</div>
              </div>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Current Password</label>
                <input
                  className="input-field"
                  type="password"
                  name="oldPassword"
                  value={passwordForm.oldPassword}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                />
              </div>

              <div className="input-group">
                <label className="input-label">New Password</label>
                <input
                  className="input-field"
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Confirm New Password</label>
                <input
                  className="input-field"
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                {changingPassword ? <><div className="btn-spinner" />Updating...</> : <><FiLock size={14} /> Change Password</>}
              </button>
            </form>
          </motion.div>

          <motion.div
            className="glass-card profile-password-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="profile-section-header">
              <div>
                <div className="profile-section-title">Account Safety</div>
                <div className="profile-section-subtitle">A few quick reminders for keeping this account secure.</div>
              </div>
            </div>

            <div className="profile-security-note">
              <FiCheckCircle size={18} style={{ color: 'var(--accent-cyan)' }} />
              <div>
                Update your password regularly, keep your profile photo professional, and contact an administrator if your role or access level ever looks incorrect.
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
