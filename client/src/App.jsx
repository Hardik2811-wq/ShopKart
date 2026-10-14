import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from './guards'
import { Landing, Login, Signup } from './pages'
import { Checkout, OrderDetails, Orders, OrderSuccess } from './orders'
import { Cart, ProductDetails, Products, Wishlist } from './shop'

export default function App() {
  return <Routes>
    <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Signup /></PublicRoute>} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/home" element={<ProtectedRoute><Products /></ProtectedRoute>} />
    <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
    <Route path="/products/:productId" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
    <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
    <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
    <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
    <Route path="/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
    <Route path="*" element={<Landing />} />
  </Routes>
}
