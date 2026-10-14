import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import cartRoutes from './routes/cart.routes.js'
import customerRoutes from './routes/customer.routes.js'
import orderRoutes from './routes/order.routes.js'
import productRoutes from './routes/product.routes.js'
import wishlistRoutes from './routes/wishlist.routes.js'
import { seedProducts } from './seedProducts.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 8089

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use('/customers', customerRoutes)
app.use('/products', productRoutes)
app.use('/wishlist', wishlistRoutes)
app.use('/cart', cartRoutes)
app.use('/orders', orderRoutes)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

const startServer = async () => {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error('MONGODB_URI and JWT_SECRET must be set in server/.env')
  }

  await mongoose.connect(process.env.MONGODB_URI)
  await seedProducts()
  console.log('MongoDB connected')
  app.listen(port, () => console.log(`Server running at http://localhost:${port}`))
}

startServer().catch((error) => {
  console.error('Server could not start:', error.message)
  process.exit(1)
})
