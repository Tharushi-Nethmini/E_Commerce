
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FaUser, FaEnvelope, FaIdBadge } from 'react-icons/fa';
import '@/styles/profile.css';

export default function SupplierProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || '',
    bankAccountName: user?.bankAccountName || '',
    bankAccountNumber: user?.bankAccountNumber || '',
    bankName: user?.bankName || '',
    bankBranch: user?.bankBranch || '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user && user._id) {
      const fetchProfile = async () => {
        try {
          const res = await api.get(`${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users/${user._id}`);
          if (res.data) {
            updateUser(res.data);
          }
        } catch (err) {
          console.error('Profile fetch error:', err);
        }
      };
      fetchProfile();
    }
  }, [user && user._id]);

  const handleEdit = () => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      username: user?.username || '',
      bankAccountName: user?.bankAccountName || '',
      bankAccountNumber: user?.bankAccountNumber || '',
      bankName: user?.bankName || '',
      bankBranch: user?.bankBranch || '',
      password: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username,
        bankAccountName: formData.bankAccountName,
        bankAccountNumber: formData.bankAccountNumber,
        bankName: formData.bankName,
        bankBranch: formData.bankBranch
      };
      if (formData.password) payload.password = formData.password;
      const response = await api.patch(
        `${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users/${user._id || user.id}`,
        payload
      );
      updateUser(response.data);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
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
            <div className="profile-field">
              <div>
                <p className="profile-field-label">Bank Account Name</p>
                <p className="profile-field-value">{user?.bankAccountName || '-'}</p>
              </div>
            </div>
            <div className="profile-field">
              <div>
                <p className="profile-field-label">Bank Account Number</p>
                <p className="profile-field-value">{user?.bankAccountNumber || '-'}</p>
              </div>
            </div>
            <div className="profile-field">
              <div>
                <p className="profile-field-label">Bank Name</p>
                <p className="profile-field-value">{user?.bankName || '-'}</p>
              </div>
            </div>
            <div className="profile-field">
              <div>
                <p className="profile-field-label">Bank Branch</p>
                <p className="profile-field-value">{user?.bankBranch || '-'}</p>
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
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div className="profile-form-group">
              <label><FaIdBadge /> Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div className="profile-form-group">
              <label><FaEnvelope /> Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="profile-form-group">
              <label>Bank Account Name</label>
              <input
                type="text"
                value={formData.bankAccountName}
                onChange={e => setFormData({ ...formData, bankAccountName: e.target.value })}
              />
            </div>
            <div className="profile-form-group">
              <label>Bank Account Number</label>
              <input
                type="text"
                value={formData.bankAccountNumber}
                onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
              />
            </div>
            <div className="profile-form-group">
              <label>Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={e => setFormData({ ...formData, bankName: e.target.value })}
              />
            </div>
            <div className="profile-form-group">
              <label>Bank Branch</label>
              <input
                type="text"
                value={formData.bankBranch}
                onChange={e => setFormData({ ...formData, bankBranch: e.target.value })}
              />
            </div>
            <div className="profile-form-group">
              <label>New Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div className="profile-form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
            <button type="submit" className="profile-save-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" className="profile-cancel-btn" onClick={handleCancel}>Cancel</button>
          </form>
        )}
      </div>
    </div>
  );
}



