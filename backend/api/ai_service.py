"""
AI Service Module - Handles AI model interactions
Supports multiple providers: Ollama (local), OpenAI, Gemini
"""
import requests
import logging
import os
from django.conf import settings

logger = logging.getLogger(__name__)

class AIService:
    """AI service for handling chat interactions with multiple providers"""
    
    def __init__(self):
        self.provider = getattr(settings, 'AI_MODEL_PROVIDER', 'ollama')
        self.model_name = getattr(settings, 'AI_MODEL_NAME', 'mistral:7b-instruct')
        self.base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')
        self.max_tokens = getattr(settings, 'AI_MAX_TOKENS', 200)
        self.temperature = getattr(settings, 'AI_TEMPERATURE', 0.7)
        self.api_key = os.getenv('AI_API_KEY', '')
    
    def generate_response(self, message, context=None):
        """
        Generate AI response using configured provider
        
        Args:
            message (str): User message
            context (list): Previous conversation context
            
        Returns:
            dict: AI response with message and metadata
        """
        # Route to appropriate provider
        if self.provider == 'openai':
            return self._generate_openai(message, context)
        elif self.provider == 'gemini':
            return self._generate_gemini(message, context)
        elif self.provider == 'claude':
            return self._generate_claude(message, context)
        else:
            # Default to Ollama
            return self._generate_ollama(message, context)
    
    def _generate_ollama(self, message, context=None):
        """Generate response using Ollama (local)"""
        try:
            messages = self._build_messages(message, context)
            
            payload = {
                "model": self.model_name,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens
                }
            }
            
            response = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_message = result.get('message', {}).get('content', '')
                return {
                    'success': True,
                    'message': ai_message,
                    'model': self.model_name
                }
            else:
                logger.error(f"Ollama API error: {response.status_code}")
                return self._fallback_response('Ollama API error')
                
        except Exception as e:
            logger.error(f"Ollama error: {str(e)}")
            return self._fallback_response(str(e))
    
    def _generate_openai(self, message, context=None):
        """Generate response using OpenAI"""
        if not self.api_key:
            logger.error("OpenAI API key not configured")
            return self._fallback_response('API key missing')
        
        try:
            messages = self._build_messages(message, context)
            
            # Use gpt-3.5-turbo for cost efficiency, or gpt-4 if available
            model = self.model_name if self.model_name.startswith('gpt') else 'gpt-3.5-turbo'
            
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': model,
                    'messages': messages,
                    'temperature': self.temperature,
                    'max_tokens': self.max_tokens
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_message = result['choices'][0]['message']['content']
                return {
                    'success': True,
                    'message': ai_message,
                    'model': model
                }
            else:
                logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                return self._fallback_response('OpenAI API error')
                
        except Exception as e:
            logger.error(f"OpenAI error: {str(e)}")
            return self._fallback_response(str(e))
    
    def _generate_gemini(self, message, context=None):
        """Generate response using Google Gemini"""
        if not self.api_key:
            logger.error("Gemini API key not configured")
            return self._fallback_response('API key missing')
        
        try:
            # Build prompt from messages
            system_prompt = self._get_system_prompt()
            full_prompt = system_prompt + "\n\n"
            
            if context:
                for msg in context[-5:]:
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    full_prompt += f"{role.capitalize()}: {content}\n"
            
            full_prompt += f"User: {message}\nAssistant:"
            
            # Use Gemini API
            model = self.model_name if 'gemini' in self.model_name.lower() else 'gemini-pro'
            
            response = requests.post(
                f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}',
                json={
                    'contents': [{
                        'parts': [{'text': full_prompt}]
                    }],
                    'generationConfig': {
                        'temperature': self.temperature,
                        'maxOutputTokens': self.max_tokens
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_message = result['candidates'][0]['content']['parts'][0]['text']
                return {
                    'success': True,
                    'message': ai_message,
                    'model': model
                }
            else:
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                return self._fallback_response('Gemini API error')
                
        except Exception as e:
            logger.error(f"Gemini error: {str(e)}")
            return self._fallback_response(str(e))
    
    def _generate_claude(self, message, context=None):
        """Generate response using Anthropic Claude"""
        if not self.api_key:
            logger.error("Claude API key not configured")
            return self._fallback_response('API key missing')
        
        try:
            messages = self._build_messages(message, context)
            
            # Remove system message and add it as system parameter
            system_msg = None
            user_messages = []
            for msg in messages:
                if msg['role'] == 'system':
                    system_msg = msg['content']
                else:
                    user_messages.append(msg)
            
            model = self.model_name if 'claude' in self.model_name.lower() else 'claude-3-haiku-20240307'
            
            response = requests.post(
                'https://api.anthropic.com/v1/messages',
                headers={
                    'x-api-key': self.api_key,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': model,
                    'messages': user_messages,
                    'system': system_msg or self._get_system_prompt(),
                    'max_tokens': self.max_tokens,
                    'temperature': self.temperature
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_message = result['content'][0]['text']
                return {
                    'success': True,
                    'message': ai_message,
                    'model': model
                }
            else:
                logger.error(f"Claude API error: {response.status_code} - {response.text}")
                return self._fallback_response('Claude API error')
                
        except Exception as e:
            logger.error(f"Claude error: {str(e)}")
            return self._fallback_response(str(e))
    
    def _build_messages(self, message, context=None):
        """Build messages array for API"""
        messages = []
        
        # Add system prompt
        messages.append({
            "role": "system",
            "content": self._get_system_prompt()
        })
        
        # Add conversation context if available
        if context:
            for msg in context[-5:]:  # Keep last 5 messages
                messages.append(msg)
        
        # Add current user message
        messages.append({"role": "user", "content": message})
        
        return messages
    
    def _get_system_prompt(self):
        """Get system prompt for mental health support"""
        return """You are a supportive mental health assistant. Provide brief, helpful responses:
- Keep responses VERY SHORT (1-2 sentences maximum)
- Be warm and empathetic
- Give one practical suggestion or supportive comment
- Only suggest professional help when the user mentions severe symptoms, self-harm, or crisis situations
- For general conversations, provide supportive responses without mentioning professional help
- Use simple language
- NO medical advice
- Be conversational and natural, not clinical"""
    
    def _fallback_response(self, error):
        """Return fallback response when AI fails"""
        return {
            'success': False,
            'message': 'I apologize, but I\'m having trouble responding right now. Please try again later.',
            'error': str(error)
        }
    
    def is_available(self):
        """
        Check if AI service is available
        
        Returns:
            bool: True if service is available, False otherwise
        """
        if self.provider == 'ollama':
            try:
                response = requests.get(f"{self.base_url}/api/tags", timeout=5)
                return response.status_code == 200
            except:
                return False
        elif self.provider == 'openai':
            # Check if API key is configured and looks valid (starts with sk-)
            return bool(self.api_key and self.api_key.startswith('sk-'))
        elif self.provider == 'gemini':
            # Check if API key is configured (Gemini keys are usually long strings)
            return bool(self.api_key and len(self.api_key) > 20)
        elif self.provider == 'claude':
            # Check if API key is configured (Claude keys start with sk-ant-)
            return bool(self.api_key and (self.api_key.startswith('sk-ant-') or len(self.api_key) > 20))
        else:
            return False

# Global AI service instance
ai_service = AIService()
