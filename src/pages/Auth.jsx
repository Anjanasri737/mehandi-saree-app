import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordRules = [
    { test: (pw) => pw.length >= 8, label: 'At least 8 characters' },
    { test: (pw) => /[0-9]/.test(pw), label: 'At least 1 number' },
    { test: (pw) => /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(pw), label: 'At least 1 special character' },
  ]

  const passwordIsValid = passwordRules.every((rule) => rule.test(password))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (mode === 'register' && !passwordIsValid) {
      setError('Please meet all password requirements below.')
      return
    }

    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        setMessage('Logged in successfully!')
      }
    } else {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message)
      } else {
        setMessage('Account created! Check your email to confirm, then log in.')
      }
    }

    setLoading(false)
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h2>{mode === 'login' ? 'Login' : 'Create an Account'}</h2>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ?  '🙈' : '👁️'}
              </button>
            </div>
          </label>

          {mode === 'register' && (
            <ul className="password-rules">
              {passwordRules.map((rule) => (
                <li key={rule.label} className={rule.test(password) ? 'rule-met' : 'rule-unmet'}>
                  {rule.test(password) ? '✓' : '○'} {rule.label}
                </li>
              ))}
            </ul>
          )}

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <button
          className="auth-toggle"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError('')
            setMessage('')
          }}
        >
          {mode === 'login'
            ? "Don't have an account? Register"
            : 'Already have an account? Login'}
        </button>
      </div>
    </section>
  )
}

export default Auth