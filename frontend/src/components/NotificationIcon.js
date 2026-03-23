import { FaBell } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'

export default function NotificationIcon() {
  const { user, token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'SUPPLIER') return
    const url = `${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/notifications`;
    axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setNotifications(res.data))
      .catch(() => setNotifications([]))
  }, [user, token])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="notification-icon-wrapper">
      <button className="notification-btn" onClick={() => setShowDropdown(v => !v)}>
        <FaBell />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>
      {showDropdown && (
        <div className="notification-dropdown">
          {notifications.length === 0 ? (
            <div className="notification-empty">No notifications</div>
          ) : (
            notifications.slice(0, 5).map(n => (
              <div key={n._id} className={`notification-item${n.read ? '' : ' unread'}`}>
                <div className="notification-title">{n.title}</div>
                <div className="notification-message">{n.message}</div>
                <div className="notification-date">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
          <Link href="/supplier/notifications" className="notification-view-all">View all</Link>
        </div>
      )}
    </div>
  )
}
