'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import {
  FaShoppingBag, FaCreditCard, FaBox, FaShoppingCart,
  FaArrowRight, FaCheckCircle, FaClock, FaTruck, FaTimesCircle
} from 'react-icons/fa'
import '@/styles/home.css'

const STATUS_META = {
  PENDING:    { label: 'Pending',    icon: FaClock,       color: '#F59E0B', bg: '#FFFBEB' },
  CONFIRMED:  { label: 'Confirmed',  icon: FaCheckCircle, color: '#3B82F6', bg: '#EFF6FF' },
  PROCESSING: { label: 'Processing', icon: FaClock,       color: '#8B5CF6', bg: '#F5F3FF' },
  SHIPPED:    { label: 'Shipped',    icon: FaTruck,       color: '#06B6D4', bg: '#ECFEFF' },
  DELIVERED:  { label: 'Delivered',  icon: FaCheckCircle, color: '#10B981', bg: '#ECFDF5' },
  CANCELLED:  { label: 'Cancelled',  icon: FaTimesCircle, color: '#EF4444', bg: '#FEF2F2' },
  FAILED:     { label: 'Failed',     icon: FaTimesCircle, color: '#6B7280', bg: '#F9FAFB' },
}

function HomePage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const userId = user?._id || user?.id

  useEffect(() => {
    if (!userId) return
    fetchData()
  }, [userId])

  const fetchData = async () => {
    try {
      const [ordersRes] = await Promise.allSettled([
        api.get(`${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders?userId=${userId}`)
      ])
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data)
    } catch {}
    setLoading(false)
  }

  const totalSpent = orders
    .filter(o => ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const activeOrders = orders.filter(o =>
    ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)
  ).length

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.PENDING

  return (
    <div className="home-container">
      {/* Hero Banner */}
      <div className="home-hero">
        <div className="home-hero-content">
          <h1 className="home-hero-title">
            Welcome back, <span>{user?.fullName || user?.username}</span>!
          </h1>
          <p className="home-hero-sub">
            Here's what's happening with your account today.
          </p>
        </div>
        <div className="home-hero-visual">
          <FaShoppingBag className="home-hero-icon" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="home-stats-grid">
        <div className="home-stat-card">
          <div className="home-stat-icon home-stat-icon-orders">
            <FaShoppingBag />
          </div>
          <div className="home-stat-info">
            <span className="home-stat-value">
              {loading ? '—' : orders.length}
            </span>
            <span className="home-stat-label">Total Orders</span>
          </div>
        </div>

        <div className="home-stat-card">
          <div className="home-stat-icon home-stat-icon-active">
            <FaClock />
          </div>
          <div className="home-stat-info">
            <span className="home-stat-value">
              {loading ? '—' : activeOrders}
            </span>
            <span className="home-stat-label">Active Orders</span>
          </div>
        </div>

        <div className="home-stat-card">
          <div className="home-stat-icon home-stat-icon-spent">
            <FaCreditCard />
          </div>
          <div className="home-stat-info">
            <span className="home-stat-value">
              {loading ? '—' : `Rs. ${totalSpent.toFixed(2)}`}
            </span>
            <span className="home-stat-label">Total Spent</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="home-section">
        <h2 className="home-section-title">Quick Actions</h2>
        <div className="home-actions-grid">
          <Link href="/products" className="home-action-card">
            <div className="home-action-icon home-action-icon-products">
              <FaBox />
            </div>
            <div className="home-action-info">
              <span className="home-action-title">Browse Products</span>
              <span className="home-action-desc">Explore our full catalog</span>
            </div>
            <FaArrowRight className="home-action-arrow" />
          </Link>

          <Link href="/cart" className="home-action-card">
            <div className="home-action-icon home-action-icon-cart">
              <FaShoppingCart />
            </div>
            <div className="home-action-info">
              <span className="home-action-title">View Cart</span>
              <span className="home-action-desc">Review and checkout</span>
            </div>
            <FaArrowRight className="home-action-arrow" />
          </Link>

          <Link href="/orders" className="home-action-card">
            <div className="home-action-icon home-action-icon-orders">
              <FaShoppingBag />
            </div>
            <div className="home-action-info">
              <span className="home-action-title">My Orders</span>
              <span className="home-action-desc">Track your orders</span>
            </div>
            <FaArrowRight className="home-action-arrow" />
          </Link>

          <Link href="/payments" className="home-action-card">
            <div className="home-action-icon home-action-icon-payments">
              <FaCreditCard />
            </div>
            <div className="home-action-info">
              <span className="home-action-title">My Payments</span>
              <span className="home-action-desc">View payment history</span>
            </div>
            <FaArrowRight className="home-action-arrow" />
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">Recent Orders</h2>
          <Link href="/orders" className="home-view-all">
            View all <FaArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className="home-loading">Loading orders...</div>
        ) : recentOrders.length === 0 ? (
          <div className="home-empty">
            <FaShoppingBag className="home-empty-icon" />
            <p>No orders yet. Start shopping!</p>
            <Link href="/products" className="home-empty-btn">Browse Products</Link>
          </div>
        ) : (
          <div className="home-orders-list">
            {recentOrders.map(order => {
              const meta = getStatusMeta(order.status)
              const Icon = meta.icon
              return (
                <div key={order._id || order.id} className="home-order-row">
                  <div className="home-order-id">
                    <span className="home-order-hash">#</span>
                    {(order._id || order.id)?.slice(-8)}
                  </div>
                  <div className="home-order-amount">Rs. {order.totalAmount?.toFixed(2) || '0.00'}</div>
                  <div
                    className="home-order-status"
                    style={{ color: meta.color, background: meta.bg }}
                  >
                    <Icon />
                    {meta.label}
                  </div>
                  <div className="home-order-date">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  )
}
