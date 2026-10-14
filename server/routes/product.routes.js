import { Router } from 'express'
import { getProduct, getProducts } from '../controllers/product.controller.js'

const router = Router()

router.get('/', getProducts)
router.get('/:productId', getProduct)

export default router
