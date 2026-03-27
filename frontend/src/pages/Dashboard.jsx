import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { dashboardAPI, getApiErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiUsers, FiCalendar, FiTrendingUp, FiAward, FiUserCheck } from 'react-icons/fi'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import './Dashboard.css'

const ATTENDANCE_COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  late: '#f59e0b',
  excused: '#06b6d4',
}

const RISK_COLORS = { low: '#10b981', moderate: '#f59e0b', high: '#ef4444', critical: '#dc2626' }

const EMPTY_STUDENT_STATS = {
  mode: 'student',
  currentGPA: '0.00',
  attendanceRate: 0,
  averageScore: 0,
  totalSubjects: 0,
  attendanceStats: [],
  recentGrades: [],
  latestPrediction: null,
}

const EMPTY_INSTITUTION_STATS = {
  mode: 'institution',
  totalStudents: 0,
  totalTeachers: 0,
  totalUsers: 0,
  atRiskStudents: 0,
  avgGPA: '0.00',
  avgScore: 0,
  avgAttendanceRate: 0,
  departments: [],
  yearDistribution: [],
  recentStudents: [],
  attendanceStats: [],
  riskDistribution: [],
}

const StatCard = ({ icon: Icon, value, label, color, delay }) => (
  <motion.div
    className="glass-card stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <div className="stat-icon" style={{ background: `${color}22`, color }}><Icon size={22} /></div>
    <div className="stat-value" style={{ color }}>{value}</div>
    <div className="stat-label">{label}</div>
  </motion.div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(15,15,40,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      {label && <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>}
      {payload.map((point, index) => (
        <div key={index} style={{ color: point.color || '#a78bfa' }}>
          {point.name}: <strong>{typeof point.value === 'number' ? point.value.toFixed(1) : point.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const emptyStats = user?.role === 'student' ? EMPTY_STUDENT_STATS : EMPTY_INSTITUTION_STATS
      const [statsResponse, trendResponse] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getPerformanceTrend(),
      ])

      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value.data?.data || emptyStats)
      } else {
        setStats(emptyStats)
        toast.error(getApiErrorMessage(statsResponse.reason, 'Failed to load dashboard overview'))
      }

      if (trendResponse.status === 'fulfilled') {
        setTrend(trendResponse.value.data?.data || [])
      } else {
        setTrend([])
        toast.error(getApiErrorMessage(trendResponse.reason, 'Failed to load performance trend'))
      }

      setLoading(false)
    }

    fetchData()
  }, [user?.role])

  const isStudentMode = stats?.mode === 'student' || user?.role === 'student'

  const trendData = trend.length
    ? trend.map((item) => ({ name: `Y${item.year} S${item.semester}`, avg: Number(item.avgScore) }))
    : []

  const attendanceData = stats?.attendanceStats?.length
    ? stats.attendanceStats
    : [
        { status: 'present', count: 0 },
        { status: 'absent', count: 0 },
        { status: 'late', count: 0 },
        { status: 'excused', count: 0 },
      ]

  const riskData = stats?.riskDistribution?.length
    ? stats.riskDistribution
    : [
        { riskLevel: 'low', count: 0 },
        { riskLevel: 'moderate', count: 0 },
        { riskLevel: 'high', count: 0 },
        { riskLevel: 'critical', count: 0 },
      ]

  if (loading) return <div className="loader"><div className="spinner" /></div>

  return (
    <div className="dashboard animate-fadeInUp">
      <div className="page-header">
        <h1 className="page-title">{isStudentMode ? `Welcome back, ${user?.name}` : 'Student Management Dashboard'}</h1>
        <p className="page-subtitle">
          {isStudentMode ? 'Track your attendance, marks, grade, and performance trend' : 'Monitor total students, attendance overview, and performance stats in one place'}
        </p>
      </div>

      {isStudentMode ? (
        <>
          <div className="grid grid-4 gap-4" style={{ marginBottom: 28 }}>
            <StatCard icon={FiAward} value={stats?.currentGPA ?? '0.00'} label="Current GPA" color="#8b5cf6" delay={0.1} />
            <StatCard icon={FiCalendar} value={`${stats?.attendanceRate ?? 0}%`} label="Attendance Rate" color="#06b6d4" delay={0.2} />
            <StatCard icon={FiTrendingUp} value={`${stats?.averageScore ?? 0}%`} label="Average Score" color="#10b981" delay={0.3} />
            <StatCard icon={FiUserCheck} value={stats?.totalSubjects ?? 0} label="Subjects" color="#f59e0b" delay={0.4} />
          </div>

          <div className="grid grid-2 gap-4" style={{ marginBottom: 28 }}>
            <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 className="chart-title">Performance Trend</h3>
              <p className="chart-sub">Average exam score across semesters</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="studentTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="avg" name="Average" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#studentTrend)" dot={{ fill: '#8b5cf6', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 className="chart-title">Attendance Overview</h3>
              <p className="chart-sub">Your attendance history by status</p>
              <div className="risk-pie-container">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={attendanceData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={42}>
                      {attendanceData.map((item, index) => <Cell key={index} fill={ATTENDANCE_COLORS[item.status] || '#8b5cf6'} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="risk-legend">
                  {attendanceData.map((item, index) => (
                    <div key={index} className="risk-legend-item">
                      <span className="risk-dot" style={{ background: ATTENDANCE_COLORS[item.status] || '#8b5cf6' }} />
                      <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{item.status}</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 700, marginLeft: 'auto' }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="chart-title">Quick Actions</h3>
            <p className="chart-sub">Open your academic data quickly</p>
            <div className="quick-actions">
              {[
                { to: '/attendance', label: 'Attendance History', desc: 'View attendance percentage and daily history' },
                { to: '/grades', label: 'Report Card', desc: 'Check total marks, average, and grade' },
                { to: '/predictions', label: 'AI Prediction', desc: 'Review your latest performance insight' },
              ].map((item) => (
                <Link key={item.to} to={item.to} className="quick-action-item glass-card">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </>
      ) : (
        <>
          <div className="grid grid-4 gap-4" style={{ marginBottom: 28 }}>
            <StatCard icon={FiUsers} value={stats?.totalStudents ?? 0} label="Total Students" color="#8b5cf6" delay={0.1} />
            <StatCard icon={FiUserCheck} value={stats?.totalTeachers ?? 0} label="Teachers" color="#06b6d4" delay={0.2} />
            <StatCard icon={FiCalendar} value={`${stats?.avgAttendanceRate ?? 0}%`} label="Attendance Overview" color="#10b981" delay={0.3} />
            <StatCard icon={FiTrendingUp} value={`${stats?.avgScore ?? 0}%`} label="Performance Stats" color="#f59e0b" delay={0.4} />
          </div>

          <div className="grid grid-2 gap-4" style={{ marginBottom: 28 }}>
            <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 className="chart-title">Performance Trend</h3>
              <p className="chart-sub">Institution-wide average marks by semester</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="institutionTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="avg" name="Average Score" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#institutionTrend)" dot={{ fill: '#8b5cf6', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 className="chart-title">Students by Department</h3>
              <p className="chart-sub">Department-wise student count</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.departments || []}>
                  <XAxis dataKey="department" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Students" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <div className="grid grid-2 gap-4">
            <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="chart-title">Attendance Overview</h3>
              <p className="chart-sub">Attendance distribution by status</p>
              <div className="risk-pie-container">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={attendanceData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {attendanceData.map((item, index) => <Cell key={index} fill={ATTENDANCE_COLORS[item.status] || '#8b5cf6'} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="risk-legend">
                  {attendanceData.map((item, index) => (
                    <div key={index} className="risk-legend-item">
                      <span className="risk-dot" style={{ background: ATTENDANCE_COLORS[item.status] || '#8b5cf6' }} />
                      <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{item.status}</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 700, marginLeft: 'auto' }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="chart-title">Risk Distribution</h3>
              <p className="chart-sub">Current student performance risk levels</p>
              <div className="risk-pie-container">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={riskData} dataKey="count" nameKey="riskLevel" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {riskData.map((item, index) => <Cell key={index} fill={RISK_COLORS[item.riskLevel] || '#8b5cf6'} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="risk-legend">
                  {riskData.map((item, index) => (
                    <div key={index} className="risk-legend-item">
                      <span className="risk-dot" style={{ background: RISK_COLORS[item.riskLevel] || '#8b5cf6' }} />
                      <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{item.riskLevel}</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 700, marginLeft: 'auto' }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

        </>
      )}
    </div>
  )
}
