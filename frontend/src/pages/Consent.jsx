import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackgroundLayout from '../components/BackgroundLayout'

function Consent() {
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)

  function handleContinue() {
    if (!agreed) return
    try {
      localStorage.setItem('consent', 'true')
    } catch {}
    navigate('/assessment', { replace: true })
  }

  return (
    <BackgroundLayout>
      <div style={{ 
        maxWidth: 'fit-content', 
        margin: '0 auto', 
        lineHeight: 1.6,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(25px)',
        borderRadius: '24px',
        padding: '40px 48px',
        boxShadow: '0 32px 64px rgba(0, 0, 0, 0.25), 0 16px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s ease',
        transform: 'translateY(-8px)',
        position: 'relative',
        zIndex: 2
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-12px) scale(1.02)'
        e.target.style.boxShadow = '0 40px 80px rgba(0, 0, 0, 0.3), 0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 0 20px rgba(103, 126, 234, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(-8px) scale(1)'
        e.target.style.boxShadow = '0 32px 64px rgba(0, 0, 0, 0.25), 0 16px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
      }}>
        <h1 style={{ 
          margin: '0 0 8px 0', 
          fontSize: 28, 
          fontWeight: 700, 
          color: '#000000',
          textAlign: 'left'
        }}>
          Informed Consent
        </h1>
        <p style={{ 
          margin: '0 0 24px 0', 
          color: '#333333', 
          fontSize: 16,
          fontWeight: 600,
          textAlign: 'left'
        }}>
          Please read and agree to continue
        </p>
        <p style={{ textAlign: 'left' }}>
          This app provides supportive information and self-help tools for mental wellbeing. It is not a medical diagnosis or treatment.
          We follow a privacy-minimization principle and store necessary data locally only, unless you explicitly choose to share.
        </p>
        <p style={{ textAlign: 'left' }}>
          If you are in immediate crisis or at risk of harming yourself/others, please contact your local emergency services or a crisis hotline.
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, textAlign: 'left', justifyContent: 'flex-start' }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span style={{ textAlign: 'left' }}>I have read and agree to the above</span>
        </label>

        <div style={{ height: 12 }} />

        <div style={{ textAlign: 'left' }}>
          <button 
            onClick={handleContinue} 
            disabled={!agreed} 
            style={{ 
              padding: '12px 24px',
              backgroundColor: !agreed ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: !agreed ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </BackgroundLayout>
  )
}

export default Consent


