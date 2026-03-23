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
  const [exporting, setExporting] = useState(null) // 'pdf' | 'excel' | null
  // Modal state hooks (must be inside component)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState('1');
  const [orderError, setOrderError] = useState('');

  // Ensure selectedProduct is always set when modal is open and products change
  useEffect(() => {
    if (showRequestModal && lowStockProducts.length > 0 && !selectedProduct) {
      setSelectedProduct(lowStockProducts[0]);
    }
  }, [showRequestModal, lowStockProducts, selectedProduct]);

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
      if (format === 'pdf')   await downloadPDF(payload)
      if (format === 'excel') await downloadExcel(payload)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(null)
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
                  <th></th>
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

      {/* Low Stock Products and Modal (moved inside AnalyticsPage for handleRequestClick scope) */}
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
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal order-modal" style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 340, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
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
                      const prod = lowStockProducts.find(p => p._id === e.target.value);
                      setSelectedProduct(prod);
                      setOrderError('');
                    }}
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
                      <option key={product._id} value={product._id} style={{ color: '#222', background: '#fff' }}>{product.name}</option>
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
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      // Only allow positive integers, fallback to '1' if empty or invalid
                      if (!val || isNaN(Number(val)) || Number(val) < 1) {
                        setOrderQuantity('1');
                      } else {
                        setOrderQuantity(val.replace(/^0+/, '') || '1');
                      }
                    }}
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
                    style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 600 }}
                    disabled={!selectedProduct || lowStockProducts.length === 0}
                  >
                    Submit
                  </button>
                  <button onClick={() => setShowRequestModal(false)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 600 }}>Cancel</button>
                </div>
              </>
            )}
            {orderError && <div className="modal-error" style={{ color: '#ef4444', marginTop: 12 }}>{orderError}</div>}
          </div>
        </div>
      )}
      {/* Re-stock Request Button at the bottom */}
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
              setSelectedProduct(lowStockProducts[0]);
              setOrderQuantity('1');
              setOrderError('');
              setShowRequestModal(true);
            } else {
              alert('No low stock products available for re-stock request.');
            }
          }}
        >
          Re-stock Request
        </button>
      </div>
    </div>
  )
}





// Add this function at the top of your component (or before the return statement)
const handleRequestClick = (product) => {
  alert(`Request for product: ${product.PRODUCT_NAME || product.name}`);
};
// ...existing code...

// (removed duplicate AnalyticsPage definition)

async function submitOrderRequest() {
  let qty = 1;
  if (typeof orderQuantity === 'string' && orderQuantity.trim() !== '' && !isNaN(Number(orderQuantity))) {
    qty = Math.max(1, parseInt(orderQuantity, 10));
  }
  if (!qty || isNaN(qty) || qty < 1) {
    setOrderError('Please enter a valid quantity.');
    return;
  }
  if (!selectedProduct) {
    setOrderError('Please select a product.');
    return;
  }
  try {
    // For demo, use 'CASH_ON_DELIVERY' as payment method (or let admin choose in future)
    await api.post(`${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders`, {
      userId: user?._id,
      productId: selectedProduct._id,
      quantity: Number(orderQuantity),
      paymentMethod: 'CASH_ON_DELIVERY'
    });
    setShowRequestModal(false);
    alert('Order request submitted!');
  } catch (err) {
    setOrderError(err?.response?.data?.message || 'Failed to submit order request.');
  }
}


export default function Analytics() {
  return (
    <ProtectedRoute adminOnly>
      <AnalyticsPage />
    </ProtectedRoute>
  );
}
