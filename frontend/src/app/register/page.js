'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import '@/styles/register.css'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'CUSTOMER',
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
    bankBranch: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { register, user } = useAuth()

  useEffect(() => {
    if (user) {
      router.push(user.role === 'ADMIN' ? '/analytics' : '/home')
    }
  }, [user, router])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const { confirmPassword, ...registrationData } = formData
    // Only include bank details if role is SUPPLIER
    if (formData.role !== 'SUPPLIER') {
      delete registrationData.bankAccountName;
      delete registrationData.bankAccountNumber;
      delete registrationData.bankName;
      delete registrationData.bankBranch;
    }
    const result = await register(registrationData)
    
    if (!result.success) {
      setError(result.error)
      setLoading(false)
    }
    // On success, useEffect handles redirect
  }

  return (
    <div className="register-container">
      <div className="register-brand">
        <div className="register-brand-logo">N</div>
        <h2 className="register-brand-name">NexMart</h2>
        <p className="register-brand-tagline">Create your account today</p>
      </div>
      <div className="register-card">
        <h1 className="register-title">Create Account</h1>
        <p className="register-subtitle">Join NexMart and start shopping</p>

        {error && (
          <div className="register-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Your full name"
              required
              disabled={loading}
            />
          </div>

          <div className="register-form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="register-form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="register-form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="register-form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="register-form-group">
            <label>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="CUSTOMER">Customer</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
          </div>

          {/* Show bank details fields only if role is SUPPLIER */}
          {formData.role === 'SUPPLIER' && (
            <>
              <div className="register-form-group">
                <label>Bank Account Name</label>
                <input
                  type="text"
                  name="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={handleChange}
                  placeholder="Bank account name"
                  required
                  disabled={loading}
                />
              </div>
              <div className="register-form-group">
                <label>Bank Account Number</label>
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                  placeholder="Bank account number"
                  required
                  disabled={loading}
                />
              </div>
              <div className="register-form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="Bank name"
                  required
                  disabled={loading}
                />
              </div>
              <div className="register-form-group">
                <label>Bank Branch</label>
                <input
                  type="text"
                  name="bankBranch"
                  value={formData.bankBranch}
                  onChange={handleChange}
                  placeholder="Bank branch"
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}
          <button
            type="submit"
            className="register-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="register-footer">
          Already have an account?{' '}
          <Link href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
