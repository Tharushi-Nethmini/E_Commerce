'use client'
import { useState, useEffect, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import '@/styles/payments.css'

function PaymentsPage() {
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

  useEffect(() => {
    if (!user) {
      setLoading(false)
      setMethodsLoading(false)
      return
    }
    fetchPayments()
    fetchPaymentMethods()
  }, [user, fetchPayments, fetchPaymentMethods])

  const applyHistoryFilters = async () => {
    setLoading(true)
    await fetchPayments()
  }

  const resetHistoryFilters = async () => {
    setStatusFilter('ALL')
    setStartDate('')
    setEndDate('')
    setLoading(true)
    try {
      const response = await api.get(
        `${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/history?${(!isAdmin && userId) ? `userId=${userId}&` : ''}page=1&limit=100`
      )
      setPayments(response.data?.data || [])
    } catch (error) {
      console.error('Error resetting payment filters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async (paymentId) => {
    if (!confirm('Are you sure you want to refund this payment?')) return

    const reason = prompt('Refund reason (optional):') || ''
    const amountInput = prompt('Refund amount (leave empty for full refund):') || ''
    const payload = {
      reason: reason.trim()
    }

    if (amountInput.trim()) {
      const parsedAmount = Number(amountInput)
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Refund amount must be a positive number')
        return
      }
      payload.amount = parsedAmount
    }

    setRefunding(paymentId)
    try {
      await api.post(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/${paymentId}/refund`, payload)
      fetchPayments()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to refund payment')
    } finally {
      setRefunding(null)
    }
  }

  const handleGenerateInvoice = async (paymentId) => {
    setInvoicing(paymentId)
    try {
      const response = await api.get(`${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/${paymentId}/invoice`)
      const invoice = response.data

      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const BRAND = [79, 70, 229]
      const GRAY = [107, 114, 128]
      const STRIPE = [245, 247, 255]

      const fmt = (amount) =>
        'Rs. ' + Number(amount || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()

      doc.setFillColor(...BRAND)
      doc.rect(0, 0, pageW, 30, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.text('NexMart', 14, 14)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Payment Invoice', 14, 22)
      doc.text(
        `Generated: ${invoice.generatedAt ? new Date(invoice.generatedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : 'N/A'}`,
        pageW - 14,
        22,
        { align: 'right' }
      )

      let y = 40
      const section = (title) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(...BRAND)
        doc.text(title, 14, y)
        doc.setDrawColor(...BRAND)
        doc.setLineWidth(0.3)
        doc.line(14, y + 1.5, pageW - 14, y + 1.5)
        y += 7
      }

      const tableOpts = (head, body) => ({
        startY: y,
        head: [head],
        body,
        headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: STRIPE },
        styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
        margin: { left: 14, right: 14 },
        theme: 'grid'
      })

      section('1. Invoice Overview')
      autoTable(doc, {
        ...tableOpts(
          ['Field', 'Value'],
          [
            ['Invoice Number', invoice.invoiceNumber || 'N/A'],
            ['Payment ID', invoice.payment?.paymentId || paymentId],
            ['Order ID', invoice.payment?.orderId || 'N/A'],
            ['User ID', invoice.payment?.userId || 'N/A'],
            ['Status', invoice.payment?.status || 'N/A']
          ]
        ),
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
      })
      y = doc.lastAutoTable.finalY + 10

      section('2. Transaction Details')
      autoTable(doc, {
        ...tableOpts(
          ['Transaction ID', 'Payment Method', 'Processed At'],
          [[
            invoice.payment?.transactionId || 'N/A',
            invoice.payment?.paymentMethod || 'N/A',
            invoice.payment?.processedAt ? new Date(invoice.payment.processedAt).toLocaleString() : 'N/A'
          ]]
        )
      })
      y = doc.lastAutoTable.finalY + 10

      section('3. Amount Summary')
      autoTable(doc, {
        ...tableOpts(
          ['Description', 'Amount'],
          [
            ['Gross Amount', fmt(invoice.summary?.grossAmount)],
            ['Refund Amount', fmt(invoice.summary?.refundAmount)],
            ['Net Amount', fmt(invoice.summary?.netAmount)]
          ]
        ),
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'right', fontStyle: 'bold' }
        }
      })

      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(...GRAY)
      doc.text('Thank you for your payment.', 14, Math.min(doc.lastAutoTable.finalY + 8, pageH - 14))

      const pages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(...GRAY)
        doc.text(
          `NexMart Confidential  ·  Page ${i} of ${pages}`,
          pageW / 2,
          pageH - 8,
          { align: 'center' }
        )
      }

      doc.save(`${invoice.invoiceNumber || `invoice-${paymentId}`}.pdf`)

      setInvoiceByPaymentId((prev) => ({
        ...prev,
        [paymentId]: invoice
      }))
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate invoice')
    } finally {
      setInvoicing(null)
    }
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
    return <div className="payments-loading">Loading payments...</div>
  }

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = (
      (p._id || p.id)?.toString().toLowerCase().includes(q) ||
      p.orderId?.toString().toLowerCase().includes(q) ||
      p.transactionId?.toString().toLowerCase().includes(q)
    )
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <div className="payments-header">
        <h1 className="payments-title">{isAdmin ? 'All Payments' : 'My Payments'}</h1>
      </div>

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
        {filteredPayments.map((payment) => (
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
        ))}

        {payments.length === 0 && (
          <div className="payments-empty">
            {isAdmin ? 'No payments found.' : 'No payments found. Place an order to see payments here.'}
          </div>
        )}
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

