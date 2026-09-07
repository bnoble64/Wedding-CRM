import { useState } from 'react'
import { supabase, configError } from '../lib/supabase.js'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function signInEmail(e) {
    e.preventDefault()
    setBusy(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }

  async function signInGoogle() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <p className="auth-eyebrow">Wedding HQ</p>
        <h1 className="display auth-title">Brandon &amp; Courtney</h1>
        <p className="auth-sub">Sign in to pick up where you left off.</p>

        {configError && <div className="notice notice-error">{configError}</div>}
        {error && <div className="notice notice-error">{error}</div>}

        <form onSubmit={signInEmail} className="auth-form">
          <label>Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label>Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>
          <button className="btn btn-primary" disabled={busy || !!configError}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button className="btn btn-ghost" onClick={signInGoogle} disabled={!!configError}>
          Continue with Google
        </button>
        <p className="auth-foot">Google works only once you have enabled it in Supabase.</p>
      </div>
    </div>
  )
}
