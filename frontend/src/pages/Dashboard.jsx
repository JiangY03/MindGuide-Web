import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { fetchMoods } from '../api/moods'
import BackgroundLayout from '../components/BackgroundLayout'

function daysUntil(dateStr) {
  const now = new Date()
  const target = new Date(dateStr)
  const diff = Math.ceil((target.setHours(0,0,0,0) - now.setHours(0,0,0,0)) / 86400000)
  return diff
}

function Dashboard() {
  const navigate = useNavigate()
  const [moods, setMoods] = useState([])
  const [recs, setRecs] = useState([])
  const [lastAt, setLastAt] = useState(null)

  useEffect(() => {
    fetchMoods(7).then((res) => {
      if (res && res.ok) setMoods(res.data || [])
    }).catch(() => {})

    try {
      const raw = localStorage.getItem('lastAssessment')
      if (raw) {
        const parsed = JSON.parse(raw)
        setLastAt(parsed.at || new Date().toISOString())
        const aictx = JSON.parse(localStorage.getItem('aiContext') || '{}')
        setRecs(Array.isArray(aictx.recommendations) ? aictx.recommendations : (parsed.ai?.recommendations || []))
      }
    } catch {}
  }, [])

  const retestDays = useMemo(() => {
    const from = lastAt ? new Date(lastAt) : new Date()
    const target = new Date(from)
    target.setDate(from.getDate() + 14)
    return daysUntil(target.toISOString())
  }, [lastAt])

  const handleLogout = () => {
    // Clear local storage user data
    localStorage.removeItem('user')
    localStorage.removeItem('lastAssessment')
    localStorage.removeItem('aiContext')
    
    // Redirect to login page
    navigate('/login')
  }

  return (
    <BackgroundLayout title="Dashboard" subtitle="Your mental health overview">
      {/* Logout button - softer style */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
        <button 
          onClick={handleLogout}
          style={{ 
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            color: '#6b7280',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 1)'
            e.target.style.color = '#374151'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.9)'
            e.target.style.color = '#6b7280'
          }}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, textAlign: 'left', padding: '0 8px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Mood Trends Card - softer colors */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(229, 231, 235, 0.5)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ padding: '20px 24px 16px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600', color: '#374151' }}>
            <span style={{ fontSize: '20px' }}>📈</span>
            <span>Mood Trends (7 days)</span>
          </h3>
        </div>
        <div style={{ padding: '24px' }}>
          {moods && moods.length > 0 ? (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={moods} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" hide={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis domain={[0, 5]} allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#60a5fa" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, fill: '#60a5fa', stroke: 'white', strokeWidth: 2 }} 
                    activeDot={{ r: 6, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'left', 
              padding: '2rem 0',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', lineHeight: '1.6', color: '#4b5563' }}>
                Start tracking your mood to see trends over time.
              </p>
              <button 
                onClick={() => navigate('/mood')} 
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)'
                }}
              >
                Record Mood →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Card - simplified list style */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(229, 231, 235, 0.5)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ padding: '20px 24px 16px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600', color: '#374151' }}>
            <span style={{ fontSize: '20px' }}>💡</span>
            <span>Recommendations</span>
          </h3>
        </div>
        <div style={{ padding: '24px' }}>
          {recs && recs.length ? (
            <ul style={{ 
              margin: 0, 
              padding: 0, 
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {recs.map((r, i) => (
                <li key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  color: '#4b5563',
                  paddingLeft: '0'
                }}>
                  <span style={{ 
                    color: '#60a5fa',
                    fontSize: '0.75rem',
                    marginTop: '6px',
                    flexShrink: 0
                  }}>•</span>
                  <span style={{ flex: 1 }}>{r}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ 
              textAlign: 'left', 
              padding: '1rem 0',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>💭</div>
              <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.6', color: '#9ca3af' }}>
                Complete an assessment to get personalized recommendations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assessment Status Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(229, 231, 235, 0.5)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ padding: '20px 24px 16px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600', color: '#374151' }}>
            <span style={{ fontSize: '20px' }}>📋</span>
            <span>Assessment Status</span>
          </h3>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ 
            background: retestDays > 7 ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' :
                        retestDays > 0 ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' :
                        'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: retestDays > 7 ? '1px solid #bbf7d0' :
                   retestDays > 0 ? '1px solid #fde68a' :
                   '1px solid #fecaca',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: retestDays > 7 ? '#10b981' : retestDays > 0 ? '#f59e0b' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                flexShrink: 0
              }}>
                {retestDays > 7 ? '✅' : retestDays > 0 ? '⏰' : '🔔'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0', fontWeight: '600', fontSize: '0.95rem', color: retestDays > 7 ? '#166534' : retestDays > 0 ? '#92400e' : '#991b1b' }}>
                  {retestDays > 0 ? `${retestDays} days remaining` : 'Time for re-test'}
                </p>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: retestDays > 7 ? '#166534' : retestDays > 0 ? '#92400e' : '#991b1b', opacity: 0.9 }}>
                  {retestDays > 7 ? 'You\'re on track' : retestDays > 0 ? 'Consider scheduling soon' : 'Please take a new assessment'}
                </p>
              </div>
            </div>
          </div>
          <p style={{ margin: '0', fontSize: '0.85rem', color: '#9ca3af', lineHeight: '1.6' }}>
            Regular assessments help track your mental health progress over time.
          </p>
        </div>
      </div>

        <div style={{ 
          display: 'flex', 
          gap: 16, 
          marginTop: 32, 
          paddingTop: 32,
          borderTop: '1px solid #f3f4f6',
          justifyContent: 'center', 
          alignItems: 'center', 
          flexWrap: 'wrap' 
        }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/mood')} 
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)'
            }}
          >
            <span>😊</span>
            <span>Record Mood</span>
          </button>
          <button 
            onClick={() => navigate('/tools')} 
            style={{
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'white'
              e.target.style.borderColor = '#d1d5db'
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.95)'
              e.target.style.borderColor = '#e5e7eb'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            <span>🛠️</span>
            <span>Self-help Tools</span>
          </button>
          <button 
            onClick={() => navigate('/chat')} 
            style={{
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'white'
              e.target.style.borderColor = '#d1d5db'
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.95)'
              e.target.style.borderColor = '#e5e7eb'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            <span>💬</span>
            <span>Chat</span>
          </button>
          <button 
            onClick={() => navigate('/report')} 
            style={{
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'white'
              e.target.style.borderColor = '#d1d5db'
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.95)'
              e.target.style.borderColor = '#e5e7eb'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            <span>📊</span>
            <span>Personal Report</span>
          </button>
        </div>
        <button 
          onClick={() => navigate('/assessment')} 
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 4px 8px rgba(124, 58, 237, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 2px 4px rgba(124, 58, 237, 0.2)'
          }}
        >
          <span>📋</span>
          <span>Re-test Assessment</span>
        </button>
      </div>
      </div>
    </BackgroundLayout>
  )
}

export default Dashboard


