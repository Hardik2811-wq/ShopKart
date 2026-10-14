import mongoose from 'mongoose'
import Customer from '../models/customer.model.js'
import Product from '../models/product.model.js'

const productFields = 'name price category image stock description'
const validProductId = (productId) => mongoose.isValidObjectId(productId)

const populatedCart = async (customerId) => {
  const customer = await Customer.findById(customerId).populate({ path: 'cart.product', select: productFields })
  return customer.cart.filter((item) => item.product)
}

export const getCart = async (req, res) => {
  try {
    const cart = await populatedCart(req.user._id)
    return res.json({ success: true, cart })
  } catch {
    return res.status(500).json({ success: false, message: 'Could not load cart' })
  }
}

export const addCartItem = async (req, res) => {
  const { productId } = req.params
  if (!validProductId(productId)) return res.status(400).json({ success: false, message: 'Invalid product ID' })

  try {
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

    const item = req.user.cart.find((entry) => entry.product.equals(product._id))
    if (item) {
      if (item.quantity >= product.stock) return res.status(400).json({ success: false, message: 'Cannot add more than available stock' })
      item.quantity += 1
    } else {
      if (product.stock < 1) return res.status(400).json({ success: false, message: 'Product is out of stock' })
      req.user.cart.push({ product: product._id, quantity: 1 })
    }

    await req.user.save()
    const cart = await populatedCart(req.user._id)
    return res.status(201).json({ success: true, message: 'Cart updated', cart })
  } catch {
    return res.status(500).json({ success: false, message: 'Could not update cart' })
  }
}

export const updateCartItem = async (req, res) => {
  const { productId } = req.params
  const { quantity } = req.body
  if (!validProductId(productId)) return res.status(400).json({ success: false, message: 'Invalid product ID' })
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be a whole number of at least 1' })

  try {
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
    const item = req.user.cart.find((entry) => entry.product.equals(product._id))
    if (!item) return res.status(404).json({ success: false, message: 'Product is not in cart' })
    if (quantity > product.stock) return res.status(400).json({ success: false, message: 'Quantity exceeds available stock' })

    item.quantity = quantity
    await req.user.save()
    const cart = await populatedCart(req.user._id)
    return res.json({ success: true, message: 'Cart quantity updated', cart })
  } catch {
    return res.status(500).json({ success: false, message: 'Could not update cart quantity' })
  }
}

export const removeCartItem = async (req, res) => {
  const { productId } = req.params
  if (!validProductId(productId)) return res.status(400).json({ success: false, message: 'Invalid product ID' })

  const index = req.user.cart.findIndex((entry) => entry.product.equals(productId))
  if (index === -1) return res.status(404).json({ success: false, message: 'Product is not in cart' })

  try {
    req.user.cart.splice(index, 1)
    await req.user.save()
    const cart = await populatedCart(req.user._id)
    return res.json({ success: true, message: 'Product removed from cart', cart })
  } catch {
    return res.status(500).json({ success: false, message: 'Could not remove product from cart' })
  }
}
