import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import UserAvatar from '../common/UserAvatar'
import {
  FiGrid, FiUsers, FiCalendar, FiBarChart2,
  FiCpu, FiPieChart, FiLogOut, FiShield, FiMessageSquare, FiClipboard, FiUserCheck
} from 'react-icons/fi'

import './Sidebar.css'

const navItems = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/students', icon: FiUsers, label: 'Students', allowedRoles: ['admin', 'teacher'] },
  { to: '/attendance', icon: FiCalendar, label: 'Attendance' },
  { to: '/grades', icon: FiBarChart2, label: 'Grades' },
  { to: '/predictions', icon: FiCpu, label: 'AI Predictions' },
  { to: '/reports', icon: FiPieChart, label: 'Reports', allowedRoles: ['admin', 'teacher'] },
  { to: '/approvals', icon: FiUserCheck, label: 'Approvals', allowedRoles: ['admin'] },
  { to: '/chatbot', icon: FiMessageSquare, label: 'AI Chatbot' },
  { to: '/privacy', icon: FiShield, label: 'Privacy Policy' },
  { to: '/terms', icon: FiClipboard, label: 'Terms & Conditions' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar glass-panel">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <FiCpu size={22} />
        </div>
        <div>
          <div className="sidebar-logo-title">Flash AI</div>
          <div className="sidebar-logo-sub">Student Management</div>
        </div>
      </div>

      {/* User card */}
      <div className="sidebar-user glass-card">
        <UserAvatar user={user} className="sidebar-user-avatar" />
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-role">
            <FiShield size={11} />
            {user?.role}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Navigation</div>
        {navItems.map(({ to, icon: Icon, label, allowedRoles }) => {
          if (allowedRoles && !allowedRoles.includes(user?.role)) return null
          return (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <button className="sidebar-logout" onClick={handleLogout}>
        <FiLogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  )
}
