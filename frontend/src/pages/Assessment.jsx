import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import BackgroundLayout from '../components/BackgroundLayout'

/**
 * PHQ-9 Depression Screening Scale Questions
 * Used to assess the severity of depressive symptoms over the past two weeks
 */
const QUESTIONS = [
  'Little interest or pleasure in doing things',                    // Lack of interest or pleasure in activities
  'Feeling down, depressed, or hopeless',                          // Feeling down, depressed, or hopeless
  'Trouble falling or staying asleep, or sleeping too much',       // Sleep problems or oversleeping
  'Feeling tired or having little energy',                         // Fatigue or low energy
  'Poor appetite or overeating',                                   // Poor appetite or overeating
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', // Poor self-image or feeling like a failure
  'Trouble concentrating on things, such as reading the newspaper or watching television', // Difficulty concentrating
  'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual', // Psychomotor agitation or retardation
  'Thoughts that you would be better off dead, or of hurting yourself', // Thoughts of death or self-harm
]

/**
 * PHQ-9 Scoring Options
 * 0-3 point scale, higher scores indicate more severe symptoms
 */
const OPTIONS = [
  { label: 'Not at all', value: 0 },           // Not at all
  { label: 'Several days', value: 1 },         // Several days
  { label: 'More than half the days', value: 2 }, // More than half the days
  { label: 'Nearly every day', value: 3 },     // Nearly every day
]

/**
 * Assessment Component - PHQ-9 Depression Assessment Page
 * Displays 9 questions, user selects answers and submits assessment results
 */
function Assessment() {
  const navigate = useNavigate()
  
  // State management
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null)) // User answers array, initially null
  const [submitting, setSubmitting] = useState(false)                        // Submission state
  const allAnswered = answers.every((v) => v !== null)                       // Check if all questions are answered

  /**
   * Set answer for specified question
   * @param {number} idx - Question index
   * @param {number} value - Answer value (0-3)
   */
  function setAnswer(idx, value) {
    setAnswers((prev) => {
      const next = [...prev]  // Create new array copy
      next[idx] = value       // Update answer at specified index
      return next
    })
  }

  /**
   * Submit assessment results
   * Calculate total score, send answers to backend API, navigate to results page on success
   */
  async function handleSubmit() {
    if (!allAnswered) return  // Return early if there are unanswered questions
    
    setSubmitting(true)
    // Calculate total score: sum all answers
    const total = answers.reduce((s, v) => s + (v || 0), 0)
    
    try {
      console.log('Submitting assessment with answers:', answers, 'total:', total)
      // Send answers and total score to backend
      const res = await api.post('/api/assessment/submit', { answers, total })
      console.log('API response:', res)
      
      if (res && res.ok) {
        // Save assessment results to local storage
        const payload = res.data || { total }
        console.log('Saving to localStorage:', payload)
        localStorage.setItem('lastAssessment', JSON.stringify(payload))
        // Navigate to results page
        console.log('Navigating to /result')
        navigate('/result', { replace: true })
      } else {
        console.log('API response not ok, using fallback data')
        // Even if API fails, still navigate to results with basic data
        const basicData = { 
          total, 
          level: total <= 4 ? 'minimal' : total <= 9 ? 'mild' : total <= 14 ? 'moderate' : total <= 19 ? 'moderately severe' : 'severe',
          crisis: answers[8] >= 1
        }
        console.log('Saving fallback data:', basicData)
        localStorage.setItem('lastAssessment', JSON.stringify(basicData))
        console.log('Navigating to /result with fallback')
        navigate('/result', { replace: true })
      }
    } catch (error) {
      console.error('Assessment submission error:', error)
      // Even if there's an error, navigate to results with basic data
      const basicData = { 
        total, 
        level: total <= 4 ? 'minimal' : total <= 9 ? 'mild' : total <= 14 ? 'moderate' : total <= 19 ? 'moderately severe' : 'severe',
        crisis: answers[8] >= 1
      }
      console.log('Error occurred, saving fallback data:', basicData)
      localStorage.setItem('lastAssessment', JSON.stringify(basicData))
      console.log('Navigating to /result after error')
      navigate('/result', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BackgroundLayout title="PHQ-9 Assessment" subtitle="Please answer each question honestly">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <ol style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 0, listStyle: 'none' }}>
        {QUESTIONS.map((q, i) => (
          <li key={i} style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: 8, 
            padding: 16, 
            backgroundColor: '#f9fafb' 
          }}>
            <div style={{ 
              marginBottom: 16, 
              fontSize: 16, 
              fontWeight: 600, 
              color: '#374151',
              lineHeight: 1.5,
              textAlign: 'left'
            }}>
              {i + 1}. {q}
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 8 
            }}>
              {OPTIONS.map((opt) => (
                <label key={opt.value} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  padding: '12px 16px',
                  backgroundColor: answers[i] === opt.value ? '#dbeafe' : '#ffffff',
                  border: answers[i] === opt.value ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: 14,
                  textAlign: 'left',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <input
                    type="radio"
                    name={`q${i}`}
                    value={opt.value}
                    checked={answers[i] === opt.value}
                    onChange={() => setAnswer(i, opt.value)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontWeight: answers[i] === opt.value ? 600 : 400 }}>
                    {opt.label} ({opt.value})
                  </span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div style={{ 
        marginTop: 32, 
        display: 'flex', 
        justifyContent: 'center' 
      }}>
        <button 
          onClick={handleSubmit} 
          disabled={!allAnswered || submitting} 
          style={{ 
            padding: '12px 32px',
            backgroundColor: !allAnswered || submitting ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: !allAnswered || submitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            minWidth: 120
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
      </div>
    </BackgroundLayout>
  )
}

export default Assessment


