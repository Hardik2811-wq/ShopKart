import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from './api'
import { useCart } from './cart'
import { Navbar } from './shop'

const rupees = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

const Page = ({ children }) => (
  <main className="shop-shell">
    <Navbar />
    {children}
  </main>
)

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export const Checkout = () => {
  const { cartItems, clearCart } = useCart()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mockModal, setMockModal] = useState(null)

  const units = cartItems.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0)

  const validate = () => {
    const errors = {}
    if (!form.fullName.trim()) errors.fullName = 'Full Name is required.'
    if (!form.phone.trim()) {
      errors.phone = 'Phone Number is required.'
    } else if (!/^\d{10}$/.test(form.phone.trim().replace(/\D/g, ''))) {
      errors.phone = 'Phone Number must contain a valid 10-digit number.'
    }
    if (!form.addressLine1.trim()) errors.addressLine1 = 'Address Line is required.'
    if (!form.city.trim()) errors.city = 'City is required.'
    if (!form.state.trim()) errors.state = 'State is required.'
    if (!form.pincode.trim()) {
      errors.pincode = 'Pincode is required.'
    } else if (!/^\d{6}$/.test(form.pincode.trim())) {
      errors.pincode = 'Pincode must contain exactly 6 digits.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleVerify = async (paymentData) => {
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post('/orders/verify-payment', paymentData)
      if (data.success) {
        clearCart()
        navigate(`/order-success/${data.order._id}`)
      } else {
        setError(data.message || 'Payment verification failed.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment signature verification failed. Cart preserved.')
    } finally {
      setSubmitting(false)
      setMockModal(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (cartItems.length === 0) {
      setError('Your cart is empty. Add products before placing an order.')
      return
    }

    if (!validate()) {
      return
    }

    setSubmitting(true)

    try {
      // 1. Create Order and Razorpay Order on server
      const { data } = await api.post('/orders/create-payment-order', {
        shippingAddress: form,
      })

      if (!data.success) {
        setError(data.message || 'Could not initiate payment order.')
        setSubmitting(false)
        return
      }

      // 2. If test mock mode active (development placeholder keys)
      if (data.isMock) {
        setMockModal(data)
        setSubmitting(false)
        return
      }

      // 3. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded || !window.Razorpay) {
        // Fallback to simulation if network blocks external script
        setMockModal(data)
        setSubmitting(false)
        return
      }

      // 4. Standard Razorpay Checkout
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'ShopKart Studio',
        description: 'Order Acquisition Checkout',
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          await handleVerify({
            shopKartOrderId: data.shopKartOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
        },
        prefill: {
          name: form.fullName,
          contact: form.phone,
        },
        theme: {
          color: '#0a0a0c',
        },
      }

      const rzp = new window.Razorpay(options)

      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error?.description || 'Transaction declined'}. Your cart has not been cleared.`)
        setSubmitting(false)
      })

      rzp.open()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to initialize checkout. Please review cart and retry.')
      setSubmitting(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <Page>
        <section className="shop-page">
          <div className="state">
            <h2>Your cart is empty</h2>
            <p>You cannot checkout with an empty bag. Select items from our catalog to begin.</p>
            <Link className="button" to="/products">
              Explore Catalog
            </Link>
          </div>
        </section>
      </Page>
    )
  }

  return (
    <Page>
      <section className="shop-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Checkout Journey</p>
            <h1>Delivery & Review.</h1>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            {units} item{units === 1 ? '' : 's'} queued
          </p>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: '24px' }}>{error}</div>}

        <div className="cart-layout">
          {/* Shipping Details Form */}
          <form className="panel" style={{ width: '100%', margin: 0 }} onSubmit={handleSubmit}>
            <p className="eyebrow">Shipping Information</p>
            <h2 style={{ marginBottom: '20px' }}>Recipient Details</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label>
                  Full Name
                  <input
                    placeholder="Marcus Sterling"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </label>
                {fieldErrors.fullName && <p className="field-error">{fieldErrors.fullName}</p>}
              </div>

              <div>
                <label>
                  Phone Number
                  <input
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </label>
                {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
              </div>
            </div>

            <div>
              <label>
                Address Line
                <input
                  placeholder="Apartment 4B, 22 Park Avenue"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                />
              </label>
              {fieldErrors.addressLine1 && <p className="field-error">{fieldErrors.addressLine1}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label>
                  City
                  <input
                    placeholder="Bengaluru"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </label>
                {fieldErrors.city && <p className="field-error">{fieldErrors.city}</p>}
              </div>

              <div>
                <label>
                  State
                  <input
                    placeholder="Karnataka"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </label>
                {fieldErrors.state && <p className="field-error">{fieldErrors.state}</p>}
              </div>

              <div>
                <label>
                  Pincode
                  <input
                    placeholder="560001"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  />
                </label>
                {fieldErrors.pincode && <p className="field-error">{fieldErrors.pincode}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{ width: '100%', marginTop: '20px', minHeight: '48px' }}
            >
              {submitting ? 'Connecting Payment Gateway...' : `Proceed to Pay ${rupees(subtotal)}`}
            </button>
          </form>

          {/* Order Summary */}
          <aside className="summary">
            <p className="eyebrow">Review Order</p>
            <h2>Summary</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {cartItems.map((item) => (
                <div
                  key={item.product._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    fontSize: '0.88rem',
                  }}
                >
                  <span style={{ color: 'var(--text-high)' }}>
                    {item.product.name} <span style={{ color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>× {item.quantity}</span>
                  </span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>
                    {rupees(item.product.price * item.quantity)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="summary-rows">
              <div className="summary-row">
                <span>Total Units</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{units}</strong>
              </div>
              <div className="summary-row">
                <span>Shipping Delivery</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>Free</span>
              </div>
              <div className="summary-row total">
                <span>Final Total</span>
                <strong>{rupees(subtotal)}</strong>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
              Secured with Razorpay Standard Gateway. Testing in Test Mode.
            </p>
          </aside>
        </div>

        {/* Razorpay Test Simulation Dialog for offline/development environments */}
        {mockModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <p className="eyebrow">Razorpay Test Simulator</p>
              <h2>Simulate Payment</h2>
              <p style={{ margin: '8px 0 20px', fontSize: '0.9rem' }}>
                Order #{mockModal.shopKartOrderId} initialized for <strong>{rupees(mockModal.amount / 100)}</strong>.
              </p>

              <div style={{ display: 'grid', gap: '12px' }}>
                <button
                  onClick={() =>
                    handleVerify({
                      shopKartOrderId: mockModal.shopKartOrderId,
                      razorpay_order_id: mockModal.razorpayOrderId,
                      razorpay_payment_id: `pay_mock_${Date.now()}`,
                      razorpay_signature: `mock_sig_${mockModal.razorpayOrderId}`,
                    })
                  }
                  disabled={submitting}
                >
                  Simulate Successful Payment
                </button>

                <button
                  className="danger"
                  onClick={() => {
                    setError('Payment cancelled/failed in Razorpay simulator. Cart preserved.')
                    setMockModal(null)
                  }}
                  disabled={submitting}
                >
                  Simulate Payment Failure
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </Page>
  )
}

export const OrderSuccess = () => {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => setError(err.response?.data?.message || 'Could not load order.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <Page>
        <section className="shop-page">
          <p className="status" style={{ textAlign: 'center', padding: '60px 0' }}>
            Retrieving order confirmation...
          </p>
        </section>
      </Page>
    )
  }

  if (error || !order) {
    return (
      <Page>
        <section className="shop-page">
          <div className="state">
            <h2>Order Confirmation</h2>
            <p>{error || 'Order record could not be found.'}</p>
            <Link className="button" to="/orders">
              View All Orders
            </Link>
          </div>
        </section>
      </Page>
    )
  }

  return (
    <Page>
      <section className="shop-page">
        <div className="state" style={{ maxWidth: '600px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--accent-emerald)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px',
              fontSize: '1.6rem',
            }}
          >
            ✓
          </div>
          <p className="eyebrow" style={{ color: 'var(--accent-emerald)' }}>
            Payment Verified & Authenticated
          </p>
          <h1 style={{ fontSize: '2.4rem', margin: '4px 0 12px' }}>Order Placed Successfully</h1>
          <p style={{ marginBottom: '28px' }}>
            Your transaction has been processed. Order data and item snapshots have been preserved.
          </p>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'left',
              display: 'grid',
              gap: '10px',
              marginBottom: '32px',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Order Reference</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>#{order._id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Total Paid</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                {rupees(order.totalAmount)}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Status</span>
              <span className="status-badge status-placed">{order.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Deliver To</span>
              <span>{order.shippingAddress.fullName}, {order.shippingAddress.city}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <Link className="button" to="/orders">
              View My Orders
            </Link>
            <Link className="secondary button" to="/products">
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </Page>
  )
}

export const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/orders')
      setOrders(data.orders || [])
    } catch {
      setError('Unable to load order history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  return (
    <Page>
      <section className="shop-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Purchase Records</p>
            <h1>My Orders.</h1>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            {orders.length} order{orders.length === 1 ? '' : 's'} registered
          </p>
        </div>

        {loading && <p className="status" style={{ textAlign: 'center', padding: '60px 0' }}>Retrieving order ledger...</p>}
        {error && (
          <div className="state">
            <h2>{error}</h2>
            <button onClick={loadOrders}>Retry</button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="state">
            <h2>You have not placed any orders yet.</h2>
            <p>Once you acquire items through our catalog, your historical snapshots and tracking will appear here.</p>
            <Link className="button" to="/products">
              Start Shopping
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order) => {
              const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })

              return (
                <article
                  key={order._id}
                  className="product-card"
                  style={{
                    padding: '24px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(200px, 1.2fr) minmax(200px, 2fr) auto',
                    gap: '24px',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p className="eyebrow">Order ID</p>
                    <h2 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>{dateStr}</p>
                    <div style={{ marginTop: '12px' }}>
                      <span className={`status-badge status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="eyebrow">Purchased Items</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.88rem', color: 'var(--text-high)' }}>
                          {item.name}{' '}
                          <span style={{ color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                            × {item.quantity} ({rupees(item.price)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p className="eyebrow" style={{ textAlign: 'right' }}>Total Amount</p>
                    <p className="price" style={{ margin: '4px 0 16px', fontSize: '1.4rem' }}>
                      {rupees(order.totalAmount)}
                    </p>
                    <Link className="secondary button" to={`/orders/${order._id}`}>
                      View Details
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </Page>
  )
}

export const OrderDetails = () => {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const loadOrder = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/orders/${id}`)
      setOrder(data.order)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to retrieve order details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  const changeStatus = async (newStatus) => {
    setUpdatingStatus(true)
    try {
      const { data } = await api.patch(`/orders/${id}/status`, { status: newStatus })
      setOrder(data.order)
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <Page>
        <section className="shop-page">
          <p className="status" style={{ textAlign: 'center', padding: '60px 0' }}>Loading order specifications...</p>
        </section>
      </Page>
    )
  }

  if (error || !order) {
    return (
      <Page>
        <section className="shop-page">
          <div className="state">
            <h2>Order Not Found</h2>
            <p>{error || 'Requested order record could not be found or access is unauthorized.'}</p>
            <Link className="button" to="/orders">
              Return to Orders
            </Link>
          </div>
        </section>
      </Page>
    )
  }

  const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const stages = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED']
  const currentStageIndex = stages.indexOf(order.status)

  return (
    <Page>
      <section className="shop-page">
        <div style={{ marginBottom: '24px' }}>
          <Link to="/orders" className="link-button" style={{ fontSize: '0.86rem' }}>
            ← Back to All Orders
          </Link>
        </div>

        <div className="page-heading">
          <div>
            <p className="eyebrow">Order Receipt</p>
            <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>Order #{order._id}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`status-badge status-${order.status.toLowerCase()}`}>
              {order.status}
            </span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginTop: '6px' }}>
              {dateStr}
            </p>
          </div>
        </div>

        {/* Bonus Challenge: Status Progression Tracker */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p className="eyebrow" style={{ margin: 0 }}>Fulfillment Pipeline</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Dev Simulator:</span>
              <select
                value={order.status}
                disabled={updatingStatus}
                onChange={(e) => changeStatus(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--text-high)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                }}
              >
                {stages.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {stages.map((st, i) => {
              const isDone = i <= currentStageIndex
              return (
                <div
                  key={st}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: isDone ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)',
                    background: isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: isDone ? 'var(--accent-emerald)' : 'var(--text-subtle)',
                    }}
                  >
                    {isDone ? '✓ ' : ''}{st}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="cart-layout">
          {/* Order Items Breakdown */}
          <div className="cart-list">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Items in this Order</h2>
            {order.items.map((item, idx) => (
              <article className="cart-item" key={idx}>
                <img src={item.image} alt={item.name} />
                <div>
                  <h2>{item.name}</h2>
                  <p className="price" style={{ fontSize: '1rem', margin: '4px 0' }}>
                    {rupees(item.price)}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                    Quantity: {item.quantity} unit{item.quantity === 1 ? '' : 's'}
                  </p>
                </div>
                <div />
                <strong className="line-total">{rupees(item.price * item.quantity)}</strong>
              </article>
            ))}
          </div>

          {/* Delivery & Payment Information */}
          <aside className="summary">
            <p className="eyebrow">Delivery Destination</p>
            <h2>Shipping Address</h2>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '24px' }}>
              <p style={{ color: 'var(--text-high)', fontWeight: 600 }}>{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
              <p style={{ marginTop: '8px', fontFamily: 'var(--font-mono)' }}>Phone: {order.shippingAddress.phone}</p>
            </div>

            <p className="eyebrow">Payment Verification</p>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Payment Status</span>
                <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.razorpayPaymentId && (
                <div className="summary-row">
                  <span>Payment ID</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                    {order.razorpayPaymentId}
                  </span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total Settled</span>
                <strong>{rupees(order.totalAmount)}</strong>
              </div>
            </div>

            <Link to="/products" className="secondary button" style={{ width: '100%', textAlign: 'center' }}>
              Explore Other Pieces
            </Link>
          </aside>
        </div>
      </section>
    </Page>
  )
}
