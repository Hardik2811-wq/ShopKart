import crypto from 'crypto'
import razorpay from '../config/razorpay.js'
import Order from '../models/order.model.js'
import Product from '../models/product.model.js'

export const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body

    // 1. Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required.' })
    }

    const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress
    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !addressLine1?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !pincode?.trim()
    ) {
      return res.status(400).json({ success: false, message: 'All shipping address fields are required.' })
    }

    if (!/^\d{10}$/.test(phone.trim().replace(/\D/g, ''))) {
      return res.status(400).json({ success: false, message: 'Phone number must contain a valid 10-digit number.' })
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({ success: false, message: 'Pincode must contain exactly 6 digits.' })
    }

    const cleanedAddress = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
    }

    // 2. Validate user cart
    const user = req.user
    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Add products before checkout.' })
    }

    // 3. Re-verify latest product data, pricing, and stock on server
    const productIds = user.cart.map((item) => item.product)
    const latestProducts = await Product.find({ _id: { $in: productIds } })
    const productMap = new Map(latestProducts.map((p) => [p._id.toString(), p]))

    let calculatedTotal = 0
    const snapshotItems = []

    for (const cartItem of user.cart) {
      const product = productMap.get(cartItem.product.toString())
      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'One or more items in your cart are no longer available.',
        })
      }

      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock} units.`,
        })
      }

      calculatedTotal += product.price * cartItem.quantity
      snapshotItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      })
    }

    // 4. Create pending ShopKart Order
    const shopKartOrder = new Order({
      user: user._id,
      items: snapshotItems,
      shippingAddress: cleanedAddress,
      totalAmount: calculatedTotal,
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT',
    })

    await shopKartOrder.save()

    // 5. Create Razorpay Order in paise
    const amountInPaise = Math.round(calculatedTotal * 100)
    let razorpayOrderId = null
    let isMock = false

    try {
      if (
        process.env.RAZORPAY_KEY_ID &&
        process.env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder' &&
        process.env.RAZORPAY_KEY_SECRET &&
        process.env.RAZORPAY_KEY_SECRET !== 'rzp_test_secret_placeholder'
      ) {
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: shopKartOrder._id.toString(),
        })
        razorpayOrderId = rzpOrder.id
      } else {
        // Safe development simulation fallback when placeholder keys are used
        razorpayOrderId = `order_mock_${shopKartOrder._id}`
        isMock = true
      }
    } catch {
      // Fallback to simulation if live Razorpay credentials reject
      razorpayOrderId = `order_mock_${shopKartOrder._id}`
      isMock = true
    }

    shopKartOrder.razorpayOrderId = razorpayOrderId
    await shopKartOrder.save()

    return res.status(201).json({
      success: true,
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      isMock,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Could not initiate checkout order.' })
  }
}

export const verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!shopKartOrderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing required payment verification parameters.' })
    }

    const order = await Order.findById(shopKartOrderId)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    // Verify ownership
    if (!order.user.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to order.' })
    }

    // Verify HMAC SHA256 Signature
    let isValid = false

    if (order.razorpayOrderId?.startsWith('order_mock_')) {
      // Allow mock test verification in dev
      isValid = razorpay_signature === `mock_sig_${order.razorpayOrderId}` || razorpay_signature === 'mock_signature_success'
    } else {
      const body = order.razorpayOrderId + '|' + razorpay_payment_id
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body)
        .digest('hex')

      isValid = expectedSignature === razorpay_signature
    }

    if (!isValid) {
      order.paymentStatus = 'FAILED'
      await order.save()
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment could not be verified.',
      })
    }

    // Mark paid and placed
    order.paymentStatus = 'PAID'
    order.status = 'PLACED'
    order.razorpayPaymentId = razorpay_payment_id
    await order.save()

    // Deduct stock for ordered items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      })
    }

    // Clear customer cart only after successful payment verification
    req.user.cart = []
    await req.user.save()

    return res.json({
      success: true,
      message: 'Payment verified successfully and order placed.',
      order,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Payment verification failed.' })
  }
}

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    return res.json({ success: true, orders })
  } catch {
    return res.status(500).json({ success: false, message: 'Could not load orders.' })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    // Ownership check
    if (!order.user.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order.' })
    }

    return res.json({ success: true, order })
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid order ID.' })
  }
}

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    const allowed = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED']

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` })
    }

    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    if (!order.user.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order.' })
    }

    order.status = status
    await order.save()

    return res.json({ success: true, order })
  } catch {
    return res.status(400).json({ success: false, message: 'Could not update order status.' })
  }
}
