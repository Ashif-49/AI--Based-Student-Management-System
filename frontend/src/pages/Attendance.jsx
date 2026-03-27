import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { attendanceAPI, getApiErrorMessage, studentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiCheck, FiX, FiClock, FiFileText } from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const STATUS_CONFIG = {
  present: { icon: FiCheck, color: '#10b981', label: 'Present' },
  absent: { icon: FiX, color: '#ef4444', label: 'Absent' },
  late: { icon: FiClock, color: '#f59e0b', label: 'Late' },
  excused: { icon: FiFileText, color: '#06b6d4', label: 'Excused' },
}

const buildStudentOption = (user) => {
  if (!user?.studentInfo) return null
  return {
    ...user.studentInfo,
    user: {
      name: user.name,
      email: user.email,
    },
  }
}

export default function Attendance() {
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'teacher'
  const ownStudent = buildStudentOption(user)

  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], status: 'present', subject: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const nextOwnStudent = buildStudentOption(user)
    if (canManage) {
      studentsAPI.getAll({ limit: 100 })
        .then((r) => setStudents(r.data.data))
        .catch(() => setStudents([]))
      return
    }

    if (nextOwnStudent) {
      setStudents([nextOwnStudent])
      setSelectedStudent(String(nextOwnStudent.id))
    } else {
      setStudents([])
      setSelectedStudent('')
    }
  }, [canManage, user])

  useEffect(() => {
    if (!selectedStudent) return
    setLoading(true)
    attendanceAPI.getByStudent(selectedStudent)
      .then((r) => {
        setRecords(r.data.data)
        setSummary(r.data.summary)
      })
      .catch(() => {
        setRecords([])
        setSummary(null)
      })
      .finally(() => setLoading(false))
  }, [selectedStudent])

  const markAttendance = async (e) => {
    e.preventDefault()
    if (!selectedStudent) return toast.error('Select a student first')

    try {
      await attendanceAPI.mark({ studentId: selectedStudent, ...form })
      toast.success('Attendance marked!')
      const refresh = await attendanceAPI.getByStudent(selectedStudent)
      setRecords(refresh.data.data)
      setSummary(refresh.data.summary)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to mark attendance'))
    }
  }

  const chartData = Object.entries(STATUS_CONFIG).map(([key, v]) => ({
    name: v.label,
    value: records.filter((r) => r.status === key).length,
    color: v.color,
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'rgba(15,15,40,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#e2e8f0' }}>
        {payload[0].name}: <strong>{payload[0].value}</strong>
      </div>
    )
  }

  return (
    <div className="animate-fadeInUp">
      <div className="page-header">
        <h1 className="page-title">Attendance Tracking</h1>
        <p className="page-subtitle">
          {canManage ? 'Mark daily attendance and review attendance history' : 'View your attendance history and attendance percentage'}
        </p>
      </div>

      {!canManage && !ownStudent && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, color: '#f8fafc' }}>
          Your student profile is not ready yet. Sign out and sign back in once after this update, or ask an admin to check your account.
        </div>
      )}

      <div className="grid grid-2 gap-4" style={{ marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#f1f5f9' }}>
            {canManage ? 'Mark Attendance' : 'Attendance Overview'}
          </h3>

          {canManage ? (
            <form onSubmit={markAttendance} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Select Student</label>
                <select className="input-field" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                  <option value="">- Select a student -</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user?.name || s.studentCode} ({s.studentCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Date</label>
                <input className="input-field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Subject (optional)</label>
                <input className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics, Physics..." />
              </div>
              <div className="input-group">
                <label className="input-label">Status</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {Object.entries(STATUS_CONFIG).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      type="button"
                      className={form.status === key ? 'btn' : 'btn btn-secondary'}
                      style={form.status === key ? { background: `${color}33`, color, border: `1px solid ${color}66` } : {}}
                      onClick={() => setForm({ ...form, status: key })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Mark Attendance</button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Student Name</label>
                <input className="input-field" value={ownStudent?.user?.name || ''} readOnly />
              </div>
              <div className="input-group">
                <label className="input-label">Student Code</label>
                <input className="input-field" value={ownStudent?.studentCode || ''} readOnly />
              </div>
              <div className="input-group">
                <label className="input-label">Department</label>
                <input className="input-field" value={ownStudent?.department || ''} readOnly />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {summary && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>Attendance Summary</h3>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 42, fontWeight: 900, background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {summary.rate}%
                </div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Attendance Rate</div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <motion.div className="glass-card" style={{ padding: 0, overflow: 'hidden' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Recent Attendance Records</h3>
          </div>
          {loading ? (
            <div className="loader"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Subject</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 20).map((r) => {
                  const cfg = STATUS_CONFIG[r.status]
                  return (
                    <tr key={r.id}>
                      <td>{new Date(r.date).toLocaleDateString()}</td>
                      <td><span className="badge" style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44` }}>{cfg.label}</span></td>
                      <td>{r.subject || '-'}</td>
                      <td style={{ color: '#64748b' }}>{r.notes || '-'}</td>
                    </tr>
                  )
                })}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#475569', padding: 30 }}>No attendance records yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </motion.div>
      )}
    </div>
  )
}
