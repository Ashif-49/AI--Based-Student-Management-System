import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import UserAvatar from '../common/UserAvatar'
import { FiBell, FiSearch } from 'react-icons/fi'
import './Navbar.css'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/attendance': 'Attendance',
  '/grades': 'Grades',
  '/predictions': 'AI Predictions',
  '/reports': 'Reports & Analytics',
  '/chatbot': 'AI Chatbot',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms & Conditions',
  '/profile': 'User Profile',
}

export default function Navbar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[pathname] || 'Flash AI'

  return (
    <header className="navbar glass-panel">
      <div className="navbar-left">
        <h1 className="navbar-title">{title}</h1>
        <span className="navbar-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
      <div className="navbar-right">
        <div className="navbar-search">
          <FiSearch size={16} />
          <input placeholder="Search..." />
        </div>
        <button className="navbar-icon-btn" onClick={() => toast.success('You have no new notifications')}>
          <FiBell size={18} />
          <span className="navbar-notif-dot" />
        </button>
        <UserAvatar user={user} className="navbar-avatar" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')} />
      </div>
    </header>
  )
}
