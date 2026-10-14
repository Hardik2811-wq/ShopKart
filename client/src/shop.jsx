import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { api } from './api'
import { useAuth } from './auth'
import { useCart } from './cart'

const rupees = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
const requestMessage = (error, fallback) => error.response?.data?.message || fallback

export const Navbar = () => {
  const { logout } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const leave = async () => { await logout(); navigate('/login') }
  return (
    <header className="navbar-wrap">
      <div className="navbar">
        <Link className="brand" to="/products">
          <span className="brand-mark">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </span>
          <span>ShopKart</span>
        </Link>
        <nav>
          <NavLink to="/products">Catalog</NavLink>
          <NavLink to="/wishlist">Wishlist</NavLink>
          <NavLink to="/cart">
            Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <button className="nav-button" onClick={leave}>Exit</button>
        </nav>
      </div>
    </header>
  )
}

const Page = ({ children }) => <main className="shop-shell"><Navbar />{children}</main>
const State = ({ title, body, action, onAction, to }) => (
  <div className="state">
    <h2>{title}</h2>
    {body && <p>{body}</p>}
    {to ? <Link className="button" to={to}>{action}</Link> : <button onClick={onAction}>{action}</button>}
  </div>
)

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const [addingCart, setAddingCart] = useState(false)
  const [addingWishlist, setAddingWishlist] = useState(false)
  const [wishState, setWishState] = useState('')
  const [error, setError] = useState('')

  const addWishlist = async () => {
    setAddingWishlist(true); setError('')
    try { 
      await api.post(`/wishlist/${product._id}`)
      setWishState('Saved') 
    } catch (requestError) { 
      setError(requestMessage(requestError, 'Unable to save product.')) 
    } finally { 
      setAddingWishlist(false) 
    }
  }

  const add = async () => {
    setAddingCart(true); setError('')
    const result = await addToCart(product._id)
    if (!result.ok) setError(result.message)
    setAddingCart(false)
  }

  return (
    <article className="product-card">
      <div className="card-img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
      </div>
      <div className="card-body">
        <p className="eyebrow">{product.category}</p>
        <h2>{product.name}</h2>
        <div className="price-row">
          <span className="price">{rupees(product.price)}</span>
          <span className={product.stock ? 'stock' : 'stock sold-out'}>
            {product.stock ? `${product.stock} units` : 'Sold out'}
          </span>
        </div>
        <div className="card-actions">
          <Link className="secondary button" to={`/products/${product._id}`}>Details</Link>
          <button 
            className="icon-button" 
            disabled={addingWishlist || wishState === 'Saved'} 
            onClick={addWishlist}
            title="Save to wishlist"
          >
            {addingWishlist ? '...' : wishState ? '✓' : '♡'}
          </button>
          <button 
            className="full-btn" 
            disabled={addingCart || !product.stock} 
            onClick={add}
          >
            {addingCart ? 'Adding...' : 'Add to cart'}
          </button>
        </div>
        {error && <p className="error-banner" style={{ marginTop: '12px' }}>{error}</p>}
      </div>
    </article>
  )
}

export const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category) params.append('category', category)
      if (sort) params.append('sort', sort)
      
      const { data } = await api.get(`/products?${params.toString()}`)
      setProducts(data.products)
    } catch {
      setError('Unable to load collection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { load() }, 300)
    return () => clearTimeout(timer)
  }, [search, category, sort])

  const categories = ['Electronics', 'Home', 'Fashion']

  return (
    <Page>
      <section className="shop-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Autumn / Winter Catalog</p>
            <h1>Curated Essentials.</h1>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            {products.length} {products.length === 1 ? 'object' : 'objects'} available
          </p>
        </div>
        
        <div className="filter-toolbar">
          <div className="search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="search" 
              placeholder="Search design pieces..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Disciplines</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">Chronological</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {loading && <p className="status" style={{ textAlign: 'center', padding: '60px 0' }}>Consulting catalog...</p>}
        {error && <State title={error} action="Retry" onAction={load} />}
        {!loading && !error && products.length === 0 && (
          <State 
            title="No artifacts match" 
            body="Try expanding your search query or reset filter selections." 
            action="Reset Filters" 
            onAction={() => { setSearch(''); setCategory(''); setSort(''); }} 
          />
        )}
        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        )}
      </section>
    </Page>
  )
}

export const Wishlist = () => {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try { 
      const { data } = await api.get('/wishlist')
      setWishlist(data.wishlist) 
    } catch { 
      setError('Unable to load saved collection.') 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { load() }, [])

  const remove = async (productId) => {
    setRemoving(productId)
    try { 
      await api.delete(`/wishlist/${productId}`)
      setWishlist((items) => items.filter((item) => item._id !== productId)) 
    } catch (requestError) { 
      setError(requestMessage(requestError, 'Unable to remove saved product.')) 
    } finally { 
      setRemoving('') 
    }
  }

  return (
    <Page>
      <section className="shop-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Saved for later</p>
            <h1>My Wishlist.</h1>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            {wishlist.length} item{wishlist.length === 1 ? '' : 's'} in wishlist
          </p>
        </div>
        {loading && <p className="status" style={{ textAlign: 'center', padding: '60px 0' }}>Retrieving personal archive...</p>}
        {error && <State title={error} action="Retry" onAction={load} />}
        {!loading && !error && !wishlist.length && (
          <State 
            title="Archive empty" 
            body="Discover artifacts in the catalog and save them for later." 
            action="Explore Catalog" 
            to="/products" 
          />
        )}
        {!loading && !error && Boolean(wishlist.length) && (
          <div className="product-grid">
            {wishlist.map((product) => (
              <article className="product-card" key={product._id}>
                <div className="card-img-wrap">
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="card-body">
                  <p className="eyebrow">{product.category}</p>
                  <h2>{product.name}</h2>
                  <div className="price-row">
                    <span className="price">{rupees(product.price)}</span>
                    <span className="stock">{product.stock} left</span>
                  </div>
                  <div className="card-actions">
                    <Link className="secondary button" to={`/products/${product._id}`}>Inspect</Link>
                    <button 
                      className="danger" 
                      disabled={removing === product._id} 
                      onClick={() => remove(product._id)}
                    >
                      {removing === product._id ? 'Removing...' : 'Discard'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Page>
  )
}

export const Cart = () => {
  const { cartItems, loading, error, refreshCart, updateQuantity, removeFromCart } = useCart()
  const [updating, setUpdating] = useState('')

  const units = cartItems.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0)

  const changeQuantity = async (item, quantity) => { 
    setUpdating(item.product._id)
    await updateQuantity(item.product._id, quantity)
    setUpdating('') 
  }

  const remove = async (item) => { 
    setUpdating(item.product._id)
    await removeFromCart(item.product._id)
    setUpdating('') 
  }

  return (
    <Page>
      <section className="shop-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Acquisition Order</p>
            <h1>Your Cart.</h1>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            {units} item{units === 1 ? '' : 's'} queued
          </p>
        </div>
        {loading && <p className="status" style={{ textAlign: 'center', padding: '60px 0' }}>Syncing order details...</p>}
        {error && <State title={error} action="Refresh Cart" onAction={refreshCart} />}
        {!loading && !error && !cartItems.length && (
          <State 
            title="Cart is empty" 
            body="No items currently queued for acquisition." 
            action="Browse Catalog" 
            to="/products" 
          />
        )}
        {!loading && !error && Boolean(cartItems.length) && (
          <div className="cart-layout">
            <div className="cart-list">
              {cartItems.map((item) => (
                <article className="cart-item" key={item.product._id}>
                  <img src={item.product.image} alt={item.product.name} />
                  <div>
                    <p className="eyebrow">{item.product.category}</p>
                    <h2>{item.product.name}</h2>
                    <p className="price" style={{ fontSize: '1.05rem', margin: '4px 0' }}>{rupees(item.product.price)}</p>
                    <p className="stock" style={{ display: 'inline-block' }}>{item.product.stock} available</p>
                  </div>
                  <div className="quantity-controls">
                    <button 
                      className="secondary" 
                      disabled={updating === item.product._id || item.quantity === 1} 
                      onClick={() => changeQuantity(item, item.quantity - 1)}
                    >−</button>
                    <strong>{item.quantity}</strong>
                    <button 
                      className="secondary" 
                      disabled={updating === item.product._id || item.quantity >= item.product.stock} 
                      onClick={() => changeQuantity(item, item.quantity + 1)}
                    >+</button>
                    <button 
                      className="link-button" 
                      disabled={updating === item.product._id} 
                      onClick={() => remove(item)}
                    >
                      Delete
                    </button>
                  </div>
                  <strong className="line-total">{rupees(item.product.price * item.quantity)}</strong>
                </article>
              ))}
            </div>
            <aside className="summary">
              <p className="eyebrow">Calculated Order</p>
              <h2>Summary</h2>
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Units total</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{units}</strong>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>Complimentary</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <strong>{rupees(subtotal)}</strong>
                </div>
              </div>
              <Link to="/checkout" className="button" style={{ width: '100%', marginTop: '8px' }}>Proceed to Checkout</Link>
            </aside>
          </div>
        )}
      </section>
    </Page>
  )
}

export const ProductDetails = () => {
  const { productId } = useParams()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { 
    api.get(`/products/${productId}`)
      .then(({ data }) => setProduct(data.product))
      .catch((requestError) => setError(requestMessage(requestError, 'Unable to load artifact details.')))
  }, [productId])

  const add = async () => { 
    setSaving(true)
    const result = await addToCart(productId)
    if (!result.ok) setError(result.message)
    setSaving(false) 
  }

  return (
    <Page>
      <section className="shop-page">
        {error && <State title={error} action="Return to Catalog" to="/products" />}
        {!error && !product && <p className="status" style={{ textAlign: 'center', padding: '60px 0' }}>Consulting blueprint...</p>}
        {product && (
          <article className="detail-card">
            <img src={product.image} alt={product.name} />
            <div>
              <p className="eyebrow">{product.category}</p>
              <h1>{product.name}</h1>
              <p className="price">{rupees(product.price)}</p>
              <p className="intro">{product.description}</p>
              <div style={{ marginBottom: '28px' }}>
                <span className={product.stock ? 'stock' : 'stock sold-out'}>
                  {product.stock ? `${product.stock} units currently registered` : 'Out of allocation'}
                </span>
              </div>
              <button disabled={saving || !product.stock} onClick={add}>
                {saving ? 'Registering...' : 'Add to Acquisition Cart'}
              </button>
            </div>
          </article>
        )}
      </section>
    </Page>
  )
}
