import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackgroundLayout from '../components/BackgroundLayout'

function Result() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [showCrisis, setShowCrisis] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lastAssessment')
      if (raw) {
        const parsed = JSON.parse(raw)
        setData(parsed)
        const level = parsed.level || 'unknown'
        const recommendations = parsed.ai?.recommendations || []
        localStorage.setItem('aiContext', JSON.stringify({ level, recommendations }))

        const risky = Boolean(parsed.crisis) || String(parsed.ai?.risk_level || '').toLowerCase() === 'high'
        if (risky) setShowCrisis(true)
      }
    } catch {}
  }, [])

  const total = data?.total ?? 0
  const level = data?.level ?? 'unknown'
  const summary = data?.ai?.summary ?? 'No summary yet'
  const recs = Array.isArray(data?.ai?.recommendations) ? data.ai.recommendations : []
  const risky = Boolean(data?.crisis) || String(data?.ai?.risk_level || '').toLowerCase() === 'high'

  function handleStart() {
    navigate('/dashboard', { replace: true })
  }

  return (
    <BackgroundLayout title="Assessment Results" subtitle="Your mental health assessment summary">
      <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
      {!data ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'left', padding: '3rem' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              fontSize: '24px'
            }}>
              📋
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>No Assessment Data</h3>
            <p style={{ margin: '0', color: '#6b7280' }}>Please complete an assessment first to view your results.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Assessment results card */}
          <div className="card">
            <div className="card-header" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: total <= 4 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                              total <= 9 ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' :
                              total <= 14 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                              'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  {total}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: '0', fontSize: '1.25rem', color: '#111827', textAlign: 'left' }}>Assessment Score</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.875rem', textAlign: 'left' }}>
                    Severity Level: <span style={{ 
                      color: total <= 4 ? '#059669' : total <= 9 ? '#2563eb' : total <= 14 ? '#d97706' : '#dc2626',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>{level}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="card-body" style={{ textAlign: 'left' }}>
              <div style={{ 
                background: total <= 4 ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' :
                            total <= 9 ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' :
                            total <= 14 ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' :
                            'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: total <= 4 ? '1px solid #bbf7d0' :
                       total <= 9 ? '1px solid #93c5fd' :
                       total <= 14 ? '1px solid #fde68a' :
                       '1px solid #fecaca',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                <p style={{ 
                  margin: '0', 
                  fontSize: '1rem', 
                  lineHeight: '1.6',
                  color: total <= 4 ? '#166534' : total <= 9 ? '#1e40af' : total <= 14 ? '#92400e' : '#991b1b',
                  textAlign: 'left'
                }}>
                  {total <= 4 ? 'Your assessment shows minimal symptoms. Continue monitoring your mental health.' :
                   total <= 9 ? 'Your assessment indicates mild symptoms. Consider self-care strategies.' :
                   total <= 14 ? 'Your assessment shows moderate symptoms. Professional support may be beneficial.' :
                   'Your assessment indicates severe symptoms. Please seek professional help immediately.'}
                </p>
              </div>
            </div>
          </div>

          {/* AI summary card */}
          <div className="card">
            <div className="card-header" style={{ textAlign: 'left' }}>
              <h4 style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                🤖 AI Analysis
              </h4>
            </div>
            <div className="card-body" style={{ textAlign: 'left' }}>
              <div style={{ 
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'left'
              }}>
                <p style={{ 
                  margin: '0', 
                  fontSize: '0.875rem', 
                  lineHeight: '1.6',
                  color: '#475569',
                  textAlign: 'left'
                }}>
                  {summary || 'AI analysis is being processed. Please check back later.'}
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations card */}
          <div className="card">
            <div className="card-header" style={{ textAlign: 'left' }}>
              <h4 style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                💡 Recommendations
              </h4>
            </div>
            <div className="card-body" style={{ textAlign: 'left' }}>
            {recs.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recs.map((r, i) => (
                    <div key={i} style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '12px',
                      padding: '12px 16px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: '#14b8a6',
                        marginTop: '6px',
                        flexShrink: 0
                      }}></div>
                      <span style={{ fontSize: '0.875rem', lineHeight: '1.5', color: '#374151', textAlign: 'left' }}>{r}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'left', 
                  padding: '2rem',
                  color: '#6b7280'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>💭</div>
                  <p style={{ margin: '0' }}>No specific recommendations available at this time.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <button 
              onClick={handleStart} 
              className="btn-primary btn-lg"
              style={{ 
                minWidth: '200px',
                opacity: (risky && !acknowledged) ? 0.5 : 1,
                cursor: (risky && !acknowledged) ? 'not-allowed' : 'pointer'
              }}
              disabled={risky && !acknowledged}
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}

      {showCrisis ? (
        <div className="modal-overlay" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0, 0, 0, 0.5)', 
          backdropFilter: 'blur(4px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="modal-content" style={{ 
            maxWidth: '1000px', 
            width: '95%', 
            maxHeight: '95vh',
            overflowY: 'auto',
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              padding: '28px 32px',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              borderBottom: '2px solid #fecaca'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '28px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  flexShrink: 0
                }}>
                  ⚠️
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ 
                    margin: 0, 
                    color: '#dc2626', 
                    fontSize: '1.75rem', 
                    fontWeight: '700',
                    lineHeight: '1.3',
                    letterSpacing: '-0.01em'
                  }}>
                    Important Notice
                  </h2>
                  <p style={{ 
                    margin: '6px 0 0 0', 
                    color: '#7f1d1d', 
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}>
                    Your safety is our top priority
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ padding: '28px', flex: 1, overflowY: 'auto' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
                border: '1.5px solid #fecaca',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <h3 style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '1.125rem', 
                  color: '#7f1d1d',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>🚨</span>
                  <span>Higher Risk Detected</span>
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.9375rem', 
                  lineHeight: '1.5',
                  color: '#991b1b',
                  fontWeight: '400'
                }}>
                  Your assessment results indicate a higher risk level. Please prioritize contacting professional support immediately.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ 
                  margin: '0 0 16px 0', 
                  color: '#111827', 
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>🆘</span>
                  <span>Emergency Resources</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-start', 
                    gap: '12px',
                    padding: '18px',
                    background: '#fafafa',
                    borderRadius: '12px',
                    border: '1.5px solid #e5e7eb',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%'
                    }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: '#ef4444',
                        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.15)',
                        flexShrink: 0
                      }}></div>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '1rem', 
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        Crisis Hotline
                      </h4>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      lineHeight: '1.4',
                      paddingLeft: '22px'
                    }}>
                      Contact your local crisis support services immediately
                    </p>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-start', 
                    gap: '12px',
                    padding: '18px',
                    background: '#fafafa',
                    borderRadius: '12px',
                    border: '1.5px solid #e5e7eb'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%'
                    }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: '#f59e0b',
                        boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.15)',
                        flexShrink: 0
                      }}></div>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '1rem', 
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        Emergency Services
                      </h4>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      lineHeight: '1.4',
                      paddingLeft: '22px'
                    }}>
                      Call 911 or your local emergency number
                    </p>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-start', 
                    gap: '12px',
                    padding: '18px',
                    background: '#fafafa',
                    borderRadius: '12px',
                    border: '1.5px solid #e5e7eb'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%'
                    }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: '#3b82f6',
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.15)',
                        flexShrink: 0
                      }}></div>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '1rem', 
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        Campus Counseling
                      </h4>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      lineHeight: '1.4',
                      paddingLeft: '22px'
                    }}>
                      Reach your campus mental health services
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ 
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '1.5px solid #bae6fd',
                borderRadius: '12px',
                padding: '18px',
                marginBottom: 0,
                textAlign: 'left'
              }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '1rem', 
                  color: '#0c4a6e',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>💡</span>
                  <span>Important Note</span>
                </h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.875rem', 
                  color: '#075985',
                  lineHeight: '1.5',
                  fontWeight: '400'
                }}>
                  For your safety, some features may be temporarily limited. 
                  Please use Self-help Tools or speak with trusted friends, family, or professionals.
                </p>
              </div>
            </div>
            
            <div style={{ 
              padding: '20px 32px',
              background: '#fafafa',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
              borderTop: '1px solid #e5e7eb',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => {
                    setAcknowledged(true)
                    setShowCrisis(false)
                  }} 
                  className="btn-primary"
                  style={{ 
                    width: '100%',
                    maxWidth: '400px',
                    padding: '14px 28px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)'
                    e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  ✅ I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </BackgroundLayout>
  )
}

export default Result


