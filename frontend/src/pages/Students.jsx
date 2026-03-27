import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { getApiErrorMessage, studentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiX, FiRefreshCw, FiUpload, FiUser } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const DEPARTMENTS = ['Computer Science', 'Mathematics', 'Physics', 'Electrical Engineering', 'Chemistry', 'Biology', 'Business', 'Arts']
const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6]
const GENDER_OPTIONS = ['Male', 'Female', 'Other']

export default function Students() {
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'teacher'
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editStudent, setEditStudent] = useState(null)
  
  const defaultForm = () => {
    const savedDept = localStorage.getItem('lastAddedDepartment') || 'Computer Science';
    const savedYear = parseInt(localStorage.getItem('lastAddedYear') || '1', 10);
    return { name: '', email: '', password: '', studentCode: '', department: savedDept, year: savedYear, semester: 1, phone: '', address: '', gender: 'Male', dateOfBirth: '', avatar: '' };
  };
  const [form, setForm] = useState(defaultForm())
  const [errors, setErrors] = useState({})
  const fileInputRef = useRef(null)

  const load = async () => {
    try {
      const res = await studentsAPI.getAll({ search, limit: 50 })
      setStudents(res.data.data)
    } catch { setStudents([]) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search])

  const resetForm = () => { setForm(defaultForm()); setEditStudent(null); setErrors({}); }

  const openAdd = () => { resetForm(); setShowModal(true) }
  const openEdit = (s) => {
    setForm({ name: s.user?.name || '', email: s.user?.email || '', password: '', studentCode: s.studentCode || '', department: s.department || 'Computer Science', year: s.year || 1, semester: s.semester || 1, phone: s.phone || '', address: s.address || '', gender: s.gender || 'Male', dateOfBirth: s.dateOfBirth || '', avatar: s.user?.avatar || '' })
    setEditStudent(s)
    setErrors({})
    setShowModal(true)
  }

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.name.trim()) newErrors.name = 'Name is required';
    if (!data.email.trim() || !/^\S+@\S+\.\S+$/.test(data.email)) newErrors.email = 'Valid email is required';
    if (!editStudent && (data.password && data.password.length > 0 && data.password.length < 6)) newErrors.password = 'Password must be at least 6 characters';
    if (!data.studentCode.trim()) newErrors.studentCode = 'Student ID is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleEmailChange = (email) => {
    let dept = form.department;
    if (email.includes('@cs.') || email.includes('computer')) dept = 'Computer Science';
    else if (email.includes('@math.')) dept = 'Mathematics';
    else if (email.includes('@phys.')) dept = 'Physics';
    else if (email.includes('@ee.')) dept = 'Electrical Engineering';
    else if (email.includes('@bio.')) dept = 'Biology';
    else if (email.includes('@biz.')) dept = 'Business';
    else if (email.includes('@arts.')) dept = 'Arts';
    setForm(prev => ({ ...prev, email, department: dept }));
  }

  const autoGenerateId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    setForm(prev => ({ ...prev, studentCode: `STU-${year}-${random}` }));
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { toast.error('Image must be less than 2MB'); return; }
      const reader = new FileReader();
      reader.onloadend = () => setForm(prev => ({ ...prev, avatar: reader.result }));
      reader.readAsDataURL(file);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm(form)) return;
    try {
      localStorage.setItem('lastAddedDepartment', form.department);
      localStorage.setItem('lastAddedYear', form.year.toString());

      if (editStudent) {
        await studentsAPI.update(editStudent.id, form)
        toast.success('Student updated successfully!')
      } else {
        await studentsAPI.create(form)
        toast.success('Student created successfully!')
      }
      setShowModal(false); resetForm(); load()
    } catch (err) { toast.error(getApiErrorMessage(err, editStudent ? 'Failed to update student' : 'Failed to create student')) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this student?')) return
    try { await studentsAPI.delete(id); toast.success('Student deactivated'); load() }
    catch (err) { toast.error(getApiErrorMessage(err, 'Failed to deactivate student')) }
  }

  const getRiskColor = (gpa) => {
    if (gpa >= 3.5) return '#10b981'
    if (gpa >= 2.5) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="animate-fadeInUp">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{canManage ? 'Add, edit, and manage all enrolled student records' : 'View student directory and academic details'}</p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Student</button>}
      </div>

      {/* Search */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={16} />
          <input className="input-field" style={{ paddingLeft: 42 }} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <motion.div className="glass-card" style={{ padding: 0, overflow: 'hidden' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {loading ? <div className="loader"><div className="spinner" /></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>GPA</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>{canManage ? 'No students found. Add your first student to get started.' : 'No students found.'}</td></tr>
                ) : students.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {s.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{s.user?.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{s.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#a78bfa', fontWeight: 600 }}>{s.studentCode}</td>
                    <td>{s.phone || '-'}</td>
                    <td>{s.department}</td>
                    <td>Year {s.year}</td>
                    <td><span style={{ fontWeight: 700, color: getRiskColor(s.gpa) }}>{parseFloat(s.gpa || 0).toFixed(2)}</span></td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/students/${s.id}`} className="btn btn-secondary btn-sm" title="View"><FiEye size={14} /></Link>
                        {canManage && <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)} title="Edit"><FiEdit2 size={14} /></button>}
                        {canManage && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)} title="Delete"><FiTrash2 size={14} /></button>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && canManage && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="modal-header">
                <h3 className="modal-title">{editStudent ? 'Edit Student' : 'Add New Student'}</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
                
                {/* Photo Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #cbd5e1', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                    {form.avatar ? <img src={form.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FiUser size={32} color="#94a3b8" />}
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                    <FiUpload size={14} style={{ marginRight: 6 }} /> Upload Photo
                  </button>
                  <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                </div>

                <div className="grid grid-2 gap-3">
                  <div className="input-group">
                    <label className="input-label">Full Name *</label>
                    <input className="input-field" value={form.name} onChange={e => { setForm({...form, name: e.target.value}); setErrors({...errors, name: ''}) }} placeholder="John Smith" />
                    {errors.name && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.name}</span>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email *</label>
                    <input className="input-field" type="email" value={form.email} onChange={e => { handleEmailChange(e.target.value); setErrors({...errors, email: ''}) }} placeholder="john@school.com" />
                    {errors.email && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.email}</span>}
                  </div>
                </div>

                {!editStudent && (
                  <div className="input-group">
                    <label className="input-label">Password (default: Student@123)</label>
                    <input className="input-field" type="password" value={form.password} onChange={e => { setForm({...form, password: e.target.value}); setErrors({...errors, password: ''}) }} placeholder="Leave blank for default" />
                    {errors.password && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.password}</span>}
                  </div>
                )}

                <div className="grid grid-2 gap-3">
                  <div className="input-group">
                    <label className="input-label">Student ID *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input-field" value={form.studentCode} onChange={e => { setForm({...form, studentCode: e.target.value}); setErrors({...errors, studentCode: ''}) }} placeholder="STU-2024-001" />
                      <button type="button" className="btn btn-secondary" onClick={autoGenerateId} title="Auto Generate"><FiRefreshCw size={16} /></button>
                    </div>
                    {errors.studentCode && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.studentCode}</span>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Department *</label>
                    <select className="input-field" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-2 gap-3">
                  <div className="input-group">
                    <label className="input-label">Gender</label>
                    <select className="input-field" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      {GENDER_OPTIONS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Date of Birth</label>
                    <input type="date" className="input-field" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-2 gap-3">
                  <div className="input-group"><label className="input-label">Year</label><input className="input-field" type="number" min={1} max={6} value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value) || 1})} /></div>
                  <div className="input-group"><label className="input-label">Semester</label>
                    <select className="input-field" value={form.semester} onChange={e => setForm({...form, semester: Number(e.target.value)})}>
                      {SEMESTER_OPTIONS.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
                    </select>
                  </div>
                </div>

                <div className="input-group"><label className="input-label">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 234 567 8900" /></div>
                <div className="input-group"><label className="input-label">Address</label><textarea className="input-field" style={{ minHeight: 60 }} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="123 Main St, City"></textarea></div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, position: 'sticky', bottom: 0, background: 'var(--card-bg)', padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editStudent ? 'Update Student' : 'Create Student'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
