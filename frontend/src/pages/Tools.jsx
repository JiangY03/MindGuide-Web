import { useEffect, useRef, useState } from 'react'
import BackgroundLayout from '../components/BackgroundLayout'
import api from '../api/client'

function Breathing() {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [phase, setPhase] = useState('Ready')
  const timerRef = useRef(null)

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  function start(minutes) {
    clearInterval(timerRef.current)
    const total = minutes * 60
    setSecondsLeft(total)
    setPhase('Inhale 4s')
    let count = 0
    timerRef.current = setInterval(() => {
      count += 1
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0))
      const cycle = count % 19
      if (cycle < 4) setPhase('Inhale 4s')
      else if (cycle < 11) setPhase('Hold 7s')
      else setPhase('Exhale 8s')
      if (count >= total) {
        clearInterval(timerRef.current)
        setPhase('Done')
      }
    }, 1000)
  }

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Breathing timer (4-7-8)</h3>
      <div>Status: {phase} (Left {secondsLeft}s)</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => start(1)}>1 min</button>
        <button onClick={() => start(3)}>3 min</button>
        <button onClick={() => start(5)}>5 min</button>
      </div>
    </div>
  )
}

function Grounding() {
  const steps = [
    'Look around and name 5 things you can see',
    'Close your eyes and name 4 things you can touch',
    'Listen and name 3 sounds you can hear',
    'Smell and name 2 scents (or ones you remember)',
    'Imagine 1 taste you like',
  ]
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(false)

  function next() {
    if (idx < steps.length - 1) setIdx(idx + 1)
    else setDone(true)
  }

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Grounding (5-4-3-2-1)</h3>
      {!done ? (
        <>
          <p>{steps[idx]}</p>
          <button onClick={next}>Next</button>
        </>
      ) : (
        <p>Great job! Take a moment to feel safe and steady now.</p>
      )}
    </div>
  )
}

function Cognitive() {
  const [form, setForm] = useState({
    situation: '',
    automaticThought: '',
    emotionIntensity: 50,
    evidence: '',
    alternative: '',
    reRate: 30,
    beforeFeeling: 50,
    afterFeeling: 40,
  })

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function save() {
    // Validate required fields
    if (!form.situation || !form.automaticThought) {
      alert('Please fill in at least Situation and Automatic thought fields')
      return
    }

    try {
      // Save to backend
      const response = await api.post('/api/cognitive/save', {
        situation: form.situation,
        automaticThought: form.automaticThought,
        emotionIntensity: form.emotionIntensity,
        evidence: form.evidence,
        alternative: form.alternative,
        reRate: form.reRate,
        beforeFeeling: form.beforeFeeling,
        afterFeeling: form.afterFeeling
      })

      if (response && response.ok) {
        // Also save to local storage as backup
        const key = 'cognitive_records'
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]')
          list.push({ ...form, at: new Date().toISOString() })
          localStorage.setItem(key, JSON.stringify(list))
        } catch {}

        alert('Saved successfully! This will be included in your personal report.')
        // Reset form
        setForm({
          situation: '',
          automaticThought: '',
          emotionIntensity: 50,
          evidence: '',
          alternative: '',
          reRate: 30,
          beforeFeeling: 50,
          afterFeeling: 40,
        })
      } else {
        alert('Failed to save. Please try again.')
      }
    } catch (error) {
      console.error('Error saving cognitive record:', error)
      alert('Failed to save. Please try again.')
    }
  }

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Cognitive restructuring (simple)</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <input placeholder="Situation" value={form.situation} onChange={(e) => update('situation', e.target.value)} />
        <input placeholder="Automatic thought" value={form.automaticThought} onChange={(e) => update('automaticThought', e.target.value)} />
        <label>Emotion intensity: {form.emotionIntensity}
          <input type="range" min={0} max={100} value={form.emotionIntensity} onChange={(e) => update('emotionIntensity', Number(e.target.value))} />
        </label>
        <textarea placeholder="Evidence for/against" rows={3} value={form.evidence} onChange={(e) => update('evidence', e.target.value)} />
        <textarea placeholder="Balanced alternative" rows={2} value={form.alternative} onChange={(e) => update('alternative', e.target.value)} />
        <label>Re-rate intensity: {form.reRate}
          <input type="range" min={0} max={100} value={form.reRate} onChange={(e) => update('reRate', Number(e.target.value))} />
        </label>
        <label>Subjective feeling before: {form.beforeFeeling}
          <input type="range" min={0} max={100} value={form.beforeFeeling} onChange={(e) => update('beforeFeeling', Number(e.target.value))} />
        </label>
        <label>Subjective feeling after: {form.afterFeeling}
          <input type="range" min={0} max={100} value={form.afterFeeling} onChange={(e) => update('afterFeeling', Number(e.target.value))} />
        </label>
        <button onClick={save}>Save locally</button>
      </div>
    </div>
  )
}

function Tools() {
  return (
    <BackgroundLayout title="Self-help Tools" subtitle="Tools to support your mental wellness">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, maxWidth: 900, margin: '0 auto' }}>
        <Breathing />
        <Grounding />
        <Cognitive />
      </div>
    </BackgroundLayout>
  )
}

export default Tools


