import bcrypt from 'bcrypt'
import Customer from '../models/customer.model.js'
import { cookieOptions, createToken } from '../utils/auth.js'

const publicCustomer = (customer) => ({
  _id: customer._id,
  fullName: customer.fullName,
  email: customer.email,
  phone: customer.phone,
  createdAt: customer.createdAt,
})

const sendSession = (res, status, message, customer) => {
  const token = createToken(customer._id)
  return res.status(status).cookie('token', token, cookieOptions).json({ success: true, message, customer: publicCustomer(customer) })
}

export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body
    if (!fullName || !email || !password || !phone) return res.status(400).json({ success: false, message: 'All fields are required' })
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must contain at least 6 characters' })
    if (await Customer.exists({ email: email.toLowerCase() })) return res.status(409).json({ success: false, message: 'Email already exists' })

    const customer = await Customer.create({ fullName, email, phone, password: await bcrypt.hash(password, 10) })
    return sendSession(res, 201, 'Customer registered successfully', customer)
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Email already exists' })
    return res.status(500).json({ success: false, message: 'Could not register customer' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' })
    const customer = await Customer.findOne({ email: email.toLowerCase() }).select('+password')
    if (!(customer && await bcrypt.compare(password, customer.password))) return res.status(401).json({ success: false, message: 'Invalid credentials' })
    return sendSession(res, 200, 'Login successful', customer)
  } catch {
    return res.status(500).json({ success: false, message: 'Could not log in' })
  }
}

export const getMe = (req, res) => res.json(publicCustomer(req.user))

export const logout = (_, res) => res.clearCookie('token', cookieOptions).json({ success: true, message: 'Logged out successfully' })
