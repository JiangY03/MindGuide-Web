import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, loginAnon, register } from '../api/auth'
import BackgroundLayout from '../components/BackgroundLayout'

/**
 * Login Component - User login and registration page
 * Supports email login, anonymous login, and user registration functionality
 */
function Login() {
  const navigate = useNavigate()
  
  // Form state
  const [email, setEmail] = useState('')           // Email input
  const [password, setPassword] = useState('')     // Password input
  const [name, setName] = useState('')             // Name input (used for registration)
  
  // UI state
  const [loading, setLoading] = useState(false)    // Loading state
  const [error, setError] = useState('')           // Error message
  const [showRegister, setShowRegister] = useState(false) // Whether to show registration form

  /**
   * Handle user login
   * @param {Event} e - Form submit event
   */
  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Call login API
      const res = await login(email, password)
      if (res && res.ok) {
        // Login successful, save user info to local storage
        localStorage.setItem('user', JSON.stringify(res.user))
        // Navigate to consent page
        navigate('/consent', { replace: true })
      } else {
        setError(res?.message || 'Login failed')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle anonymous login
   * Allows users to use the app without registration
   */
  async function handleAnon() {
    setError('')
    setLoading(true)
    try {
      // Call anonymous login API
      const res = await loginAnon()
      if (res && res.ok) {
        // Anonymous login successful, save user info to local storage
        localStorage.setItem('user', JSON.stringify(res.user))
        // Navigate to consent page
        navigate('/consent', { replace: true })
      } else {
        setError('Failed to enter')
      }
    } catch (err) {
      setError(err.message || 'Failed to enter')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflow: 'hidden',
      zIndex: 1
    }}>
      {/* CSS animation definitions */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(-8px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes floatCloud {
          0% { transform: translateX(0) translateY(0); }
          33% { transform: translateX(20px) translateY(-10px); }
          66% { transform: translateX(-10px) translateY(5px); }
          100% { transform: translateX(0) translateY(0); }
        }
        input:invalid {
          box-shadow: none;
        }
        input:invalid:focus {
          box-shadow: none;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px rgba(255, 255, 255, 0.8) inset !important;
          -webkit-text-fill-color: #000 !important;
          background-color: rgba(255, 255, 255, 0.8) !important;
        }
      `}</style>
      
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '15%',
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.15)',
        animation: 'pulse 4s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '20%',
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.08)',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        animation: 'pulse 6s ease-in-out infinite'
      }} />
      
      {/* Large Floating Cloud 1 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        fontSize: '300px',
        animation: 'floatCloud 25s ease-in-out infinite',
        zIndex: 0,
        filter: 'drop-shadow(0 8px 16px rgba(255, 255, 255, 0.4))',
        opacity: 0.9
      }}>☁️</div>
      
      {/* Large Floating Cloud 2 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '-15%',
        fontSize: '350px',
        animation: 'floatCloud 30s ease-in-out infinite reverse',
        zIndex: 0,
        filter: 'drop-shadow(0 8px 16px rgba(255, 255, 255, 0.4))',
        opacity: 0.85
      }}>☁️</div>
      
      {/* Large Floating Cloud 3 */}
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '5%',
        fontSize: '280px',
        animation: 'floatCloud 28s ease-in-out infinite',
        zIndex: 0,
        filter: 'drop-shadow(0 8px 16px rgba(255, 255, 255, 0.4))',
        opacity: 0.88
      }}>☁️</div>
      
      {/* Large Floating Cloud 4 */}
      <div style={{
        position: 'absolute',
        top: '30%',
        right: '10%',
        fontSize: '320px',
        animation: 'floatCloud 32s ease-in-out infinite reverse',
        zIndex: 0,
        filter: 'drop-shadow(0 8px 16px rgba(255, 255, 255, 0.4))',
        opacity: 0.87
      }}>☁️</div>
      
      <div style={{ 
        maxWidth: 420, 
        width: '100%',
        margin: '0 auto', 
        position: 'relative', 
        zIndex: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '24px',
        padding: '40px',
        transition: 'all 0.3s ease',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}
>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '2rem', 
            fontWeight: 700, 
            color: '#111827',
            letterSpacing: '-0.02em',
            lineHeight: '1.2'
          }}>
            {showRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#6b7280', 
            fontSize: '0.9375rem',
            fontWeight: 400,
            lineHeight: '1.5'
          }}>
            {showRegister ? 'Join our mental health support community' : 'Sign in to continue your wellness journey'}
          </p>
        </div>
      {error ? (
        <div style={{ 
          color: '#991b1b', 
          backgroundColor: '#fef2f2',
          border: '1.5px solid #fecaca',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '24px',
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: '1.5',
          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.08)'
        }}>
          {error}
        </div>
      ) : null}
      {!showRegister ? (
      <form onSubmit={handleLogin}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textAlign: 'left' }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%',
                padding: '14px 18px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: '#fafafa',
                color: '#111827'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.backgroundColor = '#fafafa'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textAlign: 'left' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%',
                padding: '14px 18px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: '#fafafa',
                color: '#111827'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.backgroundColor = '#fafafa'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              width: '100%',
              padding: '16px 24px',
              background: loading ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: loading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.25)',
              letterSpacing: '0.01em'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)'
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </div>
      </form>
      ) : (
      <form onSubmit={async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
          const res = await register(name, email, password)
          if (res && res.ok) {
            // auto login after register
            const loginRes = await login(email, password)
            if (loginRes && loginRes.ok) {
              localStorage.setItem('user', JSON.stringify(loginRes.user))
              navigate('/consent', { replace: true })
            } else {
              setShowRegister(false)
            }
          } else {
            setError(res?.message || 'Registration failed')
          }
        } catch (err) {
          setError(err.message || 'Registration failed')
        } finally {
          setLoading(false)
        }
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textAlign: 'left' }}>
              Display Name
            </label>
            <input
              type="text"
              placeholder="Enter your preferred name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ 
                width: '100%',
                padding: '14px 18px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: '#fafafa',
                color: '#111827'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.backgroundColor = '#fafafa'
                e.target.style.boxShadow = 'none'
              }}
            />
            <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>
              This will be shown in your profile
            </small>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textAlign: 'left' }}>
              Email Address *
            </label>
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%',
                padding: '14px 18px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: '#fafafa',
                color: '#111827'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.backgroundColor = '#fafafa'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textAlign: 'left' }}>
              Password *
            </label>
            <input
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%',
                padding: '14px 18px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: '#fafafa',
                color: '#111827'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.backgroundColor = '#fafafa'
                e.target.style.boxShadow = 'none'
              }}
            />
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Password strength:</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    style={{
                      height: 4,
                      flex: 1,
                      backgroundColor: password.length >= level * 3 ? 
                        (level <= 2 ? '#ef4444' : level === 3 ? '#f59e0b' : '#10b981') : '#e5e7eb',
                      borderRadius: 2,
                      transition: 'background-color 0.2s'
                    }}
                  />
                ))}
              </div>
              <small style={{ color: '#6b7280', fontSize: 12, marginTop: 4, display: 'block' }}>
                {password.length < 6 ? 'At least 6 characters recommended' : 
                 password.length < 8 ? 'Good' : 'Strong password'}
              </small>
            </div>
          </div>

          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '12px', 
            border: '1.5px solid #e2e8f0',
            fontSize: '0.8125rem',
            color: '#475569',
            lineHeight: '1.6'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#334155' }}>By registering, you agree to:</div>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
              <li>Use this service for mental health support only</li>
              <li>Keep your data private and secure</li>
              <li>Seek professional help for serious concerns</li>
            </ul>
          </div>

          <button 
            type="submit" 
            disabled={loading || !email || !password} 
            style={{ 
              width: '100%',
              padding: '16px 24px',
              background: loading || !email || !password ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: loading || !email || !password ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.25)',
              letterSpacing: '0.01em'
            }}
            onMouseEnter={(e) => {
              if (!loading && email && password) {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && email && password) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)'
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Creating Account...
              </>
            ) : (
              'Create Account & Continue'
            )}
          </button>
        </div>
      </form>
      )}

      <div style={{ height: '20px' }} />

      <button 
        onClick={handleAnon} 
        disabled={loading} 
        style={{ 
          width: '100%',
          padding: '14px 24px',
          backgroundColor: 'transparent',
          color: '#6b7280',
          border: '1.5px solid #e5e7eb',
          borderRadius: '12px',
          fontSize: '0.9375rem',
          fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: '#fafafa'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.target.style.borderColor = '#d1d5db'
            e.target.style.backgroundColor = '#f5f5f5'
            e.target.style.transform = 'translateY(-1px)'
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.target.style.borderColor = '#e5e7eb'
            e.target.style.backgroundColor = '#fafafa'
            e.target.style.transform = 'translateY(0)'
          }
        }}
      >
        {loading ? (
          <>
            <div style={{
              width: 16,
              height: 16,
              border: '2px solid transparent',
              borderTop: '2px solid #6b7280',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Entering...
          </>
        ) : (
          'Continue Anonymously'
        )}
      </button>

      <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
        <button 
          type="button" 
          onClick={() => setShowRegister((s) => !s)} 
          style={{ 
            padding: '8px 12px',
            backgroundColor: 'transparent',
            color: '#3b82f6',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            borderRadius: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#2563eb'
            e.target.style.backgroundColor = '#eff6ff'
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#3b82f6'
            e.target.style.backgroundColor = 'transparent'
          }}
        >
          {showRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>
      </div>
      </div>
    </div>
  )
}

export default Login


