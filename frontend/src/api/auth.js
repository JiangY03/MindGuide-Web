import api from './client'

export function login(email, password) {
  return api.post('/api/auth/login', { email, password })
}

export function loginAnon() {
  return api.post('/api/auth/anon', {})
}

export function register(name, email, password) {
  return api.post('/api/auth/register', { name, email, password })
}



