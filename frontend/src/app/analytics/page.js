'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { FaShoppingBag, FaUsers, FaDollarSign, FaBoxOpen, FaExclamationTriangle, FaChartBar, FaFilePdf, FaFileExcel, FaSync } from 'react-icons/fa'
import { downloadPDF, downloadExcel } from '@/lib/reportGenerator'
import '@/styles/analytics.css'

function AnalyticsPage() {
  const { user } = useAuth()
  const [orderStats, setOrderStats] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [orderQuantity, setOrderQuantity] = useState('1')
  const [orderError, setOrderError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Ensure selectedProduct is always set when modal is open and products change
  useEffect(() => {
    if (showRequestModal && lowStockProducts.length > 0 && !selectedProduct) {
      setSelectedProduct(lowStockProducts[0])
    }
  }, [showRequestModal, lowStockProducts, selectedProduct])

  useEffect(() => {
    fetchAllStats()
    const interval = setInterval(fetchAllStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAllStats = async () => {
    try {
      const [ordersRes, usersRes, lowStockRes] = await Promise.allSettled([
        api.get(`${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders/stats`),
        api.get(`${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users/stats`),
        api.get(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products/low-stock`)
      ])

      if (ordersRes.status === 'fulfilled') setOrderStats(ordersRes.value.data)
      if (usersRes.status === 'fulfilled') setUserStats(usersRes.value.data)
      if (lowStockRes.status === 'fulfilled') setLowStockProducts(lowStockRes.value.data)
    } catch (err) {
      setError('Failed to load analytics data')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) =>
    'Rs. ' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const payload = { orderStats, userStats, lowStockProducts, generatedAt: new Date() }
      if (format === 'pdf') await downloadPDF(payload)
      if (format === 'excel') await downloadExcel(payload)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  // Submit order request function with proper API integration
  const submitOrderRequest = async () => {
    // Reset error
    setOrderError('')
    
    // Validate quantity
    let qty = parseInt(orderQuantity, 10)
    if (isNaN(qty) || qty < 1) {
      setOrderError('Please enter a valid quantity (minimum 1).')
      return
    }
    
    // Validate product
    if (!selectedProduct) {
      setOrderError('Please select a product.')
      return
    }
    
    // Validate user
    if (!user) {
      setOrderError('You must be logged in to submit a request.')
      return
    }
    
    if (!user._id && !user.id) {
      setOrderError('User ID not found. Please log out and log in again.')
      return
    }
    
    setSubmitting(true)
    
    try {
      // Use the correct user ID field (check if your user object uses _id or id)
      const userId = user._id || user.id
      
      // Prepare the order data based on common order schema
      // Adjust these fields based on your actual order service requirements
      const orderData = {
        userId: userId,
        productId: selectedProduct._id,
        quantity: qty,
        // If your order requires price, add it
        price: selectedProduct.price,
        totalAmount: selectedProduct.price * qty,
        // Payment method
        paymentMethod: 'CASH_ON_DELIVERY',
        // Order type to distinguish restock orders
        orderType: 'RESTOCK',
        // Status
        status: 'PENDING',
        // Additional metadata
        notes: `Restock request for ${selectedProduct.name} - Current stock: ${selectedProduct.quantity}`
      }
      
      console.log('Submitting order request with data:', orderData)
      
      const response = await api.post(
        `${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders`,
        orderData
      )
      
      console.log('Order request successful:', response.data)
      
      // Close modal and show success
      setShowRequestModal(false)
      setOrderQuantity('1')
      setSelectedProduct(null)
      alert('Stock request submitted successfully!')
      
      // Refresh stats to update low stock products
      await fetchAllStats()
      
    } catch (err) {
      console.error('Order request failed:', err)
      
      // Enhanced error handling
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error('Error status:', err.response.status)
        console.error('Error headers:', err.response.headers)
        console.error('Error data:', err.response.data)
        
        // Extract error message from response
        let errorMessage = 'Unknown error'
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error
        } else if (err.response.data?.errors) {
          errorMessage = JSON.stringify(err.response.data.errors)
        }
        
        setOrderError(`Failed to submit: ${errorMessage}`)
        
        // If it's a validation error, show more details
        if (err.response.status === 400) {
          setOrderError(`Validation Error: ${errorMessage}\n\nPlease check if all required fields are provided.`)
        }
      } else if (err.request) {
        // The request was made but no response was received
        setOrderError('No response from server. Please check your connection and if the order service is running.')
        console.error('No response received:', err.request)
      } else {
        // Something happened in setting up the request
        setOrderError(`Error: ${err.message}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const STATUS_COLORS = {
    PENDING: '#F59E0B',
    CONFIRMED: '#3B82F6',
    PROCESSING: '#8B5CF6',
    SHIPPED: '#06B6D4',
    DELIVERED: '#10B981',
    CANCELLED: '#EF4444',
    FAILED: '#6B7280'
  }

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner" />
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-error">
        <FaExclamationTriangle />
        <p>{error}</p>
        <button onClick={fetchAllStats}>Retry</button>
      </div>
    )
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div>
          <h1><FaChartBar /> Analytics Dashboard</h1>
          <p>Real-time overview of your e-commerce platform</p>
        </div>
        <div className="analytics-export-group">
          <button
            className="btn-export btn-export-refresh"
            onClick={fetchAllStats}
            title="Refresh data"
          >
            <FaSync />
          </button>
          <button
            className="btn-export btn-export-excel"
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
          >
            <FaFileExcel />
            {exporting === 'excel' ? 'Generating…' : 'Export Excel'}
          </button>
          <button
            className="btn-export btn-export-pdf"
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
          >
            <FaFilePdf />
            {exporting === 'pdf' ? 'Generating…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Top KPI cards */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card kpi-orders">
          <div className="kpi-icon"><FaShoppingBag /></div>
          <div className="kpi-info">
            <span className="kpi-value">{orderStats?.totalOrders ?? '—'}</span>
            <span className="kpi-label">Total Orders</span>
            <span className="kpi-sub">+{orderStats?.ordersToday ?? 0} today</span>
          </div>
        </div>

        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon"><FaDollarSign /></div>
          <div className="kpi-info">
            <span className="kpi-value">{formatCurrency(orderStats?.totalRevenue)}</span>
            <span className="kpi-label">Total Revenue</span>
            <span className="kpi-sub">Confirmed + Delivered</span>
          </div>
        </div>

        <div className="kpi-card kpi-users">
          <div className="kpi-icon"><FaUsers /></div>
          <div className="kpi-info">
            <span className="kpi-value">{userStats?.totalUsers ?? '—'}</span>
            <span className="kpi-label">Total Users</span>
            <span className="kpi-sub">+{userStats?.newToday ?? 0} new today</span>
          </div>
        </div>

        <div className="kpi-card kpi-lowstock">
          <div className="kpi-icon"><FaExclamationTriangle /></div>
          <div className="kpi-info">
            <span className="kpi-value">{lowStockProducts.length}</span>
            <span className="kpi-label">Low Stock Items</span>
            <span className="kpi-sub">Stock ≤ 10 units</span>
          </div>
        </div>
      </div>

      <div className="analytics-row">
        {/* Orders by Status */}
        <div className="analytics-card">
          <h2><FaShoppingBag /> Orders by Status</h2>
          {orderStats?.byStatus && Object.keys(orderStats.byStatus).length > 0 ? (
            <div className="status-list">
              {Object.entries(orderStats.byStatus).map(([status, count]) => (
                <div key={status} className="status-item">
                  <span
                    className="status-dot"
                    style={{ background: STATUS_COLORS[status] || '#9CA3AF' }}
                  />
                  <span className="status-name">{status}</span>
                  <span className="status-count">{count}</span>
                  <div className="status-bar-wrap">
                    <div
                      className="status-bar"
                      style={{
                        width: `${Math.round((count / (orderStats.totalOrders || 1)) * 100)}%`,
                        background: STATUS_COLORS[status] || '#9CA3AF'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="analytics-empty">No order data yet</p>
          )}
        </div>

        {/* Users by Role */}
        <div className="analytics-card">
          <h2><FaUsers /> Users by Role</h2>
          {userStats?.byRole && Object.keys(userStats.byRole).length > 0 ? (
            <div className="status-list">
              {Object.entries(userStats.byRole).map(([role, count]) => (
                <div key={role} className="role-item">
                  <span className={`role-badge role-${role.toLowerCase()}`}>{role}</span>
                  <span className="status-count">{count}</span>
                  <div className="status-bar-wrap">
                    <div
                      className="status-bar"
                      style={{
                        width: `${Math.round((count / (userStats.totalUsers || 1)) * 100)}%`,
                        background: role === 'ADMIN' ? '#EF4444' : role === 'SUPPLIER' ? '#10B981' : '#3B82F6'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="analytics-empty">No user data yet</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      {orderStats?.recentOrders?.length > 0 && (
        <div className="analytics-card analytics-full">
          <h2><FaShoppingBag /> Recent Orders</h2>
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>User ID</th>
                  <th>Product ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orderStats.recentOrders.map(order => (
                  <tr key={order._id}>
                    <td className="order-id">{order._id?.slice(-8)}</td>
                    <td>{order.userId?.slice(-8)}</td>
                    <td>{order.productId?.slice(-8)}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: STATUS_COLORS[order.status] || '#9CA3AF' }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <div className="analytics-card analytics-full analytics-danger">
          <h2><FaExclamationTriangle /> Low Stock Products</h2>
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Reserved</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(product => (
                  <tr key={product._id} className={product.quantity === 0 ? 'row-critical' : 'row-warning'}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.category}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{product.quantity}</td>
                    <td>{product.reservedQuantity}</td>
                    <td>
                      <span className={`stock-badge ${product.quantity === 0 ? 'stock-out' : 'stock-low'}`}>
                        {product.quantity - product.reservedQuantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowRequestModal(false)}>
          <div className="modal order-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 340, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginBottom: 16 }}>Request Stock</h3>
            {lowStockProducts.length === 0 ? (
              <div style={{ marginBottom: 16, color: '#ef4444' }}>No low stock products available for request.</div>
            ) : (
              <>
                <label style={{ display: 'block', marginBottom: 16 }}>
                  Product:
                  <select
                    value={selectedProduct ? selectedProduct._id : ''}
                    onChange={e => {
                      const prod = lowStockProducts.find(p => p._id === e.target.value)
                      setSelectedProduct(prod)
                      setOrderError('')
                    }}
                    disabled={submitting}
                    style={{
                      marginLeft: 8,
                      padding: '8px 12px',
                      width: 200,
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 16,
                      background: '#f9fafb',
                      color: '#222',
                      outline: 'none',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                    }}
                  >
                    <option value='' disabled style={{ color: '#888' }}>Select product</option>
                    {lowStockProducts.map(product => (
                      <option key={product._id} value={product._id} style={{ color: '#222', background: '#fff' }}>
                        {product.name} (Current Stock: {product.quantity})
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'block', marginBottom: 16 }}>
                  Quantity:
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={orderQuantity}
                    onChange={e => {
                      let val = e.target.value.replace(/[^0-9]/g, '')
                      if (!val || isNaN(Number(val)) || Number(val) < 1) {
                        setOrderQuantity('1')
                      } else {
                        setOrderQuantity(val.replace(/^0+/, '') || '1')
                      }
                    }}
                    disabled={submitting}
                    style={{
                      marginLeft: 8,
                      padding: '8px 12px',
                      width: 120,
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 16,
                      background: '#f9fafb',
                      color: '#222',
                      outline: 'none',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                    }}
                  />
                </label>
                <div className="modal-actions" style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={submitOrderRequest}
                    disabled={!selectedProduct || lowStockProducts.length === 0 || submitting}
                    style={{ 
                      background: '#10b981', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 4, 
                      padding: '6px 18px', 
                      fontWeight: 600, 
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.6 : 1
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                  <button 
                    onClick={() => setShowRequestModal(false)} 
                    disabled={submitting}
                    style={{ 
                      background: '#ef4444', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 4, 
                      padding: '6px 18px', 
                      fontWeight: 600, 
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            {orderError && (
              <div className="modal-error" style={{ color: '#ef4444', marginTop: 12, whiteSpace: 'pre-wrap' }}>
                {orderError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Re-stock Request Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
        <button
          className="restock-request-btn"
          style={{
            background: '#f59e0b',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '12px 25px',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
          onClick={() => {
            if (lowStockProducts.length > 0) {
              setSelectedProduct(lowStockProducts[0])
              setOrderQuantity('1')
              setOrderError('')
              setShowRequestModal(true)
            } else {
              alert('No low stock products available for re-stock request.')
            }
          }}
        >
          Re-stock Request
        </button>
      </div>
    </div>
  )
}

// Export with ProtectedRoute wrapper
export default function Analytics() {
  return (
    <ProtectedRoute>
      <AnalyticsPage />
    </ProtectedRoute>
  )
}