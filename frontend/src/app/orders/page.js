'use client'
import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { FaPlus } from 'react-icons/fa'
import '@/styles/orders.css'

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED']

function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [savedMethods, setSavedMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [orderData, setOrderData] = useState({
    productId: '',
    quantity: 1,
    paymentMethod: 'CREDIT_CARD'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchOrders()
    if (!isAdmin) {
      fetchProducts()
      fetchPaymentMethods()
    }
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [isAdmin])

  const fetchOrders = async () => {
    try {
      const url = isAdmin
        ? `${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders`
        : `${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders?userId=${user?._id || user?.id}`
      const response = await api.get(url)
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await api.get(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products`)
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const currentUserId = user?._id || user?.id
      if (!currentUserId) return

      const response = await api.get(
        `${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/methods/${currentUserId}`
      )

      const methods = response.data || []
      setSavedMethods(methods)

      const defaultMethod = methods.find((method) => method.isDefault)
      if (defaultMethod?.type) {
        setOrderData((prev) => ({ ...prev, paymentMethod: defaultMethod.type }))
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      setSavedMethods([])
    }
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    try {
      await api.post(`${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders`, {
        userId: user._id || user.id,
        ...orderData
      })
      setShowModal(false)
      setOrderData({ productId: '', quantity: 1, paymentMethod: 'CREDIT_CARD' })
      fetchOrders()
    } catch (error) {
      console.error('Error creating order:', error)
      alert(error.response?.data?.message || 'Failed to create order')
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingStatus(orderId)
    try {
      await api.patch(`${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders/${orderId}/status`, {
        status: newStatus
      })
      fetchOrders()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update order status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    try {
      await api.post(`${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders/${orderId}/cancel`)
      fetchOrders()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order')
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!confirm('Are you sure you want to permanently delete this order?')) return
    try {
      await api.delete(`${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders/${orderId}`)
      setOrders(prev => prev.filter(o => (o._id || o.id) !== orderId))
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete order')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'status-pending',
      CONFIRMED: 'status-confirmed',
      PROCESSING: 'status-processing',
      SHIPPED: 'status-shipped',
      DELIVERED: 'status-delivered',
      CANCELLED: 'status-cancelled',
      FAILED: 'status-failed'
    }
    return colors[status] || 'status-pending'
  }

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId)
    return product ? product.name : productId
  }

  if (loading) {
    return <div className="orders-loading">Loading orders...</div>
  }

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = (
      (o._id || o.id)?.toString().toLowerCase().includes(q) ||
      o.userId?.toString().toLowerCase().includes(q) ||
      o.productId?.toString().toLowerCase().includes(q)
    )
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <div className="orders-header">
        <h1 className="orders-title">{isAdmin ? 'All Orders' : 'My Orders'}</h1>
        {!isAdmin && (
          <button onClick={() => setShowModal(true)} className="orders-create-btn">
            <FaPlus /> Create Order
          </button>
        )}
      </div>

      <div className="page-search-wrap">
        <input
          type="text"
          className="page-search-input"
          placeholder="Search by order ID, user ID, or product ID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="page-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="orders-list">
        {filteredOrders.map((order) => (
          <div key={order._id || order.id} className="order-card">
            <div className="order-header">
              <div className="order-header-info">
                <div className="order-title-row">
                  <h3 className="order-id">Order #{order._id || order.id}</h3>
                  <span className={`order-status-badge ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-details-grid">
                  {isAdmin && (
                    <p className="order-detail-item"><span className="order-detail-label">User ID:</span> {order.userId}</p>
                  )}
                  <p className="order-detail-item">
                    <span className="order-detail-label">Product:</span>{' '}
                    {isAdmin ? order.productId : getProductName(order.productId) || order.productId}
                  </p>
                  <p className="order-detail-item"><span className="order-detail-label">Quantity:</span> {order.quantity}</p>
                  <p className="order-detail-item"><span className="order-detail-label">Total Amount:</span> <strong>Rs. {order.totalAmount?.toFixed(2) || '0.00'}</strong></p>
                  <p className="order-detail-item"><span className="order-detail-label">Payment:</span> {order.paymentMethod}</p>
                  <p className="order-detail-item"><span className="order-detail-label">Created:</span> {new Date(order.createdAt).toLocaleString()}</p>
                  {order.updatedAt && (
                    <p className="order-detail-item"><span className="order-detail-label">Updated:</span> {new Date(order.updatedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Admin: update status controls + delete */}
            {isAdmin && (
              <div className="order-admin-actions">
                <label className="order-detail-label">Update Status:</label>
                <div className="order-status-controls">
                  <select
                    defaultValue={order.status}
                    onChange={(e) => handleUpdateStatus(order._id || order.id, e.target.value)}
                    disabled={updatingStatus === (order._id || order.id)}
                    className="order-status-select"
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {updatingStatus === (order._id || order.id) && <span className="order-updating">Updating...</span>}
                </div>
                <button
                  onClick={() => handleDeleteOrder(order._id || order.id)}
                  className="order-delete-btn"
                >
                  Delete
                </button>
              </div>
            )}

            {/* User: cancel button for cancellable orders */}
            {!isAdmin && ['PENDING', 'CONFIRMED'].includes(order.status) && (
              <div className="order-user-actions">
                <button
                  onClick={() => handleCancelOrder(order._id || order.id)}
                  className="order-cancel-btn"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        ))}

        {orders.length === 0 && (
          <div className="orders-empty">
            {isAdmin ? 'No orders found.' : 'No orders found. Create your first order!'}
          </div>
        )}
      </div>

      {/* Create Order Modal - USER only */}
      {!isAdmin && showModal && (
        <div className="order-modal-overlay">
          <div className="order-modal">
            <div className="order-modal-header">
              <h2 className="order-modal-title">Create Order</h2>
              <button type="button" onClick={() => setShowModal(false)} className="order-modal-close">×</button>
            </div>
            <form onSubmit={handleCreateOrder} className="order-form">
              <div className="order-form-group">
                <label>Product</label>
                <select
                  value={orderData.productId}
                  onChange={(e) => setOrderData({ ...orderData, productId: e.target.value })}
                  required
                >
                  <option value="">Select a product</option>
                  {products.filter(p => p.quantity > 0).map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Rs. {Number(product.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Stock: {product.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="order-form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={orderData.quantity}
                  onChange={(e) => setOrderData({ ...orderData, quantity: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="order-form-group">
                <label>Payment Method</label>
                <select
                  value={orderData.paymentMethod}
                  onChange={(e) => setOrderData({ ...orderData, paymentMethod: e.target.value })}
                >
                  {savedMethods.length > 0 ? (
                    savedMethods.map((method) => (
                      <option key={method._id || method.id} value={method.type}>
                        {`${method.type.replace(/_/g, ' ')}${method.brand ? ` - ${method.brand}` : ''}${method.last4 ? ` (**** ${method.last4})` : ''}${method.isDefault ? ' [Default]' : ''}`}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="DEBIT_CARD">Debit Card</option>
                      <option value="PAYPAL">PayPal</option>
                      <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                    </>
                  )}
                </select>
              </div>
              <div className="order-modal-actions">
                <button type="submit" className="order-modal-submit">Create Order</button>
                <button type="button" onClick={() => setShowModal(false)} className="order-modal-cancel">Cancel</button>
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
    <ProtectedRoute>
      <OrdersPage />
    </ProtectedRoute>
  )
}
