import { useEffect, useMemo, useState } from 'react'
import { fetchMoods, addMood } from '../api/moods'
import BackgroundLayout from '../components/BackgroundLayout'

function todayKey() {
  return new Date().toISOString().slice(0,10)
}

function Mood() {
  const [list, setList] = useState([])
  const [score, setScore] = useState(3)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const already = useMemo(() => list.some((x) => x.date === todayKey()), [list])

  function load() {
    fetchMoods(7).then((res) => {
      if (res && res.ok) setList(res.data || [])
    }).catch(() => {})
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (already) return
    setSaving(true)
    setMessage('')
    try {
      const res = await addMood(score, note)
      if (res && res.ok) {
        setMessage('Recorded')
        setNote('')
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <BackgroundLayout title="Mood Check-in" subtitle="How are you feeling today?">
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'left' }}>
      {message ? <div style={{ color: 'green', marginBottom: 8 }}>{message}</div> : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label>Score: {score}</label>
        <input type="range" min={1} max={5} value={score} onChange={(e) => setScore(Number(e.target.value))} />
      </div>
      <div style={{ marginTop: 8 }}>
        <textarea rows={3} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} style={{ width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={handleSave} disabled={saving || already} style={{ padding: 10 }}>
          {already ? 'Already recorded today' : (saving ? 'Saving...' : 'Save')}
        </button>
      </div>

      <h3 style={{ marginTop: 24, textAlign: 'left' }}>Last 7 days</h3>
      <ul style={{ textAlign: 'left', paddingLeft: 0, marginLeft: 0 }}>
        {list.map((x) => (
          <li key={x.date} style={{ textAlign: 'left', marginLeft: 0, paddingLeft: 0 }}>{x.date} - {x.score}</li>
        ))}
      </ul>
      </div>
    </BackgroundLayout>
  )
}

export default Mood


