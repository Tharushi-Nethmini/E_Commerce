'use client'
import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { FaUser, FaEnvelope, FaIdBadge, FaLock } from 'react-icons/fa'
import '@/styles/profile.css'

function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || '',
    password: '',
    confirmPassword: ''
  })

  const handleEdit = () => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      username: user?.username || '',
      password: '',
      confirmPassword: ''
    })
    setError('')
    setSuccess('')
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username
      }
      if (formData.password) payload.password = formData.password

      const response = await api.patch(
        `${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users/${user._id || user.id}`,
        payload
      )
      updateUser(response.data)
      setSuccess('Profile updated successfully!')
      setEditing(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">
          <span>{user?.fullName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase()}</span>
        </div>

        <div className="profile-header">
          <h1 className="profile-name">{user?.fullName}</h1>
          <span className={`profile-role-badge ${user?.role?.toLowerCase()}`}>{user?.role}</span>
        </div>

        {success && <div className="profile-success">{success}</div>}
        {error && <div className="profile-error">{error}</div>}

        {!editing ? (
          <div className="profile-details">
            <div className="profile-field">
              <FaUser className="profile-field-icon" />
              <div>
                <p className="profile-field-label">Username</p>
                <p className="profile-field-value">{user?.username}</p>
              </div>
            </div>
            <div className="profile-field">
              <FaIdBadge className="profile-field-icon" />
              <div>
                <p className="profile-field-label">Full Name</p>
                <p className="profile-field-value">{user?.fullName}</p>
              </div>
            </div>
            <div className="profile-field">
              <FaEnvelope className="profile-field-icon" />
              <div>
                <p className="profile-field-label">Email</p>
                <p className="profile-field-value">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleEdit} className="profile-edit-btn">Edit Profile</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-form-group">
              <label><FaUser /> Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div className="profile-form-group">
              <label><FaIdBadge /> Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div className="profile-form-group">
              <label><FaEnvelope /> Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="profile-form-group">
              <label><FaLock /> New Password <span className="profile-optional">(leave blank to keep current)</span></label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
              />
            </div>
            {formData.password && (
              <div className="profile-form-group">
                <label><FaLock /> Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="profile-form-actions">
              <button type="button" onClick={handleCancel} className="profile-cancel-btn">Cancel</button>
              <button type="submit" className="profile-save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  )
}
