'use client'
import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { FaShoppingCart, FaTrash, FaMinus, FaPlus, FaCreditCard } from 'react-icons/fa'
import '@/styles/cart.css'

const PAYMENT_METHODS = ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'CASH_ON_DELIVERY']

function CartPage() {
  const { user } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD')
  const [savedMethods, setSavedMethods] = useState([])
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const userId = user?._id || user?.id

  useEffect(() => {
    if (userId) fetchCart()
  }, [userId])

  useEffect(() => {
    if (userId) fetchSavedMethods()
  }, [userId])

  const fetchCart = async () => {
    try {
      const res = await api.get(
        `${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/cart?userId=${userId}`
      )
      setCart(res.data)
    } catch (err) {
      console.error('Error fetching cart:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedMethods = async () => {
    try {
      const res = await api.get(
        `${process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE}/api/payments/methods/${userId}`
      )

      const methods = res.data || []
      setSavedMethods(methods)

      const defaultMethod = methods.find((method) => method.isDefault)
      if (defaultMethod?.type) {
        setPaymentMethod(defaultMethod.type)
      } else if (methods[0]?.type) {
        setPaymentMethod(methods[0].type)
      }
    } catch (err) {
      setSavedMethods([])
    }
  }

  const handleUpdateQty = async (productId, qty) => {
    try {
      setErrorMsg('')
      const res = await api.put(
        `${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/cart/${productId}`,
        { userId, quantity: qty }
      )
      setCart(res.data)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update quantity')
    }
  }

  const handleRemove = async (productId) => {
    try {
      const res = await api.delete(
        `${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/cart/${productId}`,
        { data: { userId } }
      )
      setCart(res.data)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to remove item')
    }
  }

  const handleClear = async () => {
    if (!confirm('Clear all items from your cart?')) return
    try {
      await api.delete(
        `${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/cart`,
        { data: { userId } }
      )
      setCart(prev => ({ ...prev, items: [] }))
    } catch (err) {
      setErrorMsg('Failed to clear cart')
    }
  }

  const handleCheckout = async () => {
    if (!cart?.items?.length) return
    setCheckingOut(true)
    setErrorMsg('')
    setSuccessMsg('')

    const results = []
    for (const item of cart.items) {
      try {
        const res = await api.post(
          `${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/orders`,
          {
            userId,
            productId: item.productId,
            quantity: item.quantity,
            paymentMethod
          }
        )
        results.push({ success: true, order: res.data.order })
      } catch (err) {
        results.push({
          success: false,
          productName: item.productName,
          error: err.response?.data?.message || 'Order failed'
        })
      }
    }

    const succeeded = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success)

    if (succeeded > 0) {
      // Clear cart after successful checkout
      try {
        await api.delete(
          `${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/cart`,
          { data: { userId } }
        )
        setCart(prev => ({ ...prev, items: [] }))
      } catch {}

      setSuccessMsg(
        `${succeeded} order(s) placed successfully!` +
        (failed.length ? ` ${failed.length} item(s) failed.` : '')
      )
    } else {
      setErrorMsg('Checkout failed: ' + failed.map(f => f.error).join(', '))
    }

    setCheckingOut(false)
  }

  const totalItems = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0
  const totalAmount = cart?.items?.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="spinner" />
        <p>Loading cart...</p>
      </div>
    )
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1><FaShoppingCart /> Shopping Cart</h1>
        {cart?.items?.length > 0 && (
          <button className="cart-clear-btn" onClick={handleClear}>
            <FaTrash /> Clear Cart
          </button>
        )}
      </div>

      {successMsg && <div className="cart-success">{successMsg}</div>}
      {errorMsg && <div className="cart-error">{errorMsg}</div>}

      {!cart?.items?.length ? (
        <div className="cart-empty">
          <FaShoppingCart className="cart-empty-icon" />
          <p>Your cart is empty</p>
          <a href="/products" className="cart-browse-btn">Browse Products</a>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items list */}
          <div className="cart-items">
            {cart.items.map(item => (
              <div key={item.productId} className="cart-item">
                <div className="cart-item-info">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="cart-item-img" />
                  ) : (
                    <div className="cart-item-img-placeholder">
                      <FaShoppingCart />
                    </div>
                  )}
                  <div>
                    <p className="cart-item-name">{item.productName}</p>
                    <p className="cart-item-price">Rs. {item.price.toFixed(2)} each</p>
                  </div>
                </div>

                <div className="cart-item-actions">
                  <div className="cart-qty">
                    <button
                      className="cart-qty-btn"
                      onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <FaMinus />
                    </button>
                    <span className="cart-qty-value">{item.quantity}</span>
                    <button
                      className="cart-qty-btn"
                      onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                    >
                      <FaPlus />
                    </button>
                  </div>

                  <span className="cart-item-subtotal">
                    Rs. {(item.price * item.quantity).toFixed(2)}
                  </span>

                  <button
                    className="cart-remove-btn"
                    onClick={() => handleRemove(item.productId)}
                    title="Remove"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="cart-summary">
            <h2>Order Summary</h2>

            <div className="cart-summary-row">
              <span>Items ({totalItems})</span>
              <span>Rs. {totalAmount.toFixed(2)}</span>
            </div>

            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span>Rs. {totalAmount.toFixed(2)}</span>
            </div>

            <div className="cart-payment-select">
              <label>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                {savedMethods.length > 0 ? (
                  savedMethods.map((method) => (
                    <option key={method._id || method.id} value={method.type}>
                      {`${method.type.replace(/_/g, ' ')}${method.brand ? ` - ${method.brand}` : ''}${method.last4 ? ` (**** ${method.last4})` : ''}${method.isDefault ? ' [Default]' : ''}`}
                    </option>
                  ))
                ) : (
                  PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                  ))
                )}
              </select>
            </div>

            <button
              className="cart-checkout-btn"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              <FaCreditCard />
              {checkingOut ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Cart() {
  return (
    <ProtectedRoute>
      <CartPage />
    </ProtectedRoute>
  )
}
