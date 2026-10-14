import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api'
import { useAuth } from './auth'

const CartContext = createContext(null)
const messageFor = (error, fallback) => error.response?.data?.message || fallback

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refreshCart = useCallback(async () => {
    if (!user) { setCartItems([]); setError(''); return }
    setLoading(true); setError('')
    try { const { data } = await api.get('/cart'); setCartItems(data.cart) } catch (requestError) { setError(messageFor(requestError, 'Unable to load cart.')) } finally { setLoading(false) }
  }, [user])

  useEffect(() => { refreshCart() }, [refreshCart])

  const mutate = async (request, fallback) => {
    setError('')
    try { const { data } = await request(); setCartItems(data.cart); return { ok: true, message: data.message } } catch (requestError) { const message = messageFor(requestError, fallback); setError(message); return { ok: false, message } }
  }

  const addToCart = (productId) => mutate(() => api.post(`/cart/${productId}`), 'Unable to add product to cart.')
  const updateQuantity = (productId, quantity) => mutate(() => api.patch(`/cart/${productId}`, { quantity }), 'Unable to update quantity.')
  const removeFromCart = (productId) => mutate(() => api.delete(`/cart/${productId}`), 'Unable to remove product from cart.')
  const clearCart = () => { setCartItems([]); setError('') }
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  return <CartContext.Provider value={{ cartItems, cartCount, loading, error, refreshCart, addToCart, updateQuantity, removeFromCart, clearCart }}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
