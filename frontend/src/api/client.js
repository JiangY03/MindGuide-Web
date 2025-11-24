// Environment variable configuration
const USE_MOCK = false  // Disable mock mode to use real API
// Use environment variable, read from VITE_API_BASE_URL in production, default to localhost in development
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Delay function - used to simulate network latency
 * @param {number} ms - Delay in milliseconds
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create JSON response object
 * @param {any} data - Response data
 * @param {number|object} init - Status code or response configuration
 */
function jsonResponse(data, init = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === 'number' ? init : init.status || 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Parse URL query parameters
 * @param {string} url - URL string
 */
function parseQuery(url) {
  const u = new URL(url, 'http://dummy')
  return Object.fromEntries(u.searchParams.entries())
}

/**
 * Check if text contains sensitive content (suicide-related)
 * @param {string} text - Text to check
 * @returns {boolean} Whether text contains sensitive content
 */
function containsSensitive(text) {
  if (!text) return false
  const t = String(text).toLowerCase()
  const keywords = [
    'suicide', 'kill myself', 'don\'t want to live', 'end my life',
    'end my life', 'want to die', 'not worth living', 'give up'
  ]
  return keywords.some((k) => t.includes(k))
}

async function handleMock(path, { method = 'GET', body, url }) {
  // Simulate network latency
  await delay(200)
  const query = parseQuery(url || path)

  // AUTH
  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = body || {}
    if (email === 'test@demo.com' && password === '123456') {
      return jsonResponse({
        ok: true,
        user: { id: 'u_demo', email, name: 'Demo User' },
        token: 'mock-token-demo',
      })
    }
    return jsonResponse({ ok: false, message: 'Invalid credentials' }, 401)
  }
  if (path === '/api/auth/anon' && method === 'POST') {
    return jsonResponse({
      ok: true,
      user: { id: 'u_anon', email: null, name: 'Anonymous' },
      token: 'mock-token-anon',
    })
  }

  // MOODS
  if (path.startsWith('/api/moods') && method === 'GET' && path === '/api/moods') {
    const days = Number(query.days || 7)
    const today = new Date()
    const data = Array.from({ length: days }).map((_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (days - 1 - i))
      return {
        date: d.toISOString().slice(0, 10),
        score: Math.floor(Math.random() * 5) + 1,
      }
    })
    return jsonResponse({ ok: true, data })
  }
  if (path.startsWith('/api/moods') && method === 'POST' && path === '/api/moods') {
    return jsonResponse({ ok: true })
  }
  if (path === '/api/moods/summary' && method === 'GET') {
    const count = 7
    const avg = Number((Array.from({ length: count }).reduce((s) => s + (Math.random() * 4 + 1), 0) / count).toFixed(2))
    return jsonResponse({ ok: true, data: { average: avg, count } })
  }

  // CHAT
  if (path === '/api/chat' && method === 'POST') {
    const { message } = body || {}
    if (containsSensitive(message)) {
      return jsonResponse({
        ok: true,
        type: 'crisis',
        message: 'I hear that you are in great pain and may have thoughts of hurting yourself. This is very important. Please immediately contact a crisis hotline or local emergency services. You don\'t have to face this alone.',
        hotlines: [
          { region: 'Crisis Hotline', number: 'Contact local crisis hotline' },
          { region: 'Emergency Services', number: 'Contact local emergency services' },
        ],
      })
    }
    return jsonResponse({
      ok: true,
      type: 'support',
      message: 'I understand this time has been difficult for you. Try taking some deep breaths and be gentle with yourself. If you\'d like, we can work through the issues that are troubling you step by step.',
    })
  }

  // ASSESSMENT
  if (path === '/api/assessment/submit' && method === 'POST') {
    return jsonResponse({
      ok: true,
      data: {
        total: 18,
        level: 'moderate',
        crisis: false,
        ai: {
          summary: 'Overall stress is moderate, with noticeable sleep and mood fluctuations. Recommend regular sleep schedule and mood tracking.',
          recommendations: [
            'Maintain consistent sleep and wake times',
            'Keep a 7-day "mood diary"',
            'Moderate exercise, at least 20 minutes walking daily',
          ],
          risk_level: 'low',
        },
      },
    })
  }
  if (path === '/api/assessment/last' && method === 'GET') {
    return jsonResponse({
      ok: true,
      data: {
        total: 15,
        level: 'mild',
        crisis: false,
        ai: {
          summary: 'Last assessment showed mild stress, recommend maintaining good habits and re-testing.',
          recommendations: ['Maintain regular schedule', 'Connect with a friend once'],
          risk_level: 'low',
        },
        at: new Date(Date.now() - 86400 * 1000).toISOString(),
      },
    })
  }

  // SURVEY
  if (path === '/api/survey/sus' && method === 'POST') {
    return jsonResponse({ ok: true })
  }
  if (path === '/api/survey/satisfaction' && method === 'POST') {
    return jsonResponse({ ok: true })
  }

  return jsonResponse({ ok: false, message: `Mock not implemented for ${method} ${path}` }, 404)
}

function getClientId() {
  try {
    return localStorage.getItem('clientId') || null
  } catch {
    return null
  }
}

function maybePersistClientId(data) {
  try {
    const newId = data?.user?.id
    if (newId) localStorage.setItem('clientId', newId)
  } catch {}
}

async function realFetch(path, { method = 'GET', body, headers, params }) {
  // Build API URL - handle both absolute and relative paths
  let apiUrl = API_BASE || 'http://localhost:8000'
  // Remove trailing slash from API_BASE
  apiUrl = apiUrl.replace(/\/$/, '')
  // Ensure path starts with a slash
  const cleanPath = path.startsWith('/') ? path : '/' + path
  const fullUrl = apiUrl + cleanPath
  
  // Build URL with query parameters
  const url = new URL(fullUrl)
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    })
  }
  const clientId = getClientId()
  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(clientId ? { 'X-Client-Id': clientId } : {}),
      ...(headers || {}),
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Request failed ${res.status}: ${text}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const data = await res.json()
    maybePersistClientId(data)
    return data
  }
  return res.text()
}

export async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const body = options.body || undefined
  const params = options.params || undefined

  if (USE_MOCK) {
    const url = new URL(path, 'http://dummy')
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
    }
    const res = await handleMock(path, { method, body, url: url.toString() })
    const data = await res.json()
    maybePersistClientId(data)
    return data
  }

  return realFetch(path, { method, body, headers: options.headers, params })
}

export const api = {
  get: (path, params) => request(path, { method: 'GET', params }),
  post: (path, body, params) => request(path, { method: 'POST', body, params }),
}

export default api


