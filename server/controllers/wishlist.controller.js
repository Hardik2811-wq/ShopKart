import mongoose from 'mongoose'
import Customer from '../models/customer.model.js'
import Product from '../models/product.model.js'

const productFields = 'name price category image stock description'

const validProductId = (productId) => mongoose.isValidObjectId(productId)

export const addWishlistItem = async (req, res) => {
  const { productId } = req.params
  if (!validProductId(productId)) return res.status(400).json({ success: false, message: 'Invalid product ID' })

  try {
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
    if (req.user.wishlist.some((item) => item.equals(product._id))) {
      return res.status(409).json({ success: false, message: 'Product already in wishlist' })
    }

    req.user.wishlist.push(product._id)
    await req.user.save()
    return res.status(201).json({ success: true, message: 'Product added to wishlist' })
  } catch {
    return res.status(500).json({ success: false, message: 'Could not add product to wishlist' })
  }
}

export const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({ path: 'wishlist', select: productFields })
    const wishlist = customer.wishlist.filter(Boolean)
    return res.json({ success: true, count: wishlist.length, wishlist })
  } catch {
    return res.status(500).json({ success: false, message: 'Could not load wishlist' })
  }
}

export const removeWishlistItem = async (req, res) => {
  const { productId } = req.params
  if (!validProductId(productId)) return res.status(400).json({ success: false, message: 'Invalid product ID' })

  const index = req.user.wishlist.findIndex((item) => item.equals(productId))
  if (index === -1) return res.status(404).json({ success: false, message: 'Product is not in wishlist' })

  try {
    req.user.wishlist.splice(index, 1)
    await req.user.save()
    return res.json({ success: true, message: 'Product removed from wishlist' })
  } catch {
    return res.status(500).json({ success: false, message: 'Could not remove product from wishlist' })
  }
}
