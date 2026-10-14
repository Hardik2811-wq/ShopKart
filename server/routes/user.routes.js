import { Router } from 'express'
import { getCurrentUser, getProfile, login, logout, register } from '../controllers/user.controller.js'
import { loadSession, requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', loadSession, getCurrentUser)
router.get('/profile/:username', requireAuth, getProfile)

export default router
