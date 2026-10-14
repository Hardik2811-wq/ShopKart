import express from 'express'
import {
  createPaymentOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
  verifyPayment,
} from '../controllers/order.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)

router.post('/create-payment-order', createPaymentOrder)
router.post('/verify-payment', verifyPayment)
router.get('/', getOrders)
router.get('/:id', getOrderById)
router.patch('/:id/status', updateOrderStatus)

export default router
