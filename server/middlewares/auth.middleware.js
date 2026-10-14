import jwt from 'jsonwebtoken'
import Customer from '../models/customer.model.js'

export const requireAuth = async (req, res, next) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ message: 'Authentication required' })

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET)
    const user = await Customer.findById(userId)
    if (!user) return res.status(401).json({ message: 'Invalid authentication token' })

    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired authentication token' })
  }
}

export const loadSession = async (req, _, next) => {
  const token = req.cookies.token
  if (!token) return next()

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await Customer.findById(userId)
  } catch {
    req.user = null
  }

  next()
}
