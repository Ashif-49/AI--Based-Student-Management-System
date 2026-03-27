import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { studentsAPI, attendanceAPI, gradesAPI, predictionsAPI } from '../services/api'
import { FiArrowLeft, FiMail, FiPhone, FiMapPin, FiCalendar, FiBook, FiAward, FiAlertTriangle, FiCpu } from 'react-icons/fi'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function StudentDetail() {
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [grades, setGrades] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [sReq, aReq, gReq] = await Promise.all([
          studentsAPI.getById(id),
          attendanceAPI.getByStudent(id),
          gradesAPI.getByStudent(id)
        ])
        setStudent(sReq.data.data)
        setAttendance(aReq.data.summary)
        
        // Format grades for chart
        const gData = gReq.data.data.slice().reverse().map(g => ({
          name: `${g.subject} (S${g.semester})`,
          score: (g.score / g.maxScore) * 100,
          grade: g.grade
        }))
        setGrades(gData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div className="loader"><div className="spinner" /></div>
  if (!student) return <div style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>Student not found.</div>

  const p = student.latestPrediction
  const riskColor = p ? (p.riskLevel === 'low' ? '#10b981' : p.riskLevel === 'moderate' ? '#f59e0b' : p.riskLevel === 'high' ? '#ef4444' : '#dc2626') : '#64748b'

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'rgba(15,15,40,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
        <div style={{ color: '#94a3b8', marginBottom: 4 }}>{payload[0].payload.name}</div>
        <div style={{ color: '#a78bfa' }}>Score: <strong>{typeof payload[0].value === 'number' ? payload[0].value.toFixed(1) : payload[0].value}%</strong></div>
        <div style={{ color: '#06b6d4', marginTop: 2 }}>Grade: <strong>{payload[0].payload.grade}</strong></div>
      </div>
    )
  }

  return (
    <div className="animate-fadeInUp">
      <div className="page-header flex items-center gap-4">
        <Link to="/students" className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}><FiArrowLeft /></Link>
        <div>
          <h1 className="page-title">{student.user?.name}</h1>
          <p className="page-subtitle">{student.studentCode} • {student.department}</p>
        </div>
      </div>

      <div className="grid grid-3 gap-6">
        {/* Left Column: Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.div className="glass-card" style={{ padding: 24, textAlign: 'center' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 32, margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}>
              {student.user?.name?.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{student.user?.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#a78bfa', fontSize: 13, fontWeight: 500, marginBottom: 20, fontFamily: 'monospace' }}>
              <FiBook size={14} /> {student.studentCode}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#94a3b8' }}><FiMail size={14} /> <span style={{ color: '#e2e8f0' }}>{student.user?.email}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#94a3b8' }}><FiPhone size={14} /> <span style={{ color: '#e2e8f0' }}>{student.phone || 'Not provided'}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#94a3b8' }}><FiMapPin size={14} /> <span style={{ color: '#e2e8f0' }}>{student.address || 'Not provided'}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#94a3b8' }}><FiCalendar size={14} /> <span style={{ color: '#e2e8f0' }}>Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}</span></div>
            </div>
          </motion.div>

          {/* AI Risk Widget */}
          <motion.div className="glass-card" style={{ padding: 24, background: p ? `rgba(${riskColor.replace('#', '').match(/.{2}/g).map(c=>parseInt(c,16)).join(',')}, 0.08)` : 'var(--glass-bg)', border: `1px solid ${riskColor}40` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}><FiCpu color="#8b5cf6" /> AI Assessment</h3>
              {p && <span className="badge" style={{ background: `${riskColor}22`, color: riskColor, border: `1px solid ${riskColor}40` }}>{p.riskLevel} Risk</span>}
            </div>
            {p ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 42, fontWeight: 900, color: riskColor, lineHeight: 1 }}>{p.riskScore}</div>
                  <div style={{ color: '#64748b', fontSize: 13, paddingBottom: 6 }}>/ 100 Risk Score</div>
                </div>
                <Link to="/predictions" className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}>View Full Analysis</Link>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: '20px 0' }}>
                <FiAlertTriangle size={24} style={{ marginBottom: 8, color: '#f59e0b' }} />
                <div>No AI prediction generated yet.</div>
                <Link to="/predictions" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>Generate Now</Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column: Key Metrics & Charts */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Top KPI Cards */}
          <div className="grid grid-3 gap-4">
            <motion.div className="glass-card" style={{ padding: 20 }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiAward size={18} /></div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Cumulative GPA</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9' }}>{parseFloat(student.gpa || 0).toFixed(2)} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>/ 4.0</span></div>
            </motion.div>

            <motion.div className="glass-card" style={{ padding: 20 }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,182,212,0.1)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiBook size={18} /></div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Academic Standing</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginTop: 8 }}>Year {student.year} / Sem {student.semester}</div>
            </motion.div>

            <motion.div className="glass-card" style={{ padding: 20 }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCalendar size={18} /></div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Attendance Rate</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: attendance?.rate >= 80 ? '#10b981' : attendance?.rate >= 60 ? '#f59e0b' : '#ef4444' }}>
                {attendance?.rate ?? 0}% <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>({attendance?.present ?? 0}/{attendance?.total ?? 0})</span>
              </div>
            </motion.div>
          </div>

          {/* Performance Chart */}
          <motion.div className="glass-card" style={{ padding: 24, flex: 1 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>📈 Grade Progression</h3>
              <Link to="/grades" className="btn btn-secondary btn-sm">Manage Grades</Link>
            </div>
            
            {grades && grades.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={grades}>
                  <defs>
                    <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fill="url(#gradScore)" dot={{ fill: '#0d0d2b', stroke: '#8b5cf6', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, strokeWidth: 0, fill: '#06b6d4' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }}>
                No grade records available.
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
