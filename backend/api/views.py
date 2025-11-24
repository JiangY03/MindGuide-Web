from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import transaction
from django.utils import timezone
import logging
import uuid
from datetime import datetime, timedelta
from .ai_service import ai_service
from .models import UserProfile, MoodEntry, Assessment, ChatMessage, SurveyResponse, CognitiveRecord

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
  """Health check endpoint - used for service monitoring"""
  logger.info('Health check requested')
  return Response({'ok': True, 'status': 'healthy'})


def get_client_id(request):
  """Extract client ID from request, supports multiple methods"""
  cid = request.headers.get('X-Client-Id') or request.GET.get('client_id') or request.POST.get('client_id')
  return cid


def get_user_from_client_id(client_id):
  """Get user from client_id"""
  if not client_id:
    return None
  
  try:
    if client_id.startswith('email:'):
      email = client_id[6:]  # Remove 'email:' prefix
      user = User.objects.get(email=email)
      return user
    else:
      # Handle anonymous users
      profile = UserProfile.objects.filter(client_id=client_id).first()
      return profile.user if profile else None
  except User.DoesNotExist:
    return None


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_login(request):
  """User login endpoint - validates email and password"""
  email = (request.data or {}).get('email')
  password = (request.data or {}).get('password')
  logger.info('Login attempt email=%s', email)
  if not email or not password:
    return Response({'ok': False, 'message': 'Missing email or password'}, status=400)

  # Authenticate user using Django's built-in authentication
  # First try to find user by email, then authenticate with username
  try:
    user_obj = User.objects.get(email=email)
    user = authenticate(username=user_obj.username, password=password)
  except User.DoesNotExist:
    user = None
  
  if not user:
    return Response({'ok': False, 'message': 'Email or password incorrect'}, status=401)

  # Get or create user profile
  profile, created = UserProfile.objects.get_or_create(
    user=user,
    defaults={'client_id': f'email:{email}'}
  )
  
  client_id = profile.client_id
  name = user.first_name or user.email.split('@')[0]
  logger.info('Login successful email=%s', email)
  return Response({
    'ok': True,
    'user': { 'id': client_id, 'email': email, 'name': name },
    'token': 'demo-token'
  })


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_register(request):
  """User registration endpoint - creates new user account"""
  payload = request.data or {}
  email = (payload.get('email') or '').strip().lower()
  password = payload.get('password')
  name = (payload.get('name') or '').strip()

  if not email or not password:
    return Response({'ok': False, 'message': 'Missing email or password'}, status=400)

  # Check if user already exists
  if User.objects.filter(email=email).exists():
    return Response({'ok': False, 'message': 'User already exists'}, status=409)

  try:
    with transaction.atomic():
      # Create Django user
      user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=name
      )
      
      # Create user profile
      profile = UserProfile.objects.create(
        user=user,
        client_id=f'email:{email}'
      )
      
      logger.info('User registered email=%s', email)
      return Response({'ok': True, 'message': 'User registered successfully'})
      
  except Exception as e:
    logger.error('Registration error: %s', str(e))
    return Response({'ok': False, 'message': 'Registration failed'}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_anon(request):
  """Anonymous login endpoint - creates temporary user"""
  client_id = request.data.get('client_id')
  if not client_id:
    client_id = f'anon:{uuid.uuid4().hex[:12]}'
  
  logger.info('Anon login with client_id=%s', client_id)
  
  # Check if anonymous user already exists
  try:
    profile = UserProfile.objects.get(client_id=client_id)
    user = profile.user
  except UserProfile.DoesNotExist:
    # Create anonymous user
    username = f'anonymous_{uuid.uuid4().hex[:8]}'
    user = User.objects.create_user(
      username=username,
      email=f'{username}@anonymous.local',
      password='anonymous'
    )
    profile = UserProfile.objects.create(
      user=user,
      client_id=client_id
    )
  
  return Response({
    'ok': True,
    'user': { 'id': client_id, 'email': user.email, 'name': 'Anonymous User' },
    'token': 'demo-token'
  })


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def moods_root(request):
  """Get user's mood data (GET) or add mood entry (POST)"""
  cid = get_client_id(request)
  if not cid:
    return Response({'ok': False, 'message': 'Missing anonymous ID (X-Client-Id or client_id)'}, status=400)

  user = get_user_from_client_id(cid)
  if not user:
    return Response({'ok': False, 'message': 'User not found'}, status=404)

  if request.method == 'POST':
    # Handle POST request - add mood entry
    score = request.data.get('score')
    note = request.data.get('note', '')
    date_str = request.data.get('date')
    
    if not score:
      return Response({'ok': False, 'message': 'Missing score'}, status=400)
    
    try:
      score = int(score)
      if score < 1 or score > 5:
        return Response({'ok': False, 'message': 'Score must be between 1 and 5'}, status=400)
    except (ValueError, TypeError):
      return Response({'ok': False, 'message': 'Invalid score'}, status=400)
    
    if date_str:
      try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
      except ValueError:
        return Response({'ok': False, 'message': 'Invalid date format (use YYYY-MM-DD)'}, status=400)
    else:
      date_obj = timezone.now().date()
    
    # Check if mood already exists for this date
    existing = MoodEntry.objects.filter(user=user, date=date_obj).first()
    if existing:
      return Response({
        'ok': False,
        'message': 'Already recorded for today',
        'data': {
          'date': existing.date.isoformat(),
          'score': existing.score,
          'note': existing.note or ''
        }
      }, status=409)
    
    # Create new mood entry
    mood = MoodEntry.objects.create(
      user=user,
      score=score,
      note=note,
      date=date_obj
    )
    
    logger.info('Mood added cid=%s score=%d date=%s', cid, score, date_obj)
    return Response({
      'ok': True,
      'data': {
        'date': mood.date.isoformat(),
        'score': mood.score,
        'note': mood.note or '',
        'at': mood.created_at.isoformat()
      }
    })
  else:
    # Handle GET request - get mood data
    days = int(request.GET.get('days', 7))
    since = timezone.now() - timedelta(days=days)
    
    moods = MoodEntry.objects.filter(
      user=user,
      date__gte=since.date()
    ).order_by('date')
    
    mood_data = []
    for mood in moods:
      mood_data.append({
        'date': mood.date.isoformat(),
        'score': mood.score,
        'note': mood.note or '',
        'at': mood.created_at.isoformat()
      })
    
    logger.info('Moods list(cid via root) cid=%s days=%d count=%d', cid, days, len(mood_data))
    return Response({'ok': True, 'data': mood_data})


@api_view(['GET'])
@permission_classes([AllowAny])
def moods_summary(request):
  """Get mood summary statistics"""
  cid = get_client_id(request)
  if not cid:
    return Response({'ok': False, 'message': 'Missing anonymous ID'}, status=400)

  user = get_user_from_client_id(cid)
  if not user:
    return Response({'ok': False, 'message': 'User not found'}, status=404)

  days = int(request.GET.get('days', 7))
  since = timezone.now() - timedelta(days=days)
  
  moods = MoodEntry.objects.filter(
    user=user,
    date__gte=since.date()
  )
  
  if not moods.exists():
    return Response({'ok': True, 'data': {'average': 0, 'count': 0, 'trend': 'no_data'}})
  
  scores = [m.score for m in moods]
  average = round(sum(scores) / len(scores), 2)
  
  # Calculate trend
  if len(scores) >= 2:
    recent_avg = sum(scores[:len(scores)//2]) / (len(scores)//2)
    older_avg = sum(scores[len(scores)//2:]) / (len(scores) - len(scores)//2)
    if recent_avg > older_avg + 0.5:
      trend = 'improving'
    elif recent_avg < older_avg - 0.5:
      trend = 'declining'
    else:
      trend = 'stable'
  else:
    trend = 'insufficient_data'
  
  return Response({
    'ok': True,
    'data': {
      'average': average,
      'count': len(scores),
      'trend': trend
    }
  })


@api_view(['POST'])
@permission_classes([AllowAny])
def moods_add(request):
  """Add new mood entry"""
  cid = get_client_id(request)
  if not cid:
    return Response({'ok': False, 'message': 'Missing anonymous ID'}, status=400)

  user = get_user_from_client_id(cid)
  if not user:
    return Response({'ok': False, 'message': 'User not found'}, status=404)

  score = request.data.get('score')
  note = request.data.get('note', '')
  date_str = request.data.get('date')
  
  if not score:
    return Response({'ok': False, 'message': 'Missing score'}, status=400)
  
  try:
    score = int(score)
    if score < 1 or score > 5:
      return Response({'ok': False, 'message': 'Score must be between 1 and 5'}, status=400)
  except ValueError:
    return Response({'ok': False, 'message': 'Invalid score format'}, status=400)
  
  # Parse date or use today
  if date_str:
    try:
      date = datetime.fromisoformat(date_str).date()
    except ValueError:
      return Response({'ok': False, 'message': 'Invalid date format'}, status=400)
  else:
    date = timezone.now().date()
  
  # Create or update mood entry
  mood, created = MoodEntry.objects.update_or_create(
    user=user,
    date=date,
    defaults={
      'score': score,
      'note': note
    }
  )
  
  logger.info('Moods add(cid via root) cid=%s score=%d', cid, score)
  return Response({
    'ok': True,
    'data': {
      'date': mood.date.isoformat(),
      'score': mood.score,
      'note': mood.note or '',
      'at': mood.created_at.isoformat()
    }
  })


@api_view(['POST'])
@permission_classes([AllowAny])
def assessment_submit(request):
  """Submit PHQ-9 assessment"""
  cid = get_client_id(request)
  if not cid:
    return Response({'ok': False, 'message': 'Missing anonymous ID'}, status=400)

  user = get_user_from_client_id(cid)
  if not user:
    return Response({'ok': False, 'message': 'User not found'}, status=404)

  answers = request.data.get('answers', [])
  if len(answers) != 9:
    return Response({'ok': False, 'message': 'Must provide exactly 9 answers'}, status=400)

  # Calculate total score
  total = sum(answers)
  
  # Determine severity level
  if total <= 4:
    level = 'minimal'
  elif total <= 9:
    level = 'mild'
  elif total <= 14:
    level = 'moderate'
  elif total <= 19:
    level = 'moderately severe'
  else:
    level = 'severe'
  
  # Check for crisis (question 9 about self-harm)
  crisis = answers[8] >= 1
  
  # Generate base analysis based on score (always provide reasonable content)
  def get_base_analysis(score, level, crisis_flag):
    """Generate base analysis and recommendations based on PHQ-9 score"""
    if score <= 4:
      # Minimal symptoms
      summary = "Your assessment indicates minimal depressive symptoms. This suggests that you are experiencing few or no symptoms of depression at this time. Continue monitoring your mental health and maintaining healthy lifestyle habits."
      recommendations = [
        "Continue monitoring your mood and emotional well-being regularly",
        "Maintain a balanced routine with regular sleep, exercise, and social connections",
        "Practice stress management techniques such as mindfulness or deep breathing",
        "Consider keeping a mood journal to track patterns over time"
      ]
      risk_level = "low"
    elif score <= 9:
      # Mild symptoms
      summary = "Your assessment shows mild depressive symptoms. While these symptoms are present, they may be manageable with self-care strategies and lifestyle adjustments. Consider regular monitoring and proactive self-care."
      recommendations = [
        "Establish and maintain a consistent daily routine with regular sleep and meal times",
        "Engage in regular physical activity, even light exercise like walking for 20-30 minutes daily",
        "Practice relaxation techniques such as meditation, deep breathing, or progressive muscle relaxation",
        "Stay connected with friends, family, or support groups",
        "Consider speaking with a healthcare provider or counselor for additional support"
      ]
      risk_level = "low"
    elif score <= 14:
      # Moderate symptoms
      summary = "Your assessment indicates moderate depressive symptoms. These symptoms may be impacting your daily functioning. Professional support and intervention may be beneficial to help you manage these symptoms effectively."
      recommendations = [
        "Consider consulting with a mental health professional or healthcare provider",
        "Maintain a structured daily schedule with activities that provide a sense of accomplishment",
        "Practice regular physical exercise, aiming for at least 30 minutes of moderate activity most days",
        "Engage in activities you previously enjoyed, even if motivation is low",
        "Limit alcohol and avoid recreational drugs, as they can worsen symptoms",
        "Consider cognitive-behavioral therapy (CBT) or other evidence-based treatments"
      ]
      risk_level = "medium"
    elif score <= 19:
      # Moderately severe symptoms
      summary = "Your assessment shows moderately severe depressive symptoms. These symptoms are likely significantly affecting your daily life. Professional support is strongly recommended to help you develop coping strategies and treatment options."
      recommendations = [
        "Seek professional mental health support as soon as possible",
        "Consider speaking with a healthcare provider about treatment options, including therapy and/or medication",
        "Establish a support network of trusted friends, family members, or support groups",
        "Prioritize self-care activities, even small ones, to maintain basic functioning",
        "Avoid isolation and maintain regular contact with others",
        "If you have thoughts of self-harm, contact a crisis hotline or emergency services immediately"
      ]
      risk_level = "high"
    else:
      # Severe symptoms
      summary = "Your assessment indicates severe depressive symptoms. These symptoms are significantly impacting your well-being and daily functioning. Immediate professional support is strongly recommended to ensure your safety and begin appropriate treatment."
      recommendations = [
        "Contact a mental health professional or healthcare provider immediately",
        "If you have thoughts of self-harm or suicide, contact a crisis hotline or emergency services right away",
        "Consider speaking with a trusted friend or family member about your situation",
        "Avoid making major life decisions while experiencing severe symptoms",
        "Follow through with professional treatment recommendations",
        "Ensure you have a safety plan in place if you experience thoughts of self-harm"
      ]
      risk_level = "high"
    
    # Adjust for crisis indicators
    if crisis_flag:
      summary += " Importantly, your responses indicate thoughts related to self-harm or death, which requires immediate attention and professional support."
      recommendations.insert(0, "If you are having thoughts of hurting yourself, please contact a crisis hotline, emergency services, or mental health professional immediately")
      risk_level = "high"
    
    return summary, recommendations, risk_level
  
  # Get base analysis (always available, fast response)
  ai_summary, ai_recommendations, ai_risk_level = get_base_analysis(total, level, crisis)
  
  # Note: AI enhancement removed for faster response time
  # Base analysis provides comprehensive, personalized recommendations based on score ranges
  
  # Save assessment to database
  assessment = Assessment.objects.create(
    user=user,
    answers=answers,
    total=total,
    level=level,
    crisis=crisis,
    ai_summary=ai_summary,
    ai_recommendations=ai_recommendations,
    ai_risk_level=ai_risk_level
  )
  
  logger.info('Assessment submit cid=%s total=%d level=%s crisis=%s', cid, total, level, crisis)
  
  return Response({
    'ok': True,
    'data': {
      'total': total,
      'level': level,
      'crisis': crisis,
      'ai': {
        'summary': ai_summary,
        'recommendations': ai_recommendations,
        'risk_level': ai_risk_level
      },
      'at': assessment.created_at.isoformat()
    }
  })


@api_view(['GET'])
@permission_classes([AllowAny])
def assessment_last(request):
  """Get user's last assessment"""
  cid = get_client_id(request)
  if not cid:
    return Response({'ok': False, 'message': 'Missing anonymous ID'}, status=400)

  user = get_user_from_client_id(cid)
  if not user:
    return Response({'ok': False, 'message': 'User not found'}, status=404)

  try:
    assessment = Assessment.objects.filter(user=user).latest('created_at')
    return Response({
      'ok': True,
      'data': {
        'answers': assessment.answers,
        'total': assessment.total,
        'level': assessment.level,
        'crisis': assessment.crisis,
        'ai': {
          'summary': assessment.ai_summary or '',
          'recommendations': assessment.ai_recommendations or [],
          'risk_level': assessment.ai_risk_level or 'low'
        },
        'at': assessment.created_at.isoformat()
      }
    })
  except Assessment.DoesNotExist:
    return Response({'ok': False, 'message': 'No assessment found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def chat(request):
  """Chat with AI assistant"""
  cid = get_client_id(request)
  if not cid:
    return Response({'ok': False, 'message': 'Missing anonymous ID'}, status=400)

  user = get_user_from_client_id(cid)
  if not user:
    return Response({'ok': False, 'message': 'User not found'}, status=404)

  message = request.data.get('message', '').strip()
  if not message:
    return Response({'ok': False, 'message': 'Message is required'}, status=400)

  # Generate AI response
  if ai_service.is_available():
    try:
      ai_response = ai_service.generate_response(message)
      if isinstance(ai_response, dict) and ai_response.get('success'):
        response = ai_response.get('message', 'I apologize, but I\'m having trouble responding right now.')
      else:
        response = "I apologize, but I'm having trouble responding right now. Please try again later."
    except Exception as e:
      logger.error('AI service error: %s', str(e))
      response = "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again later or contact a mental health professional if you need immediate support."
  else:
    response = "I'm currently unavailable. Please try again later or contact a mental health professional if you need immediate support."

  # Save chat message to database
  chat_message = ChatMessage.objects.create(
    user=user,
    message=message,
    response=response
  )

  logger.info('Chat message saved for cid=%s', cid)
  return Response({
    'ok': True,
    'data': {
      'message': message,
      'response': response,
      'at': chat_message.created_at.isoformat()
    }
  })


@api_view(['GET'])
@permission_classes([AllowAny])
def chat_history(request):
  """Get chat history"""
  cid = get_client_id(request)
  if not cid:
    return Response({'ok': False, 'message': 'Missing anonymous ID'}, status=400)

  user = get_user_from_client_id(cid)
  if not user:
    return Response({'ok': False, 'message': 'User not found'}, status=404)

  limit = int(request.GET.get('limit', 50))
  
  chats = ChatMessage.objects.filter(user=user).order_by('-created_at')[:limit]
  
  chat_data = []
  for chat in chats:
    chat_data.append({
      'message': chat.message,
      'response': chat.response,
      'at': chat.created_at.isoformat()
    })
  
  return Response({'ok': True, 'data': chat_data})


# Helper functions for report generation
def calculate_overall_wellbeing(avg_mood, latest_assessment, chat_frequency):
  """Calculate overall wellbeing score"""
  if not latest_assessment:
    return 'unknown'
  
  # Handle both dict and Assessment object
  if hasattr(latest_assessment, 'total'):
    total = latest_assessment.total
  elif isinstance(latest_assessment, dict):
    total = latest_assessment.get('total', 0)
  else:
    total = 0
    
  if total <= 4:
    return 'good'
  elif total <= 9:
    return 'fair'
  elif total <= 14:
    return 'concerning'
  else:
    return 'critical'

def calculate_mood_trend(mood_scores):
  """Calculate mood trend"""
  if len(mood_scores) < 2:
    return 'insufficient_data'
  
  recent_avg = sum(mood_scores[:len(mood_scores)//2]) / (len(mood_scores)//2)
  older_avg = sum(mood_scores[len(mood_scores)//2:]) / (len(mood_scores) - len(mood_scores)//2)
  
  if recent_avg > older_avg + 0.5:
    return 'improving'
  elif recent_avg < older_avg - 0.5:
    return 'declining'
  else:
    return 'stable'

def calculate_mood_consistency(mood_scores):
  """Calculate mood consistency"""
  if len(mood_scores) < 2:
    return 'insufficient_data'
  
  variance = sum((x - sum(mood_scores)/len(mood_scores))**2 for x in mood_scores) / len(mood_scores)
  if variance < 0.5:
    return 'very_consistent'
  elif variance < 1.0:
    return 'consistent'
  elif variance < 2.0:
    return 'variable'
  else:
    return 'highly_variable'

def calculate_assessment_improvement(assessment_trend):
  """Calculate assessment improvement"""
  if len(assessment_trend) < 2:
    return 'insufficient_data'
  
  if assessment_trend[-1] < assessment_trend[0] - 2:
    return 'improving'
  elif assessment_trend[-1] > assessment_trend[0] + 2:
    return 'declining'
  else:
    return 'stable'

def calculate_engagement_level(chat_frequency):
  """Calculate engagement level"""
  if chat_frequency >= 5:
    return 'high'
  elif chat_frequency >= 2:
    return 'medium'
  else:
    return 'low'

def extract_top_concerns(chat_data):
  """Extract top concerns from chat data"""
  # Simple keyword extraction (in production, use NLP)
  concerns = []
  for chat in chat_data:
    message = chat.get('message', '').lower()
    if any(word in message for word in ['anxiety', 'worry', 'nervous']):
      concerns.append('anxiety')
    if any(word in message for word in ['depression', 'sad', 'down']):
      concerns.append('depression')
    if any(word in message for word in ['stress', 'pressure', 'overwhelmed']):
      concerns.append('stress')
    if any(word in message for word in ['sleep', 'insomnia', 'tired']):
      concerns.append('sleep')
    if any(word in message for word in ['lonely', 'isolated', 'alone']):
      concerns.append('loneliness')
  
  # Count and return top concerns with counts
  from collections import Counter
  concern_counts = Counter(concerns)
  return [[concern, count] for concern, count in concern_counts.most_common(5)]

def calculate_cognitive_improvement(cognitive_records):
  """Calculate average improvement from cognitive restructuring exercises"""
  if not cognitive_records.exists():
    return None
  
  improvements = [(c.after_feeling - c.before_feeling) for c in cognitive_records]
  return round(sum(improvements) / len(improvements), 2) if improvements else None

def extract_common_situations(cognitive_data):
  """Extract common situations from cognitive restructuring records"""
  if not cognitive_data:
    return []
  
  # Simple keyword extraction from situations
  from collections import Counter
  situations = [c.get('situation', '').lower()[:50] for c in cognitive_data if c.get('situation')]
  situation_counts = Counter(situations)
  return [[situation, count] for situation, count in situation_counts.most_common(3)]

def generate_recommendations(avg_mood, latest_assessment, chat_frequency, cognitive_records=None):
  """Generate personalized recommendations"""
  recommendations = []
  
  # Handle both dict and Assessment object
  crisis = False
  total = 0
  if latest_assessment:
    if hasattr(latest_assessment, 'crisis'):
      crisis = latest_assessment.crisis
      total = latest_assessment.total
    elif isinstance(latest_assessment, dict):
      crisis = latest_assessment.get('crisis', False)
      total = latest_assessment.get('total', 0)
  
  if crisis:
    recommendations.append({
      'title': 'Seek Immediate Professional Help',
      'description': 'Your assessment indicates crisis indicators. Please contact a mental health professional or crisis support service immediately.',
      'priority': 'high'
    })
  elif avg_mood < 2.5 or (total and total > 14):
    recommendations.append({
      'title': 'Consult with a Mental Health Professional',
      'description': 'Consider speaking with a mental health professional to discuss your symptoms and develop a treatment plan.',
      'priority': 'high'
    })
  elif total and total > 9:
    recommendations.append({
      'title': 'Consider Professional Support',
      'description': 'Professional support may help you manage your symptoms more effectively.',
      'priority': 'medium'
    })
  
  if avg_mood < 2.5:
    recommendations.append({
      'title': 'Practice Mood Tracking',
      'description': 'Continue tracking your mood daily to identify patterns and triggers.',
      'priority': 'medium'
    })
  
  if chat_frequency < 2:
    recommendations.append({
      'title': 'Engage with Support Resources',
      'description': 'Use the AI assistant and other support tools regularly for emotional support and guidance.',
      'priority': 'low'
    })
  
  # Add cognitive restructuring recommendations
  if cognitive_records:
    recent_cognitive = cognitive_records.filter(created_at__gte=timezone.now() - timedelta(days=7))
    if recent_cognitive.exists():
      avg_improvement = sum((c.after_feeling - c.before_feeling) for c in recent_cognitive) / recent_cognitive.count()
      if avg_improvement > 10:
        recommendations.append({
          'title': 'Continue Cognitive Restructuring Practice',
          'description': f'Your cognitive restructuring exercises are showing positive results (average improvement: {avg_improvement:.0f} points). Keep practicing to maintain this progress.',
          'priority': 'medium'
        })
      elif recent_cognitive.count() >= 3:
        recommendations.append({
          'title': 'Review Cognitive Restructuring Patterns',
          'description': 'You\'ve completed several cognitive restructuring exercises. Review your patterns to identify which situations trigger negative thoughts most often.',
          'priority': 'low'
        })
    else:
      recommendations.append({
        'title': 'Try Cognitive Restructuring Tools',
        'description': 'Use the cognitive restructuring tool in Self-help Tools to challenge negative thoughts and improve emotional regulation.',
        'priority': 'low'
      })
  else:
    recommendations.append({
      'title': 'Try Cognitive Restructuring Tools',
      'description': 'Use the cognitive restructuring tool in Self-help Tools to challenge negative thoughts and improve emotional regulation.',
      'priority': 'low'
    })
  
  recommendations.extend([
    {
      'title': 'Maintain Self-Care Routine',
      'description': 'Practice regular self-care activities including exercise, healthy eating, and adequate sleep.',
      'priority': 'medium'
    },
    {
      'title': 'Practice Mindfulness',
      'description': 'Consider mindfulness or meditation practices to help manage stress and improve emotional regulation.',
      'priority': 'low'
    }
  ])
  
  return recommendations[:5]

def generate_ai_insights(mood_data, assessment_data, chat_data, cognitive_data, cid):
  """Generate AI-powered insights"""
  if not ai_service.is_available():
    return "AI insights unavailable at this time."
  
  try:
    cognitive_summary = ""
    if cognitive_data:
      avg_improvement = sum(c.get('after_feeling', 0) - c.get('before_feeling', 0) for c in cognitive_data) / len(cognitive_data) if cognitive_data else 0
      cognitive_summary = f"\n    - Cognitive restructuring exercises: {len(cognitive_data)} completed (average improvement: {avg_improvement:.1f} points)"
    
    prompt = f"""
    Based on this mental health data, provide a brief analysis:
    - Mood entries: {len(mood_data)} records
    - Assessments: {len(assessment_data)} completed
    - Chat sessions: {len(chat_data)} conversations{cognitive_summary}
    
    Provide insights on:
    1. Overall mental health trends
    2. Key patterns or concerns
    3. Positive developments
    4. Areas for improvement
    """
    
    return ai_service.generate_response(prompt)
  except Exception as e:
    logger.error('AI insights generation failed: %s', str(e))
    return "Unable to generate AI insights at this time."

def generate_next_steps(latest_assessment, avg_mood, chat_frequency):
  """Generate next steps recommendations"""
  steps = []
  
  # Handle both dict and Assessment object
  crisis = False
  total = 0
  if latest_assessment:
    if hasattr(latest_assessment, 'crisis'):
      crisis = latest_assessment.crisis
      total = latest_assessment.total
    elif isinstance(latest_assessment, dict):
      crisis = latest_assessment.get('crisis', False)
      total = latest_assessment.get('total', 0)
  
  if crisis:
    steps.append({
      'title': 'Contact Mental Health Professional',
      'description': 'Contact a mental health professional immediately for urgent support and assessment.',
      'urgency': 'high'
    })
    steps.append({
      'title': 'Access Crisis Support Resources',
      'description': 'Reach out to crisis support services or hotlines for immediate assistance.',
      'urgency': 'high'
    })
  elif total and total > 10:
    steps.append({
      'title': 'Schedule Professional Appointment',
      'description': 'Schedule an appointment with a mental health professional to discuss your assessment results.',
      'urgency': 'high'
    })
    steps.append({
      'title': 'Continue Monitoring Symptoms',
      'description': 'Keep tracking your mood and symptoms regularly to monitor changes.',
      'urgency': 'medium'
    })
  else:
    steps.append({
      'title': 'Maintain Self-Care Practices',
      'description': 'Continue your current self-care practices and healthy routines.',
      'urgency': 'low'
    })
    steps.append({
      'title': 'Regular Mood Tracking',
      'description': 'Continue tracking your mood daily to identify patterns and trends.',
      'urgency': 'low'
    })
  
  if chat_frequency < 3:
    steps.append({
      'title': 'Increase Engagement with Support Tools',
      'description': 'Engage more frequently with the AI assistant and other support resources.',
      'urgency': 'medium'
    })
  
  steps.append({
    'title': 'Review and Set Personal Goals',
    'description': 'Take time to review your progress and set achievable mental health goals.',
    'urgency': 'low'
  })
  
  return steps[:4]


@api_view(['GET'])
@permission_classes([AllowAny])
def generate_report(request):
  """Generate comprehensive personal mental health report"""
  cid = get_client_id(request)
  if not cid:
    return Response({'ok': False, 'message': 'Missing anonymous ID (X-Client-Id or client_id)'}, status=400)
  
  user = get_user_from_client_id(cid)
  if not user:
    return Response({'ok': False, 'message': 'User not found'}, status=404)
  
  # Get user data from database
  now = timezone.now()
  week_ago = now - timedelta(days=7)
  month_ago = now - timedelta(days=30)
  
  # Get mood data
  recent_moods = MoodEntry.objects.filter(
    user=user,
    date__gte=week_ago.date()
  ).order_by('-date')
  
  mood_scores = [m.score for m in recent_moods]
  avg_mood = round(sum(mood_scores) / len(mood_scores), 2) if mood_scores else 0
  
  # Get assessment data
  assessments = Assessment.objects.filter(user=user).order_by('-created_at')
  latest_assessment = assessments.first()
  assessment_trend = []
  if assessments.count() >= 2:
    recent_assessments = assessments[:3]  # Last 3 assessments
    assessment_trend = [a.total for a in recent_assessments]
  
  # Get chat data
  recent_chats = ChatMessage.objects.filter(
    user=user,
    created_at__gte=week_ago
  ).order_by('-created_at')
  
  chat_frequency = recent_chats.count()
  
  # Get survey data
  surveys = SurveyResponse.objects.filter(user=user).order_by('-created_at')
  sus_scores = [s.score for s in surveys.filter(survey_type='sus') if s.score is not None]
  satisfaction_scores = [s.score for s in surveys.filter(survey_type='satisfaction') if s.score is not None]
  
  # Get cognitive restructuring records
  cognitive_records = CognitiveRecord.objects.filter(user=user).order_by('-created_at')
  recent_cognitive = cognitive_records.filter(created_at__gte=week_ago)
  cognitive_frequency = recent_cognitive.count()
  
  # Generate insights using AI
  mood_data = [{'score': m.score, 'date': m.date.isoformat(), 'at': m.created_at.isoformat()} for m in MoodEntry.objects.filter(user=user)]
  assessment_data = [{'total': a.total, 'level': a.level, 'crisis': a.crisis, 'at': a.created_at.isoformat()} for a in assessments]
  chat_data = [{'message': c.message, 'response': c.response, 'at': c.created_at.isoformat()} for c in ChatMessage.objects.filter(user=user)]
  cognitive_data = [{
    'situation': c.situation,
    'automatic_thought': c.automatic_thought,
    'emotion_intensity': c.emotion_intensity,
    're_rate': c.re_rate,
    'before_feeling': c.before_feeling,
    'after_feeling': c.after_feeling,
    'at': c.created_at.isoformat()
  } for c in cognitive_records]
  
  insights = generate_ai_insights(mood_data, assessment_data, chat_data, cognitive_data, cid)
  
  # Process AI insights - handle both dict and string responses
  ai_insights_data = {}
  if isinstance(insights, dict):
    if insights.get('success'):
      ai_insights_data = {
        'summary': insights.get('message', 'AI insights unavailable at this time.'),
        'generated_at': now.isoformat()
      }
    else:
      ai_insights_data = {
        'summary': insights.get('message', 'Unable to generate AI insights at this time.'),
        'generated_at': now.isoformat()
      }
  elif isinstance(insights, str):
    ai_insights_data = {
      'summary': insights,
      'generated_at': now.isoformat()
    }
  else:
    ai_insights_data = {
      'summary': 'AI insights unavailable at this time.',
      'generated_at': now.isoformat()
    }
  
  # Ensure mood analysis has valid data
  mood_trend = calculate_mood_trend(mood_scores) if mood_scores else 'insufficient_data'
  mood_consistency = calculate_mood_consistency(mood_scores) if mood_scores else 'insufficient_data'
  
  # Create comprehensive report
  report = {
    'generated_at': now.isoformat(),
    'period': {
      'start': week_ago.isoformat(),
      'end': now.isoformat()
    },
    'summary': {
      'total_days_tracked': MoodEntry.objects.filter(user=user).count(),
      'recent_mood_average': round(avg_mood, 2) if avg_mood else 0,
      'assessment_count': assessments.count(),
      'chat_sessions': chat_frequency,
      'cognitive_records': cognitive_records.count(),
      'overall_wellbeing': calculate_overall_wellbeing(avg_mood, latest_assessment, chat_frequency)
    },
    'mood_analysis': {
      'average_score': round(avg_mood, 2) if avg_mood else 0,
      'trend': mood_trend,
      'consistency': mood_consistency,
      'best_day': max(mood_data, key=lambda x: x['score'])['date'] if mood_data else None,
      'challenging_day': min(mood_data, key=lambda x: x['score'])['date'] if mood_data else None
    },
    'assessment_analysis': {
      'latest_score': latest_assessment.total if latest_assessment else None,
      'latest_level': latest_assessment.level if latest_assessment else None,
      'crisis_detected': latest_assessment.crisis if latest_assessment else False,
      'trend': assessment_trend,
      'improvement': calculate_assessment_improvement(assessment_trend) if len(assessment_trend) >= 2 else 'insufficient_data'
    },
    'chat_analysis': {
      'total_sessions': ChatMessage.objects.filter(user=user).count(),
      'recent_sessions': chat_frequency,
      'engagement_level': calculate_engagement_level(chat_frequency),
      'top_concerns': extract_top_concerns(chat_data)
    },
    'cognitive_analysis': {
      'total_records': cognitive_records.count(),
      'recent_records': cognitive_frequency,
      'average_improvement': calculate_cognitive_improvement(cognitive_records) if cognitive_records.exists() else None,
      'common_situations': extract_common_situations(cognitive_data) if cognitive_data else []
    },
    'recommendations': generate_recommendations(avg_mood, latest_assessment, chat_frequency, cognitive_records),
    'ai_insights': ai_insights_data,
    'next_steps': generate_next_steps(latest_assessment, avg_mood, chat_frequency)
  }
  
  logger.info('Personal report generated for cid=%s', cid)
  return Response({'ok': True, 'data': report})


@api_view(['POST'])
@permission_classes([AllowAny])
def cognitive_save(request):
  """Save cognitive restructuring record"""
  cid = get_client_id(request)
  if not cid:
    return Response({'ok': False, 'message': 'Missing anonymous ID'}, status=400)

  user = get_user_from_client_id(cid)
  if not user:
    return Response({'ok': False, 'message': 'User not found'}, status=404)

  data = request.data or {}
  
  # Validate required fields
  required_fields = ['situation', 'automaticThought', 'emotionIntensity', 'evidence', 'alternative', 'reRate', 'beforeFeeling', 'afterFeeling']
  for field in required_fields:
    if field not in data:
      return Response({'ok': False, 'message': f'Missing required field: {field}'}, status=400)

  try:
    record = CognitiveRecord.objects.create(
      user=user,
      situation=data.get('situation', ''),
      automatic_thought=data.get('automaticThought', ''),
      emotion_intensity=int(data.get('emotionIntensity', 50)),
      evidence=data.get('evidence', ''),
      alternative=data.get('alternative', ''),
      re_rate=int(data.get('reRate', 30)),
      before_feeling=int(data.get('beforeFeeling', 50)),
      after_feeling=int(data.get('afterFeeling', 40))
    )
    
    logger.info('Cognitive record saved for cid=%s', cid)
    return Response({
      'ok': True,
      'data': {
        'id': record.id,
        'created_at': record.created_at.isoformat()
      }
    })
  except Exception as e:
    logger.error('Error saving cognitive record: %s', str(e))
    return Response({'ok': False, 'message': 'Failed to save cognitive record'}, status=500)