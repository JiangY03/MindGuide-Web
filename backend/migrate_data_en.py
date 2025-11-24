#!/usr/bin/env python
"""
Data migration script - Migrate in-memory data to database
This script creates sample users and sample data to ensure the system has data to display
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, MoodEntry, Assessment, ChatMessage, SurveyResponse
from django.utils import timezone

def create_sample_data():
    """Create sample data"""
    print("Starting to create sample data...")
    
    # Create sample user
    email = "demo@example.com"
    username = "demo_user"
    
    # Delete existing user if exists
    if User.objects.filter(email=email).exists():
        User.objects.filter(email=email).delete()
        print(f"Deleted existing user: {email}")
    
    # Create new user
    user = User.objects.create_user(
        username=username,
        email=email,
        password="demo123",
        first_name="Demo"
    )
    
    # Create user profile
    profile = UserProfile.objects.create(
        user=user,
        client_id=f"email:{email}"
    )
    
    print(f"Created user: {email}")
    
    # Create sample mood data (past 7 days)
    mood_scores = [3, 4, 2, 3, 4, 3, 2]  # Sample mood scores
    for i in range(7):
        date = timezone.now().date() - timedelta(days=i)
        MoodEntry.objects.create(
            user=user,
            date=date,
            score=mood_scores[i],
            note=f"Sample mood entry {i+1}"
        )
    
    print("Created 7 days of sample mood data")
    
    # Create sample assessment data
    assessment = Assessment.objects.create(
        user=user,
        answers=[1, 2, 0, 1, 2, 1, 0, 1, 0],  # PHQ-9 answers
        total=8,
        level='mild',
        crisis=False,
        ai_summary="Based on PHQ-9 assessment, you are currently in a mild depressive state. It is recommended to continue monitoring symptoms and consider seeking professional help.",
        ai_recommendations=["Continue monitoring symptoms", "Consider seeking professional help", "Maintain a positive lifestyle"],
        ai_risk_level="low"
    )
    
    print("Created sample assessment data")
    
    # Create sample chat data
    chat_messages = [
        ("I'm not feeling well today", "I understand how you're feeling right now. Please tell me more about your situation today, and I'll do my best to help you."),
        ("I'm feeling a bit anxious", "Anxiety is a very common emotion. You can try deep breathing exercises, or tell me what's making you feel anxious."),
        ("Thank you for your help", "You're welcome! I'm glad I could help you. Remember, seeking help is a brave act.")
    ]
    
    for message, response in chat_messages:
        ChatMessage.objects.create(
            user=user,
            message=message,
            response=response
        )
    
    print("Created sample chat data")
    
    # Create sample survey data
    SurveyResponse.objects.create(
        user=user,
        survey_type='sus',
        answers=[4, 5, 3, 4, 5, 4, 3, 4, 5, 4],  # SUS survey answers
        score=42,
        comment="Good system usability experience"
    )
    
    SurveyResponse.objects.create(
        user=user,
        survey_type='satisfaction',
        answers=[4, 5, 4, 5, 4],  # Satisfaction survey answers
        score=22,
        comment="Very satisfied with the service"
    )
    
    print("Created sample survey data")
    
    print(f"\n✅ Sample data creation completed!")
    print(f"User email: {email}")
    print(f"Password: demo123")
    print(f"Client ID: {profile.client_id}")
    print(f"Mood entries: {MoodEntry.objects.filter(user=user).count()} records")
    print(f"Assessment records: {Assessment.objects.filter(user=user).count()} records")
    print(f"Chat records: {ChatMessage.objects.filter(user=user).count()} records")
    print(f"Survey records: {SurveyResponse.objects.filter(user=user).count()} records")

if __name__ == "__main__":
    create_sample_data()
