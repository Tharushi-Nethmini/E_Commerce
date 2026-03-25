"use client"
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const { user, token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(() => {
    if (!user || user.role !== 'SUPPLIER') return
    setLoading(true)
    axios.get(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setNotifications(res.data))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }, [user, token])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const removeNotification = async (id) => {
    await axios.delete(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/notifications/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setNotifications(notifications => notifications.filter(n => n._id !== id))
  }

  return (
    <NotificationContext.Provider value={{ notifications, loading, fetchNotifications, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
