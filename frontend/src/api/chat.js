import api from './client'

export function sendMessage(message) {
  return api.post('/api/chat', { message })
}

export function getChatHistory() {
  return api.get('/api/chat/history')
}



