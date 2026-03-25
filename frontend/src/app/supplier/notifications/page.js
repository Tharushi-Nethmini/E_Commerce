"use client"
import '@/styles/supplier-notifications.css'
import { useNotifications } from '@/context/NotificationContext'

export default function SupplierNotificationsPage() {
  const { notifications, loading, removeNotification } = useNotifications()

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this notification?')) return
    try {
      await removeNotification(id)
    } catch {
      alert('Failed to remove notification')
    }
  }

  return (
    <div className="supplier-notifications-page">
      <h1>All Notifications</h1>
      {loading ? (
        <div>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div>No notifications found.</div>
      ) : (
        <ul className="notification-list">
          {notifications.map(n => (
            <li key={n._id} className={`notification-item${n.read ? '' : ' unread'}`}>
              <div className="notification-title">{n.title}</div>
              <div className="notification-message">{n.message}</div>
              <div className="notification-date">{new Date(n.createdAt).toLocaleString()}</div>
              <button className="notification-remove-btn" onClick={() => handleRemove(n._id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
