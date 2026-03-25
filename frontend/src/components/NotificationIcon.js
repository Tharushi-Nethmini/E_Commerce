"use client"
import { FaBell } from 'react-icons/fa'
import { useState } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/context/NotificationContext'

export default function NotificationIcon() {
  const { notifications } = useNotifications()
  const [showDropdown, setShowDropdown] = useState(false)

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
