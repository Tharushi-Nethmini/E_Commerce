'use client'
import { useState, useEffect, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import '@/styles/payments.css'

import { FaMoneyCheckAlt } from 'react-icons/fa';
import { FaTrash } from 'react-icons/fa';
import PaySupplierModal from '@/components/PaySupplierModal';


function PaymentsPage() {
      // Handler for deleting a customer payment
      const handleDeletePayment = async (paymentId) => {
        console.log('Attempting to delete payment with ID:', paymentId);
        if (!confirm('Are you sure you want to delete this payment?')) return;
        try {
          await api.delete(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/${paymentId}`);
          setPayments(prev => prev.filter(p => (p._id || p.id) !== paymentId));
          // Optionally show a success message here
        } catch (err) {
          console.error('Delete payment error:', err);
          alert('Failed to delete payment.');
        }
      };
    // Handler for deleting a restock request
    const handleDeleteRestock = async (restockId) => {
      if (!confirm('Are you sure you want to delete this restock request?')) return;
      try {
        await api.delete(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/restock-requests/${restockId}`);
        setRestockPayments(prev => prev.filter(r => r._id !== restockId));
        // Optionally show a success message here
      } catch (err) {
        console.error('Delete restock error:', err);
        alert('Failed to delete restock request.');
      }
    };
  const [restockPayments, setRestockPayments] = useState([]);
  const [payingRestockId, setPayingRestockId] = useState(null);
  const [paySupplierModalOpen, setPaySupplierModalOpen] = useState(false);
  const [selectedRestock, setSelectedRestock] = useState(null);
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refunding, setRefunding] = useState(null)
  const [invoicing, setInvoicing] = useState(null)
  const [invoiceByPaymentId, setInvoiceByPaymentId] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [methods, setMethods] = useState([])
  const [methodsLoading, setMethodsLoading] = useState(true)
  const [savingMethod, setSavingMethod] = useState(false)
  const [updatingMethodId, setUpdatingMethodId] = useState(null)
  const [deletingMethodId, setDeletingMethodId] = useState(null)
  const [methodForm, setMethodForm] = useState({
    type: 'CREDIT_CARD',
    brand: '',
    last4: '',
    expiryMonth: '',
    expiryYear: '',
    isDefault: false
  })

  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const userId = user?._id || user?.id

  const buildHistoryParams = useCallback(() => {
    const params = new URLSearchParams()

    if (!isAdmin && userId) {
      params.append('userId', userId)
    }

    if (statusFilter !== 'ALL') {
      params.append('status', statusFilter)
    }

    if (startDate) {
      params.append('startDate', startDate)
    }

    if (endDate) {
      params.append('endDate', endDate)
    }

    params.append('page', '1')
    params.append('limit', '100')

    return params.toString()
  }, [isAdmin, userId, statusFilter, startDate, endDate])

  const fetchPayments = useCallback(async () => {
    try {
      const queryString = buildHistoryParams()
      const response = await api.get(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/history?${queryString}`)
      let historyPayments = response.data?.data || []

      if (!isAdmin && historyPayments.length === 0 && userId) {
        const ordersResponse = await api.get(
          `${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders?userId=${userId}`
        )

        const orders = ordersResponse.data || []

        if (orders.length > 0) {
          const paymentResults = await Promise.allSettled(
            orders.map((order) =>
              api.get(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/order/${order._id || order.id}`)
            )
          )

          historyPayments = paymentResults
            .filter((result) => result.status === 'fulfilled')
            .map((result) => result.value.data)
            .filter((payment) => payment && (payment._id || payment.id))
        }
      }

      setPayments(historyPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }, [buildHistoryParams, isAdmin, userId])

  const fetchPaymentMethods = useCallback(async () => {
    if (!userId) {
      setMethods([])
      setMethodsLoading(false)
      return
    }

    try {
      const response = await api.get(
        `${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/methods/${userId}`
      )
      setMethods(response.data || [])
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      setMethods([])
    } finally {
      setMethodsLoading(false)
    }
  }, [userId])

  // Fetch supplier payments (fulfilled restock requests)
  // Fetch both FULFILLED and PAID restock requests for supplier payments
  const fetchSupplierPayments = useCallback(() => {
    if (isAdmin) {
      // Fetch both statuses in parallel and merge
      Promise.all([
        api.get(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/restock-requests/fulfilled`).then(res => res.data || []).catch(() => []),
        api.get(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/restock-requests/paid`).then(res => res.data || []).catch(() => [])
      ]).then(([fulfilled, paid]) => {
        // Combine and sort by createdAt descending
        const all = [...fulfilled, ...paid].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRestockPayments(all);
      }).catch(() => setRestockPayments([]));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!user) {
      setLoading(false)
      setMethodsLoading(false)
      return
    }
    fetchPayments()
    fetchPaymentMethods()
    fetchSupplierPayments();
  }, [user, fetchPayments, fetchPaymentMethods, fetchSupplierPayments]);
  // Handler for admin to open pay supplier modal

  // Fetch supplier bank details and open modal
  const handlePayRestock = async (restock) => {
    let supplierId = restock.productId?.supplier || restock.supplierId;
    let supplierBank = {};
    if (!supplierId) {
      console.error('No supplierId found for restock:', restock);
      alert('Cannot pay supplier: missing supplier ID. Please check the restock/payment data.');
      return;
    }
    try {
      const res = await api.get(`${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users/${supplierId}`);
      supplierBank = {
        accountName: res.data.bankAccountName || '',
        accountNumber: res.data.bankAccountNumber || '',
        bankName: res.data.bankName || '',
        branch: res.data.bankBranch || ''
      };
    } catch (e) {
      console.error('Failed to fetch supplier bank details:', e);
      alert('Failed to fetch supplier bank details.');
    }
    setSelectedRestock({ ...restock, supplierBank });
    setPaySupplierModalOpen(true);
  };

  // Handler for submitting supplier payment
  const submitSupplierPayment = async ({ amount, paymentMethod, bankDetails }) => {
    setPayingRestockId(selectedRestock._id);
    try {
      // If productId is populated, get supplier from it
      let supplierId = selectedRestock.productId?.supplier;
      // If productId is an object, get its _id for reference
      let productId = selectedRestock.productId?._id || selectedRestock.productId;
      // Ensure supplierId is a string (ObjectId)
      if (typeof supplierId === 'object' && supplierId !== null && supplierId._id) {
        supplierId = supplierId._id;
      }
      if (!supplierId) {
        alert('Supplier ID not found for this restock request.');
        setPayingRestockId(null);
        return;
      }
      // Ensure amount is a number
      const paymentAmount = Number(amount);
      const payload = {
        restockRequestId: selectedRestock._id,
        supplierId,
        amount: paymentAmount,
        paymentMethod,
      };
      if (paymentMethod === 'BANK_TRANSFER') {
        payload.bankDetails = bankDetails;
      }
      // Debug log
      console.log('Submitting supplier payment payload:', payload);
      await api.post(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/supplier-payments`, payload);
      // Optimistically update the UI so the button shows 'Paid' immediately
      setRestockPayments(prev => prev.map(r => r._id === selectedRestock._id ? { ...r, status: 'PAID' } : r));
      setPaySupplierModalOpen(false);
      setSelectedRestock(null);
      // Commented out to avoid overwriting optimistic update with stale backend data
      // fetchSupplierPayments();
      alert('Payment successful!');
    } catch (err) {
      const backendMsg = err?.response?.data?.message;
      alert('Payment failed.' + (backendMsg ? `\n${backendMsg}` : ''));
    }
    setPayingRestockId(null);
  };

  const applyHistoryFilters = async () => {
    setLoading(true)
    await fetchPayments()
  }


  const resetHistoryFilters = async () => {
    setStatusFilter('ALL')
    setStartDate('')
    setEndDate('')
    setLoading(true)
    await fetchPayments()
  }

  const handleAddMethod = async (e) => {
    e.preventDefault()

    if (!userId) {
      alert('User ID is missing')
      return
    }

    setSavingMethod(true)
    try {
      await api.post(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/methods`, {
        userId,
        type: methodForm.type,
        brand: methodForm.brand,
        last4: methodForm.last4,
        expiryMonth: methodForm.expiryMonth ? Number(methodForm.expiryMonth) : undefined,
        expiryYear: methodForm.expiryYear ? Number(methodForm.expiryYear) : undefined,
        isDefault: methodForm.isDefault
      })

      setMethodForm({
        type: 'CREDIT_CARD',
        brand: '',
        last4: '',
        expiryMonth: '',
        expiryYear: '',
        isDefault: false
      })

      fetchPaymentMethods()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add payment method')
    } finally {
      setSavingMethod(false)
    }
  }

  const handleSetDefaultMethod = async (methodId) => {
    setUpdatingMethodId(methodId)
    try {
      await api.put(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/methods/${methodId}`, {
        isDefault: true
      })
      fetchPaymentMethods()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update payment method')
    } finally {
      setUpdatingMethodId(null)
    }
  }

  const handleDeleteMethod = async (methodId) => {
    if (!confirm('Delete this payment method?')) return

    setDeletingMethodId(methodId)
    try {
      await api.delete(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/methods/${methodId}`)
      fetchPaymentMethods()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete payment method')
    } finally {
      setDeletingMethodId(null)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'payment-status-pending',
      PROCESSING: 'payment-status-processing',
      COMPLETED: 'payment-status-completed',
      FAILED: 'payment-status-failed',
      REFUNDED: 'payment-status-refunded'
    }
    return colors[status] || 'payment-status-pending'
  }


  if (loading) {
    return <div className="payments-loading">Loading payments...</div>;
  }

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      (p._id || p.id)?.toString().toLowerCase().includes(q) ||
      p.orderId?.toString().toLowerCase().includes(q) ||
      p.transactionId?.toString().toLowerCase().includes(q)
    );
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="payments-header">
        <h1 className="payments-title">{isAdmin ? 'All Payments' : 'My Payments'}</h1>
      </div>

      {/* Admin: Supplier Payments Section */}
      {isAdmin && (
        <div className="users-table-container mb-8">
          <h2 className="users-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Supplier Payments</h2>
          <p className="payments-section-desc" style={{ marginBottom: '2.2rem' }}></p>
          {restockPayments.length > 0 ? (
            <table className="users-table">
              <thead>
                <tr>
                  <th className="requestid-col">Request ID</th>
                  <th className="product-col">Product</th>
                  <th className="quantity-col">Quantity</th>
                  <th className="supplier-col">Supplier</th>
                  <th className="requested-col">Requested At</th>
                  <th className="status-col">Status</th>
                  <th className="action-col">Action</th>
                </tr>
              </thead>
              <tbody>
                {restockPayments.map(req => (
                  <tr key={req._id}>
                    <td className="requestid-col">{req._id.slice(-8)}</td>
                    <td className="product-col">{req.productId?.name || (req.productId?._id || req.productId)}</td>
                    <td className="quantity-col">{req.quantity}</td>
                    <td className="supplier-col">{req.productId?.supplier || '-'}</td>
                    <td className="requested-col">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="status-col">{req.status}</td>
                    <td className="action-col" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'center' }}>
                      {payingRestockId === req._id ? (
                        <button className="user-edit-btn" disabled>
                          Paying...
                        </button>
                      ) : req.status === 'PAID' ? (
                        <button className="user-success-btn" disabled>
                          Paid
                        </button>
                      ) : req.status === 'FULFILLED' ? (
                        <button
                          className="user-edit-btn"
                          onClick={() => handlePayRestock(req)}
                          title="Pay Supplier"
                        >
                          <FaMoneyCheckAlt /> Pay
                        </button>
                      ) : null}
                      <button
                        className="user-delete-btn"
                        onClick={() => handleDeleteRestock(req._id)}
                        title="Delete Restock Request"
                        style={{ marginLeft: 4 }}
                      >
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="payments-empty">No supplier payments pending.</div>
          )}
        </div>
      )}

      {/* Always render the modal at the root of PaymentsPage */}
      <PaySupplierModal
        open={paySupplierModalOpen}
        onClose={() => { setPaySupplierModalOpen(false); setSelectedRestock(null); }}
        restock={selectedRestock}
        onSubmit={submitSupplierPayment}
        readOnlyBankFields={true}
      />

      {/* Customer Payments Section */}
      <div className="payments-section">
        <h2 className="users-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Customer Payments</h2>
        
        <div className="page-search-wrap">
          <input
            type="text"
            className="page-search-input"
            placeholder="Search by payment ID, order ID, or transaction ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="page-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            {['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="date"
            className="page-filter-select"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="page-filter-select"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button className="payment-secondary-btn" onClick={applyHistoryFilters}>Apply</button>
          <button className="payment-secondary-btn" onClick={resetHistoryFilters}>Reset</button>
        </div>

        <div className="payments-list">
          {filteredPayments.map((payment) => {
            console.log('Rendering payment card with _id:', payment._id, 'id:', payment.id, 'transactionId:', payment.transactionId);
            return (
              <div key={payment._id || payment.id} className="payment-card">
                <div className="payment-header">
                  <div className="payment-header-info">
                    <div className="payment-title-row">
                      <h3 className="payment-id">Payment #{payment._id || payment.id}</h3>
                      <span className={`payment-status-badge ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="payment-details-grid">
                      <p className="payment-detail-item"><span className="payment-detail-label">Order ID:</span> {payment.orderId}</p>
                      <p className="payment-detail-item"><span className="payment-detail-label">Amount:</span> <span className="payment-amount">Rs. {payment.amount?.toFixed(2) || '0.00'}</span></p>
                      <p className="payment-detail-item"><span className="payment-detail-label">Method:</span> {payment.paymentMethod}</p>
                      <p className="payment-detail-item"><span className="payment-detail-label">Transaction ID:</span> {payment.transactionId || 'N/A'}</p>
                      <p className="payment-detail-item"><span className="payment-detail-label">Created:</span> {new Date(payment.createdAt).toLocaleString()}</p>
                      {payment.processedAt && (
                        <p className="payment-detail-item"><span className="payment-detail-label">Processed:</span> {new Date(payment.processedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin: refund button for completed payments */}
                {/* Admin: Delete button for any payment */}
                {isAdmin && (
                  <div className="payment-admin-actions">
                    <button
                      onClick={() => handleDeletePayment(payment._id || payment.id)}
                      className="payment-delete-btn"
                      style={{ marginRight: 8 }}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                )}
                {isAdmin && payment.status === 'COMPLETED' && (
                  <div className="payment-admin-actions">
                    <button
                      onClick={() => handleRefund(payment._id || payment.id)}
                      disabled={refunding === (payment._id || payment.id)}
                      className="payment-refund-btn"
                    >
                      {refunding === (payment._id || payment.id) ? 'Refunding...' : 'Refund Payment'}
                    </button>
                  </div>
                )}

                {['COMPLETED', 'REFUNDED'].includes(payment.status) && (
                  <div className="payment-admin-actions">
                    <button
                      onClick={() => handleGenerateInvoice(payment._id || payment.id)}
                      disabled={invoicing === (payment._id || payment.id)}
                      className="payment-invoice-btn"
                    >
                      {invoicing === (payment._id || payment.id) ? 'Generating Invoice...' : 'Generate Invoice'}
                    </button>
                  </div>
                )}

                {invoiceByPaymentId[payment._id || payment.id] && (
                  <div className="payment-invoice-panel">
                    <div className="payment-invoice-header">
                      <h4 className="payment-invoice-title">Invoice Summary</h4>
                      <span className="payment-invoice-number">
                        {invoiceByPaymentId[payment._id || payment.id].invoiceNumber}
                      </span>
                    </div>
                    <div className="payment-invoice-row">
                      <span className="payment-invoice-label">Generated</span>
                      <span className="payment-invoice-value">
                        {new Date(invoiceByPaymentId[payment._id || payment.id].generatedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="payment-invoice-row">
                      <span className="payment-invoice-label">Gross Amount</span>
                      <span className="payment-invoice-value">
                        Rs. {invoiceByPaymentId[payment._id || payment.id].summary?.grossAmount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="payment-invoice-row">
                      <span className="payment-invoice-label">Refund Amount</span>
                      <span className="payment-invoice-value">
                        Rs. {invoiceByPaymentId[payment._id || payment.id].summary?.refundAmount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="payment-invoice-row payment-invoice-net-row">
                      <span className="payment-invoice-label">Net Amount</span>
                      <span className="payment-invoice-value payment-invoice-net-value">
                        Rs. {invoiceByPaymentId[payment._id || payment.id].summary?.netAmount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {payments.length === 0 && (
            <div className="payments-empty">
              {isAdmin ? 'No payments found.' : 'No payments found. Place an order to see payments here.'}
            </div>
          )}
        </div>
      </div>

      <div className="payment-methods-section">
        <div className="payment-methods-header">
          <h2 className="payment-methods-title">Payment Methods</h2>
          <p className="payment-methods-subtitle">Manage your saved cards and choose a default method for faster checkout.</p>
        </div>

        <form className="payment-method-form" onSubmit={handleAddMethod}>
          <select
            className="page-filter-select"
            value={methodForm.type}
            onChange={(e) => setMethodForm((prev) => ({ ...prev, type: e.target.value }))}
          >
            <option value="CREDIT_CARD">CREDIT_CARD</option>
            <option value="DEBIT_CARD">DEBIT_CARD</option>
            <option value="PAYPAL">PAYPAL</option>
          </select>
          <input
            type="text"
            placeholder="Brand (e.g. VISA)"
            className="page-search-input"
            value={methodForm.brand}
            onChange={(e) => setMethodForm((prev) => ({ ...prev, brand: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Last 4 digits"
            className="page-search-input"
            maxLength={4}
            value={methodForm.last4}
            onChange={(e) => setMethodForm((prev) => ({ ...prev, last4: e.target.value.replace(/\D/g, '') }))}
            required
          />
          <input
            type="number"
            placeholder="Exp Month"
            className="page-search-input"
            min={1}
            max={12}
            value={methodForm.expiryMonth}
            onChange={(e) => setMethodForm((prev) => ({ ...prev, expiryMonth: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Exp Year"
            className="page-search-input"
            min={2024}
            value={methodForm.expiryYear}
            onChange={(e) => setMethodForm((prev) => ({ ...prev, expiryYear: e.target.value }))}
          />
          <label className="payment-default-checkbox payment-default-toggle">
            <input
              type="checkbox"
              checked={methodForm.isDefault}
              onChange={(e) => setMethodForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
            />
            Set as default
          </label>
          <button type="submit" className="payment-secondary-btn payment-add-method-btn" disabled={savingMethod}>
            {savingMethod ? 'Saving...' : 'Add Method'}
          </button>
        </form>

        {methodsLoading ? (
          <div className="payments-loading">Loading payment methods...</div>
        ) : (
          <div className="payment-methods-list">
            {methods.map((method) => (
              <div key={method._id || method.id} className="payment-method-card">
                <div className="payment-method-main">
                  <p className="payment-method-title">{method.type.replace(/_/g, ' ')} {method.brand ? `- ${method.brand}` : ''}</p>
                  <p className="payment-method-line">**** {method.last4}</p>
                  <p className="payment-method-line">Exp: {method.expiryMonth || '--'}/{method.expiryYear || '--'}</p>
                  {method.isDefault && <span className="payment-default-badge">Default</span>}
                </div>
                <div className="payment-method-actions">
                  {!method.isDefault && (
                    <button
                      className="payment-secondary-btn"
                      onClick={() => handleSetDefaultMethod(method._id || method.id)}
                      disabled={updatingMethodId === (method._id || method.id)}
                    >
                      {updatingMethodId === (method._id || method.id) ? 'Updating...' : 'Set Default'}
                    </button>
                  )}
                  <button
                    className="payment-delete-btn"
                    onClick={() => handleDeleteMethod(method._id || method.id)}
                    disabled={deletingMethodId === (method._id || method.id)}
                  >
                    {deletingMethodId === (method._id || method.id) ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}

            {methods.length === 0 && (
              <div className="payments-empty">No saved payment methods yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ProtectedRoute>
      <PaymentsPage />
    </ProtectedRoute>
  )
}

