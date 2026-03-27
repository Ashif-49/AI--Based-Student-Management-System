import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { dashboardAPI } from '../services/api'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(15,15,40,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || '#a78bfa' }}>{p.name}: <strong>{typeof p.value === 'number' ? parseFloat(p.value).toFixed(1) : p.value}</strong></div>)}
    </div>
  )
}

const DEPT_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1']

export default function Reports() {
  const [stats, setStats] = useState(null)
  const [trend, setTrend] = useState([])

  useEffect(() => {
    dashboardAPI.getStats().then(r => setStats(r.data.data)).catch(() => {})
    dashboardAPI.getPerformanceTrend().then(r => setTrend(r.data.data.map(d => ({ name: `Y${d.year} S${d.semester}`, avg: parseFloat(d.avgScore).toFixed(1), count: d.count })))).catch(() => {})
  }, [])

  const mockTrend = trend.length ? trend : [
    { name: 'Y1 S1', avg: 72, count: 45 }, { name: 'Y1 S2', avg: 75, count: 48 },
    { name: 'Y2 S1', avg: 70, count: 52 }, { name: 'Y2 S2', avg: 78, count: 50 },
    { name: 'Y3 S1', avg: 76, count: 55 }, { name: 'Y3 S2', avg: 82, count: 60 },
  ]

  const depts = stats?.departments || [
    { department: 'Computer Science', count: 80 }, { department: 'Mathematics', count: 60 },
    { department: 'Physics', count: 45 }, { department: 'EE', count: 63 },
  ]

  const attendanceData = stats?.attendanceStats || [
    { status: 'present', count: 1820 }, { status: 'absent', count: 180 },
    { status: 'late', count: 95 }, { status: 'excused', count: 45 },
  ]

  const yearData = stats?.yearDistribution || [
    { year: 1, count: 85 }, { year: 2, count: 70 }, { year: 3, count: 55 }, { year: 4, count: 38 }
  ]

  return (
    <div className="animate-fadeInUp">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Comprehensive data visualization and institutional insights</p>
        </div>
      </div>

      {/* Performance Trend */}
      <motion.div className="glass-card" style={{ padding: 28, marginBottom: 24 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, color: '#f1f5f9' }}>📈 Academic Performance Trend</h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Average score progression across semesters</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={mockTrend}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} domain={[50, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="avg" name="Avg Score" stroke="#8b5cf6" strokeWidth={3} fill="url(#g1)" dot={{ fill: '#8b5cf6', r: 5, strokeWidth: 2, stroke: '#0d0d2b' }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-2 gap-4" style={{ marginBottom: 24 }}>
        {/* Department */}
        <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#f1f5f9' }}>🏫 Students by Department</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Enrollment distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={depts} layout="vertical">
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="department" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Students" radius={[0, 6, 6, 0]}>
                {depts.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Year Distribution */}
        <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#f1f5f9' }}>📚 Students by Year</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Year-wise enrollment counts</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={yearData}>
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `Year ${v}`} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Students" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 6, strokeWidth: 2, stroke: '#0d0d2b' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Attendance Breakdown */}
      <motion.div className="glass-card" style={{ padding: 24 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#f1f5f9' }}>📋 Attendance Breakdown</h3>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Overall attendance status distribution</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <ResponsiveContainer width="50%" height={200}>
            <PieChart>
              <Pie data={attendanceData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                {attendanceData.map((_, i) => <Cell key={i} fill={['#10b981','#ef4444','#f59e0b','#06b6d4'][i]} />)}
              </Pie>
              <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 12, textTransform: 'capitalize' }}>{v}</span>} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,40,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {attendanceData.map((d, i) => (
              <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: ['#10b981','#ef4444','#f59e0b','#06b6d4'][i] }}>{d.count}</div>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize', marginTop: 4 }}>{d.status}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
