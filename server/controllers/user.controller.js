import bcrypt from 'bcrypt'
import User from '../models/user.model.js'
import { cookieOptions, createToken, publicUser } from '../utils/auth.js'

const validEmail = (email) => /^\S+@\S+\.\S+$/.test(email)

const sendSession = (res, status, message, user) => {
  const token = createToken(user._id)
  return res.status(status).cookie('token', token, cookieOptions).json({ message, user: publicUser(user) })
}

export const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body
    if (!name || !username || !email || !password) return res.status(400).json({ message: 'All fields are required' })
    if (!validEmail(email)) return res.status(400).json({ message: 'Enter a valid email address' })
    if (password.length < 6) return res.status(400).json({ message: 'Password must contain at least 6 characters' })

    const duplicate = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] })
    if (duplicate) return res.status(409).json({ message: 'Email or username is already in use' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ name, username, email, password: hashedPassword })
    return sendSession(res, 201, 'Account created', user)
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'Email or username is already in use' })
    return res.status(500).json({ message: 'Could not create account' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    const correctPassword = user && await bcrypt.compare(password, user.password)
    if (!correctPassword) return res.status(401).json({ message: 'Invalid email or password' })

    return sendSession(res, 200, 'Login successful', user)
  } catch {
    return res.status(500).json({ message: 'Could not log in' })
  }
}

export const logout = (_, res) => res.clearCookie('token', cookieOptions).json({ message: 'Logged out' })

export const getCurrentUser = (req, res) => res.json({ user: req.user ? publicUser(req.user) : null })

export const getProfile = async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() })
  if (!user) return res.status(404).json({ message: 'User not found' })
  return res.json({ user: publicUser(user) })
}
