import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from './api'
import { useAuth } from './auth'

const AuthForm = ({ mode }) => {
  const isSignup = mode === 'signup'
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { data } = await api.post(`/customers/${isSignup ? 'register' : 'login'}`, isSignup ? form : { email: form.email, password: form.password })
      setUser(data.customer)
      navigate(isSignup ? '/login' : '/home')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Authentication error. Verify credentials.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="panel auth-panel">
        <div className="brand" style={{ marginBottom: '24px' }}>
          <span className="brand-mark">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </span>
          <span>ShopKart</span>
        </div>
        <p className="eyebrow">{isSignup ? 'Registration' : 'Access Key'}</p>
        <h1 style={{ fontSize: '2.4rem' }}>{isSignup ? 'Create account' : 'Welcome back'}</h1>
        <p className="intro" style={{ margin: '8px 0 24px', fontSize: '0.92rem' }}>
          {isSignup ? 'Setup customer credentials to manage your cart and orders.' : 'Sign in to access your personal collection.'}
        </p>

        <form onSubmit={submit}>
          {isSignup && (
            <>
              <label>Full name<input required placeholder="Alex Vance" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
              <label>Phone number<input required placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            </>
          )}
          <label>Email<input required type="email" placeholder="alex@domain.io" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input required minLength="6" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="error-banner">{error}</p>}
          <button disabled={saving} style={{ marginTop: '12px' }}>
            {saving ? 'Validating...' : isSignup ? 'Create Account' : 'Authenticate'}
          </button>
        </form>
        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.86rem' }}>
          {isSignup ? 'Existing client?' : 'Need registration?'} <Link to={isSignup ? '/login' : '/signup'} style={{ color: 'var(--text-high)', fontWeight: '600', marginLeft: '6px' }}>{isSignup ? 'Sign in' : 'Register'}</Link>
        </p>
      </section>
    </main>
  )
}

export const Landing = () => (
  <main className="app-shell">
    <section className="panel landing-panel" style={{ maxWidth: '620px', padding: '56px 48px' }}>
      <div className="brand" style={{ marginBottom: '28px' }}>
        <span className="brand-mark">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </span>
        <span>ShopKart Studio</span>
      </div>
      <p className="eyebrow">Design Hardware & Everyday Artifacts</p>
      <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', marginBottom: '14px' }}>Essential Form.<br />Elevated Utility.</h1>
      <p className="intro" style={{ marginBottom: '36px' }}>
        Direct-to-consumer curation of precision tactile accessories, acoustics, and workspace essentials.
      </p>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <Link className="button" to="/register">Create Client Account</Link>
        <Link className="secondary button" to="/login">Sign In</Link>
      </div>
    </section>
  </main>
)

export const Signup = () => <AuthForm mode="signup" />
export const Login = () => <AuthForm mode="login" />

