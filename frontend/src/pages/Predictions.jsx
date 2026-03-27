import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { getApiErrorMessage, predictionsAPI, studentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiCpu, FiAlertTriangle } from 'react-icons/fi'

const RISK_CONFIG = {
  low: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', label: 'Low Risk', emoji: 'Low' },
  moderate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'Moderate Risk', emoji: 'Moderate' },
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: 'High Risk', emoji: 'High' },
  critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.5)', label: 'Critical Risk', emoji: 'Critical' },
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

const ScoreGauge = ({ value, label, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 8px' }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${2 * Math.PI * 32}`}
          strokeDashoffset={`${2 * Math.PI * 32 * (1 - value / 100)}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color }}>{value}</div>
    </div>
    <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
  </div>
)

export default function Predictions() {
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'teacher'
  const ownStudent = buildStudentOption(user)

  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [atRisk, setAtRisk] = useState([])

  useEffect(() => {
    const nextOwnStudent = buildStudentOption(user)
    if (canManage) {
      studentsAPI.getAll({ limit: 100 }).then((r) => setStudents(r.data.data)).catch(() => setStudents([]))
      predictionsAPI.getAllAtRisk().then((r) => setAtRisk(r.data.data)).catch(() => setAtRisk([]))
      return
    }

    if (nextOwnStudent) {
      setStudents([nextOwnStudent])
      setSelectedStudent(String(nextOwnStudent.id))
    } else {
      setStudents([])
      setSelectedStudent('')
    }
    setAtRisk([])
  }, [canManage, user])

  useEffect(() => {
    if (!selectedStudent) return
    setLoading(true)
    predictionsAPI.getLatest(selectedStudent)
      .then((r) => setPrediction(r.data.data))
      .catch(() => setPrediction(null))
      .finally(() => setLoading(false))
  }, [selectedStudent])

  const generate = async () => {
    if (!selectedStudent) return toast.error('Select a student first')
    setGenerating(true)
    try {
      const res = await predictionsAPI.generate(selectedStudent)
      setPrediction(res.data.data)
      toast.success('AI prediction generated!')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Add grades and attendance data first'))
    } finally {
      setGenerating(false)
    }
  }

  const cfg = prediction ? RISK_CONFIG[prediction.riskLevel] : null

  return (
    <div className="animate-fadeInUp">
      <div className="page-header">
        <h1 className="page-title">AI Predictions</h1>
        <p className="page-subtitle">
          {canManage ? 'Generate and review student AI risk analysis' : 'Review your latest AI risk assessment'}
        </p>
      </div>

      {!canManage && !ownStudent && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, color: '#f8fafc' }}>
          Your student profile is not linked yet. Sign out and sign back in once after this update, or ask an admin to verify your account.
        </div>
      )}

      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: 240 }}>
            <label className="input-label">{canManage ? 'Select Student' : 'Student'}</label>
            {canManage ? (
              <select className="input-field" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                <option value="">- Select a student -</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.user?.name || s.studentCode} ({s.studentCode})</option>)}
              </select>
            ) : (
              <input className="input-field" value={ownStudent?.user?.name || ''} readOnly />
            )}
          </div>
          {canManage && (
            <button className="btn btn-primary" onClick={generate} disabled={generating || !selectedStudent}>
              {generating ? <><div className="btn-spinner" />Analyzing...</> : <><FiCpu size={16} /> Generate Prediction</>}
            </button>
          )}
        </div>
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> : prediction && cfg && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass-card" style={{ padding: 28, marginBottom: 20, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: cfg.color }}>{cfg.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
                <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>
                  Overall Risk Score: <strong style={{ color: cfg.color, fontSize: 20 }}>{prediction.riskScore}/100</strong>
                  <span style={{ color: '#475569', marginLeft: 12 }}>Generated: {new Date(prediction.generatedAt).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                <ScoreGauge value={prediction.attendanceScore} label="Attendance" color="#06b6d4" />
                <ScoreGauge value={prediction.academicScore} label="Academic" color="#8b5cf6" />
                <ScoreGauge value={prediction.trendScore} label="Trend" color="#10b981" />
              </div>
            </div>
          </div>

          <div className="grid grid-2 gap-4">
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>AI Recommendations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(prediction.recommendations || []).map((rec, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 14, color: '#e2e8f0', borderLeft: `3px solid ${cfg.color}`, lineHeight: 1.5 }}>
                    {rec}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>Analysis Insights</h3>
              {prediction.insights && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Total Grades', value: prediction.insights.totalGrades },
                    { label: 'Attendance Days', value: prediction.insights.totalAttendanceDays },
                    { label: 'Attendance Rate', value: `${prediction.insights.attendanceRate}%` },
                    { label: 'Average Score', value: `${prediction.insights.avgScore}%` },
                    { label: 'Performance Trend', value: prediction.insights.performanceTrend, capitalize: true },
                    { label: 'Grade: A', value: prediction.insights.gradeDistribution?.A || 0 },
                    { label: 'Grade: B', value: prediction.insights.gradeDistribution?.B || 0 },
                    { label: 'Grade: F', value: prediction.insights.gradeDistribution?.F || 0 },
                  ].map(({ label, value, capitalize }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#64748b' }}>{label}</span>
                      <span style={{ fontWeight: 600, color: '#f1f5f9', textTransform: capitalize ? 'capitalize' : 'none' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {!loading && !prediction && selectedStudent && !canManage && (
        <div className="glass-card" style={{ padding: 24, color: '#cbd5e1' }}>
          No prediction has been generated for your account yet. A teacher or admin can generate one after attendance and grade data are available.
        </div>
      )}

      {canManage && atRisk.length > 0 && (
        <motion.div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginTop: 24 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiAlertTriangle color="#ef4444" size={18} />
            <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>At-Risk Students ({atRisk.length})</h3>
          </div>
          <table className="data-table">
            <thead><tr><th>Student</th><th>Department</th><th>Risk Level</th><th>Risk Score</th><th>Generated</th></tr></thead>
            <tbody>
              {atRisk.map((p) => {
                const risk = RISK_CONFIG[p.riskLevel]
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.student?.user?.name || '-'}</td>
                    <td style={{ color: '#64748b' }}>{p.student?.department || '-'}</td>
                    <td><span className="badge" style={{ background: risk.bg, color: risk.color, border: `1px solid ${risk.border}` }}>{p.riskLevel}</span></td>
                    <td><span style={{ fontWeight: 700, color: risk.color }}>{p.riskScore}</span>/100</td>
                    <td style={{ color: '#475569', fontSize: 12 }}>{new Date(p.generatedAt).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  )
}
