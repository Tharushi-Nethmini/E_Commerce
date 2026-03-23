'use client'
import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import '@/styles/users.css'

const ROLES = ['CUSTOMER', 'ADMIN', 'SUPPLIER']

const emptyForm = { username: '', email: '', password: '', fullName: '', role: 'CUSTOMER' }

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get(`${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users`)
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingUser(null)
    setFormData(emptyForm)
    setShowModal(true)
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      fullName: user.fullName,
      role: user.role
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        const payload = { ...formData }
        if (!payload.password) delete payload.password
        await api.patch(
          `${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users/${editingUser._id || editingUser.id}`,
          payload
        )
      } else {
        await api.post(`${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users/register`, formData)
      }
      setShowModal(false)
      fetchUsers()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save user')
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users/${userId}`)
      setUsers(prev => prev.filter(u => (u._id || u.id) !== userId))
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user')
    }
  }

  const getRoleBadgeClass = (role) => {
    const map = { ADMIN: 'badge-admin', SUPPLIER: 'badge-supplier', CUSTOMER: 'badge-customer' }
    return `user-role-badge ${map[role] || 'badge-customer'}`
  }

  if (loading) {
    return <div className="users-loading">Loading users...</div>
  }

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = (
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q)
    )
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div>
      <div className="users-header">
        <h1 className="users-title">Users Management</h1>
        <button onClick={openCreate} className="users-add-btn">
          <FaPlus /> Add User
        </button>
      </div>

      <div className="page-search-wrap">
        <input
          type="text"
          className="page-search-input"
          placeholder="Search by username, email, or name…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="page-filter-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id || user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.fullName}</td>
                <td><span className={getRoleBadgeClass(user.role)}>{user.role}</span></td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="user-actions">
                    <button onClick={() => openEdit(user)} className="user-edit-btn" title="Edit">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(user._id || user.id)} className="user-delete-btn" title="Delete">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="users-empty">No users found.</div>
        )}
      </div>

      {showModal && (
        <div className="user-modal-overlay">
          <div className="user-modal">
            <div className="user-modal-header">
              <h2 className="user-modal-title">{editingUser ? 'Edit User' : 'Add User'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="user-modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="user-form-group">
                <label>Full Name</label>
                <input type="text" value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required />
              </div>
              <div className="user-form-group">
                <label>Username</label>
                <input type="text" value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required />
              </div>
              <div className="user-form-group">
                <label>Email</label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required />
              </div>
              <div className="user-form-group">
                <label>{editingUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input type="password" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser} minLength={6} />
              </div>
              <div className="user-form-group">
                <label>Role</label>
                <select value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="user-form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="user-cancel-btn">Cancel</button>
                <button type="submit" className="user-save-btn">{editingUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <ProtectedRoute adminOnly>
      <UsersPage />
    </ProtectedRoute>
  )
}
