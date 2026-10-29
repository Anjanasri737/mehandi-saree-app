import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Login.css'

// Buttons only work once the provider is set up in Supabase.
// Set these in .env (and in Vercel) to "true" when ready.
const GOOGLE_ON = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === 'true'
const APPLE_ON = import.meta.env.VITE_ENABLE_APPLE_LOGIN === 'true'

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

const AppleLogo = () => (
  <svg width="18" height="20" viewBox="0 0 384 512" aria-hidden="true" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
)

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

function PasswordField({ value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="lg-pw">
      <input
        className="lg-input"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        className="lg-eye"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}

function friendlyError(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email or password is incorrect.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'This email already has an account. Please log in instead.'
  if (m.includes('not confirmed'))
    return 'This account was never confirmed. Please use "Forgot password" to set a new password.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many attempts. Please wait a few minutes and try again.'
  if (m.includes('provider is not enabled') || m.includes('unsupported provider'))
    return 'This sign-in method is not set up yet.'
  if (m.includes('password should be')) return 'Password must be at least 8 characters.'
  return 'Something went wrong. Please try again.'
}

function Auth() {
  const { signIn, signUp, signInWithProvider, resetPassword, updatePassword, recovering } = useAuth()

  const [step, setStep] = useState('email') // 'email' | 'password' | 'forgot'
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const clear = () => {
    setError('')
    setSuccess('')
  }

  const goEmail = (e) => {
    e.preventDefault()
    clear()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    setStep('password')
  }

  const submitPassword = async (e) => {
    e.preventDefault()
    clear()
    const cleanEmail = email.trim().toLowerCase()

    if (mode === 'signup') {
      if (password.length < 8) return setError('Password must be at least 8 characters.')
      if (password !== confirm) return setError('Passwords do not match.')
    }

    setBusy(true)
    if (mode === 'login') {
      const { error: err } = await signIn(cleanEmail, password)
      if (err) setError(friendlyError(err.message))
      // On success AuthContext updates and the app moves on by itself.
    } else {
      const { data, error: err } = await signUp(cleanEmail, password)
      if (err) {
        setError(friendlyError(err.message))
      } else if (data?.user && data.user.identities?.length === 0) {
        setError('This email already has an account. Please log in instead.')
      } else if (!data?.session) {
        setError(
          'Your account was created but Supabase still requires email confirmation. Turn off "Confirm email" in Supabase → Authentication → Sign In / Providers → Email.'
        )
      } else {
        setSuccess('Account created. Welcome!')
      }
    }
    setBusy(false)
  }

  const submitForgot = async (e) => {
    e.preventDefault()
    clear()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.')
    setBusy(true)
    const { error: err } = await resetPassword(email.trim().toLowerCase())
    setBusy(false)
    if (err) setError(friendlyError(err.message))
    else setSuccess('If an account exists for this email, a password reset link has been sent.')
  }

  const submitNewPassword = async (e) => {
    e.preventDefault()
    clear()
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    const { error: err } = await updatePassword(password)
    setBusy(false)
    if (err) setError(friendlyError(err.message))
  }

  const social = async (provider, enabled) => {
    clear()
    if (!enabled) return
    const { error: err } = await signInWithProvider(provider)
    if (err) setError(friendlyError(err.message))
  }

  return (
    <main className="lg-page">
      <div className="lg-wrap">
        <h1 className="lg-title">{recovering ? 'New password' : "What's next?"}</h1>
        <p className="lg-sub">
          {recovering
            ? 'Choose a new password for your account'
            : 'Book your Mehandi & Saree Pre-Pleating in a few taps'}
        </p>

        <div className="lg-card">
          {error && <p className="lg-msg lg-err" role="alert">{error}</p>}
          {success && <p className="lg-msg lg-ok" role="status">{success}</p>}

          {recovering ? (
            <form onSubmit={submitNewPassword} className="lg-form">
              <PasswordField placeholder="New password" value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <PasswordField placeholder="Confirm new password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
              <button className="lg-primary" disabled={busy}>{busy ? 'Saving...' : 'Save new password'}</button>
            </form>
          ) : (
            <>
              {step === 'email' && (
                <>
                  <button type="button" className={`lg-social ${GOOGLE_ON ? '' : 'lg-off'}`}
                    onClick={() => social('google', GOOGLE_ON)} aria-disabled={!GOOGLE_ON}
                    title={GOOGLE_ON ? '' : 'Google sign-in is not set up yet'}>
                    <GoogleLogo /> Continue with Google
                    {!GOOGLE_ON && <small>Coming soon</small>}
                  </button>
                  <button type="button" className={`lg-social ${APPLE_ON ? '' : 'lg-off'}`}
                    onClick={() => social('apple', APPLE_ON)} aria-disabled={!APPLE_ON}
                    title={APPLE_ON ? '' : 'Apple sign-in is not set up yet'}>
                    <AppleLogo /> Continue with Apple
                    {!APPLE_ON && <small>Coming soon</small>}
                  </button>

                  <div className="lg-or"><span>OR</span></div>

                  <form onSubmit={goEmail} className="lg-form">
                    <input className="lg-input" type="email" placeholder="Enter your email" value={email}
                      onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                    <button className="lg-primary">Continue with email</button>
                  </form>
                </>
              )}

              {step === 'password' && (
                <form onSubmit={submitPassword} className="lg-form">
                    <p className="lg-who">{email}</p>
                      <PasswordField
                            placeholder={mode === 'login' ? 'Enter your password' : 'Create a password (8+ characters)'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        />
                {mode === 'signup' && (
                        <PasswordField
                              placeholder="Confirm password"
                              value={confirm}
                              onChange={(e) => setConfirm(e.target.value)}
                              autoComplete="new-password"
                        />
                )}
                
                  <button className="lg-primary" disabled={busy}>
                    {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
                  </button>
                  <div className="lg-links">
                    <button type="button" onClick={() => { clear(); setMode(mode === 'login' ? 'signup' : 'login') }}>
                      {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
                    </button>
                    {mode === 'login' && (
                      <button type="button" onClick={() => { clear(); setStep('forgot') }}>Forgot password?</button>
                    )}
                    <button type="button" onClick={() => { clear(); setPassword(''); setConfirm(''); setStep('email') }}>
                      ← Use a different email
                    </button>
                  </div>
                </form>
              )}

              {step === 'forgot' && (
                <form onSubmit={submitForgot} className="lg-form">
                  <p className="lg-who">We will email you a link to reset your password.</p>
                  <input className="lg-input" type="email" placeholder="Enter your email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required />
                  <button className="lg-primary" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</button>
                  <div className="lg-links">
                    <button type="button" onClick={() => { clear(); setStep('password') }}>← Back to log in</button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        <a href="#home" className="lg-home">← Back to Home</a>
      </div>
    </main>
  )
}

export default Auth