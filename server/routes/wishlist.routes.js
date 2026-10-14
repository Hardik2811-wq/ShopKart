import { Router } from 'express'
import { addWishlistItem, getWishlist, removeWishlistItem } from '../controllers/wishlist.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(requireAuth)
router.get('/', getWishlist)
router.post('/:productId', addWishlistItem)
router.delete('/:productId', removeWishlistItem)

export default router
