import api from './client'

export function fetchMoods(days = 7) {
  return api.get('/api/moods', { days })
}

export function addMood(score, note) {
  return api.post('/api/moods', { score, note })
}

export function fetchMoodSummary() {
  return api.get('/api/moods/summary')
}










