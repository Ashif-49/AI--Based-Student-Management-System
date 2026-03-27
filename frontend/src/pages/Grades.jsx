import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { getApiErrorMessage, gradesAPI, studentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const EXAM_TYPES = ['final', 'midterm', 'quiz', 'assignment', 'project']
const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6]
const MAX_ALLOWED_SCORE = 100

const getMarkCategory = (percentage) => {
  const normalized = Number(percentage)
  if (!Number.isFinite(normalized)) return 'Fail'
  if (normalized <= 25) return 'Fail'
  if (normalized <= 70) return 'Average'
  return 'Good'
}

const getCategoryColor = (category) => {
  if (category === 'Good') return '#10b981'
  if (category === 'Average') return '#f59e0b'
  return '#ef4444'
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

export default function Grades() {
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'teacher'
  const ownStudent = buildStudentOption(user)

  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [grades, setGrades] = useState([])
  const [summary, setSummary] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editGrade, setEditGrade] = useState(null)
  const [form, setForm] = useState({ subject: '', score: '', maxScore: 100, semester: 1, year: new Date().getFullYear(), examType: 'final', notes: '' })

  useEffect(() => {
    const nextOwnStudent = buildStudentOption(user)
    if (canManage) {
      studentsAPI.getAll({ limit: 100 }).then((r) => setStudents(r.data.data)).catch(() => setStudents([]))
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

  const loadGrades = () => {
    if (!selectedStudent) {
      setGrades([])
      setSummary(null)
      return
    }

    gradesAPI.getByStudent(selectedStudent)
      .then((r) => {
        setGrades(r.data.data)
        setSummary(r.data.summary)
      })
      .catch(() => {
        setGrades([])
        setSummary(null)
      })
  }

  useEffect(loadGrades, [selectedStudent])

  const validateScoreForm = () => {
    const normalizedScore = Number(form.score)
    const normalizedMaxScore = Number(form.maxScore)

    if (!Number.isFinite(normalizedScore)) {
      toast.error('Score must be a valid number.')
      return null
    }

    if (!Number.isFinite(normalizedMaxScore)) {
      toast.error('Max score must be a valid number.')
      return null
    }

    if (normalizedMaxScore <= 0 || normalizedMaxScore > MAX_ALLOWED_SCORE) {
      toast.error(`Max score must be between 1 and ${MAX_ALLOWED_SCORE}.`)
      return null
    }

    if (normalizedScore < 0) {
      toast.error('Score cannot be negative.')
      return null
    }

    if (normalizedScore > normalizedMaxScore) {
      toast.error(`Score cannot exceed max score (${normalizedMaxScore}).`)
      return null
    }

    return {
      score: normalizedScore,
      maxScore: normalizedMaxScore,
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedStudent) return toast.error('Select a student first')
    const validatedScores = validateScoreForm()
    if (!validatedScores) return

    try {
      const payload = {
        ...form,
        ...validatedScores,
      }

      if (editGrade) {
        await gradesAPI.update(editGrade.id, payload)
        toast.success('Grade updated!')
      } else {
        await gradesAPI.add({ ...payload, studentId: selectedStudent })
        toast.success('Grade added!')
      }
      setShowModal(false)
      setEditGrade(null)
      setForm({ subject: '', score: '', maxScore: 100, semester: 1, year: new Date().getFullYear(), examType: 'final', notes: '' })
      loadGrades()
    } catch (err) {
      toast.error(getApiErrorMessage(err, editGrade ? 'Failed to update grade' : 'Failed to add grade'))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this grade?')) return
    try {
      await gradesAPI.delete(id)
      toast.success('Grade deleted')
      loadGrades()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete grade'))
    }
  }

  const subjectAvgs = {}
  grades.forEach((g) => {
    if (!subjectAvgs[g.subject]) subjectAvgs[g.subject] = []
    subjectAvgs[g.subject].push((g.score / g.maxScore) * 100)
  })
  const radarData = Object.entries(subjectAvgs).map(([subject, scores]) => ({
    subject: subject.substring(0, 10),
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }))

  const summaryCategory = summary?.markCategory || getMarkCategory(summary?.average)
  const summaryCategoryColor = getCategoryColor(summaryCategory)

  return (
    <div className="animate-fadeInUp">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Academic Grades</h1>
          <p className="page-subtitle">{canManage ? 'Add exam marks, calculate totals, and manage report cards' : 'Review your marks, totals, averages, and report card'}</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { setEditGrade(null); setShowModal(true) }}>
            <FiPlus size={16} /> Add Grade
          </button>
        )}
      </div>

      {!canManage && !ownStudent && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, color: '#f8fafc' }}>
          Your student profile is not linked yet. Sign out and sign back in once after this update, or ask an admin to verify your account.
        </div>
      )}

      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div className="input-group" style={{ maxWidth: 420 }}>
          <label className="input-label">{canManage ? 'Filter by Student' : 'Student'}</label>
          {canManage ? (
            <select className="input-field" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
              <option value="">- All Students / Select a student -</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user?.name || s.studentCode} ({s.studentCode})
                </option>
              ))}
            </select>
          ) : (
            <input className="input-field" value={ownStudent?.user?.name || ''} readOnly />
          )}
        </div>
      </div>

      <div className="grid grid-2 gap-4" style={{ marginBottom: 24 }}>
        {summary && (
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>Performance Overview</h3>
            <div className="grid grid-3 gap-3">
              <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(16,185,129,0.08)', borderRadius: 12 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#10b981' }}>{summary.totalObtained}/{summary.totalPossible}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Total Marks</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(139,92,246,0.08)', borderRadius: 12 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#8b5cf6' }}>{summary.average}%</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Average Score</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(16,185,129,0.08)', borderRadius: 12 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: summaryCategoryColor }}>{summaryCategory}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Mark Category</div>
              </div>
            </div>
          </div>
        )}

        {radarData.length >= 3 && (
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>Subject Radar</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,40,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <motion.div className="glass-card" style={{ padding: 0, overflow: 'hidden' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Grade Records</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Score</th>
              <th>Grade</th>
              <th>Type</th>
              <th>Semester/Year</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {grades.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5} style={{ textAlign: 'center', color: '#475569', padding: 40 }}>No grades recorded yet.</td>
              </tr>
            ) : grades.map((g) => {
              const pct = (g.score / g.maxScore) * 100
              const progressWidth = Math.max(0, Math.min(pct, 100))
              const markCategory = ['Fail', 'Average', 'Good'].includes(g.grade)
                ? g.grade
                : getMarkCategory(pct)
              const categoryColor = getCategoryColor(markCategory)
              return (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600 }}>{g.subject}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${progressWidth}%`, height: '100%', background: categoryColor, borderRadius: 3 }} />
                      </div>
                      <span style={{ color: categoryColor, fontWeight: 700 }}>{g.score}/{g.maxScore}</span>
                    </div>
                  </td>
                  <td><span style={{ color: categoryColor, fontWeight: 700, fontSize: 15 }}>{markCategory}</span></td>
                  <td style={{ textTransform: 'capitalize' }}><span className="badge badge-active" style={{ fontSize: 11 }}>{g.examType}</span></td>
                  <td style={{ color: '#64748b' }}>S{g.semester} / {g.year}</td>
                  {canManage && (
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditGrade(g); setForm({ subject: g.subject, score: g.score, maxScore: g.maxScore, semester: g.semester, year: g.year, examType: g.examType, notes: g.notes || '' }); setShowModal(true) }}><FiEdit2 size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)}><FiTrash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {showModal && canManage && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="modal-header">
                <h3 className="modal-title">{editGrade ? 'Edit Grade' : 'Add Grade'}</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {!editGrade && (
                  <div className="input-group">
                    <label className="input-label">Student</label>
                    <select className="input-field" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required>
                      <option value="">Select student...</option>
                      {students.map((s) => <option key={s.id} value={s.id}>{s.user?.name || s.studentCode}</option>)}
                    </select>
                  </div>
                )}
                <div className="input-group"><label className="input-label">Subject *</label><input className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics" required /></div>
                <div className="grid grid-2 gap-3">
                  <div className="input-group"><label className="input-label">Score *</label><input className="input-field" type="number" min={0} max={Math.min(Number(form.maxScore) || MAX_ALLOWED_SCORE, MAX_ALLOWED_SCORE)} step="0.01" value={form.score} onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setForm({ ...form, score: '' })
                      return
                    }
                    const numericValue = Number(value)
                    if (!Number.isFinite(numericValue)) return
                    const maxLimit = Math.min(Number(form.maxScore) || MAX_ALLOWED_SCORE, MAX_ALLOWED_SCORE)
                    const clampedScore = Math.min(Math.max(numericValue, 0), maxLimit)
                    setForm({ ...form, score: clampedScore })
                  }} required /></div>
                  <div className="input-group"><label className="input-label">Max Score</label><input className="input-field" type="number" min={1} max={MAX_ALLOWED_SCORE} step="0.01" value={form.maxScore} onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setForm({ ...form, maxScore: '' })
                      return
                    }
                    const numericValue = Number(value)
                    if (!Number.isFinite(numericValue)) return
                    const clampedMax = Math.min(Math.max(numericValue, 1), MAX_ALLOWED_SCORE)
                    setForm((current) => {
                      const currentScoreNumber = Number(current.score)
                      const nextScore = Number.isFinite(currentScoreNumber)
                        ? Math.min(Math.max(currentScoreNumber, 0), clampedMax)
                        : ''
                      return { ...current, maxScore: clampedMax, score: nextScore }
                    })
                  }} /></div>
                </div>
                <div className="grid grid-2 gap-3">
                  <div className="input-group"><label className="input-label">Semester</label>
                    <select className="input-field" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}>
                      {SEMESTER_OPTIONS.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
                    </select>
                  </div>
                  <div className="input-group"><label className="input-label">Year</label><input className="input-field" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
                </div>
                <div className="input-group">
                  <label className="input-label">Exam Type</label>
                  <select className="input-field" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
                    {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="input-group"><label className="input-label">Notes</label><input className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." /></div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editGrade ? 'Update Grade' : 'Add Grade'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
