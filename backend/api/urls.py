from django.urls import path
from . import views

urlpatterns = [
  path('health/', views.health),                    # Health check endpoint
  path('auth/login', views.auth_login),             # User login with email/password
  path('auth/register', views.auth_register),      # User registration
  path('auth/anon', views.auth_anon),              # Anonymous user creation
  path('moods', views.moods_root),                 # Mood data (GET/POST)
  path('moods/summary', views.moods_summary),      # Mood statistics summary
  path('moods/add', views.moods_add),              # Add mood entry
  path('moods/', views.moods_add),                 # Support POST to /api/moods/
  path('assessment/submit', views.assessment_submit), # Submit PHQ-9 assessment
  path('assessment/last', views.assessment_last),   # Get latest assessment
  path('chat', views.chat),                        # Send chat message
  path('chat/history', views.chat_history),        # Get chat history
  path('report', views.generate_report),           # Generate personal report
  path('cognitive/save', views.cognitive_save),    # Save cognitive restructuring record
]


