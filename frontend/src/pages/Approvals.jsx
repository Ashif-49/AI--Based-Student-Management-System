import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiClock, FiRefreshCw, FiUserCheck, FiXCircle } from 'react-icons/fi'
import { adminApprovalAPI, getApiErrorMessage } from '../services/api'
import './Approvals.css'

export default function Approvals() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)

  const loadRequests = async (showToast = false) => {
    try {
      const response = await adminApprovalAPI.getPending()
      setRequests(response.data?.data || [])
      if (showToast) toast.success('Approval list refreshed.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load approval requests.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const approveRequest = async (userId) => {
    setApprovingId(userId)
    try {
      const response = await adminApprovalAPI.approve(userId)
      setRequests((current) => current.filter((item) => item.id !== userId))
      toast.success(response.data?.message || 'User approved successfully.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Approval failed.'))
    } finally {
      setApprovingId(null)
    }
  }

  const rejectRequest = async (request) => {
    const confirmed = window.confirm(
      `Reject ${request.name}'s registration request?\n\nThey will not be able to log in unless an admin approves them later.`
    )
    if (!confirmed) return

    setRejectingId(request.id)
    try {
      const response = await adminApprovalAPI.reject(request.id)
      setRequests((current) => current.filter((item) => item.id !== request.id))
      toast.success(response.data?.message || 'Registration rejected.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Rejection failed.'))
    } finally {
      setRejectingId(null)
    }
  }

  return (
    <div className="approvals-page animate-fadeInUp">
      <div className="page-header">
        <h1 className="page-title">User Approvals</h1>
        <p className="page-subtitle">Approve or reject newly registered student and teacher accounts.</p>
      </div>

      <motion.div className="glass-card approvals-panel" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="approvals-panel-header">
          <div className="approvals-title-wrap">
            <div className="approvals-icon">
              <FiUserCheck size={18} />
            </div>
            <div>
              <h3>Pending Registrations</h3>
              <p>Any admin can approve or reject. Approved users can log in immediately.</p>
            </div>
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={() => loadRequests(true)} disabled={loading}>
            <FiRefreshCw size={14} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="loader" style={{ padding: '30px 12px' }}>
            <div className="spinner" />
          </div>
        ) : requests.length === 0 ? (
          <div className="approvals-empty">
            <FiCheckCircle size={16} />
            No pending approvals right now.
          </div>
        ) : (
          <div className="approvals-list">
            {requests.map((request) => (
              <div key={request.id} className="approvals-item">
                <div className="approvals-item-meta">
                  <strong>{request.name}</strong>
                  <span>{request.email}</span>
                  <span className="approvals-extra">
                    <FiClock size={12} />
                    <span>{request.role} - requested {new Date(request.createdAt).toLocaleString()}</span>
                  </span>
                </div>
                <div className="approvals-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => approveRequest(request.id)}
                    disabled={approvingId === request.id || rejectingId === request.id}
                  >
                    {approvingId === request.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => rejectRequest(request)}
                    disabled={approvingId === request.id || rejectingId === request.id}
                  >
                    <FiXCircle size={14} />
                    {rejectingId === request.id ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
