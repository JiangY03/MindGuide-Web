#!/usr/bin/env python
"""
Data management script - View and manage database data
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

def show_all_data():
    """Display all data"""
    print("=== Database Overview ===\n")
    
    # User data
    users = User.objects.all()
    print(f"Total users: {users.count()}")
    for user in users:
        print(f"  - {user.email} (ID: {user.id})")
    
    # User profiles
    profiles = UserProfile.objects.all()
    print(f"\nUser profiles: {profiles.count()}")
    for profile in profiles:
        print(f"  - {profile.user.email} -> {profile.client_id}")
    
    # Mood data
    moods = MoodEntry.objects.all()
    print(f"\nMood entries: {moods.count()}")
    for mood in moods.order_by('-date')[:5]:  # Show recent 5
        print(f"  - {mood.user.email} | {mood.date} | Score: {mood.score}")
    
    # Assessment data
    assessments = Assessment.objects.all()
    print(f"\nAssessments: {assessments.count()}")
    for assessment in assessments.order_by('-created_at'):
        print(f"  - {assessment.user.email} | Total: {assessment.total} | Level: {assessment.level} | Crisis: {assessment.crisis}")
    
    # Chat data
    chats = ChatMessage.objects.all()
    print(f"\nChat messages: {chats.count()}")
    for chat in chats.order_by('-created_at')[:3]:  # Show recent 3
        print(f"  - {chat.user.email} | {chat.created_at.strftime('%Y-%m-%d %H:%M')} | {chat.message[:30]}...")
    
    # Survey data
    surveys = SurveyResponse.objects.all()
    print(f"\nSurvey responses: {surveys.count()}")
    for survey in surveys.order_by('-created_at'):
        print(f"  - {survey.user.email} | Type: {survey.survey_type} | Score: {survey.score}")

def clear_all_data():
    """Clear all data"""
    print("⚠️  Warning: This will delete all data!")
    confirm = input("Confirm deletion of all data? Type 'YES' to confirm: ")
    
    if confirm == 'YES':
        # Delete all data
        SurveyResponse.objects.all().delete()
        ChatMessage.objects.all().delete()
        Assessment.objects.all().delete()
        MoodEntry.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.all().delete()
        print("✅ All data deleted")
    else:
        print("❌ Operation cancelled")

def create_test_user():
    """Create test user"""
    email = input("Enter user email: ")
    password = input("Enter password: ")
    name = input("Enter name (optional): ")
    
    if not email or not password:
        print("❌ Email and password cannot be empty")
        return
    
    # Check if user already exists
    if User.objects.filter(email=email).exists():
        print(f"❌ User {email} already exists")
        return
    
    # Create user
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=name or ''
    )
    
    # Create user profile
    profile = UserProfile.objects.create(
        user=user,
        client_id=f"email:{email}"
    )
    
    print(f"✅ User created successfully: {email}")
    print(f"Client ID: {profile.client_id}")

def main():
    """Main menu"""
    import sys
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == 'show':
            show_all_data()
        elif command == 'clear':
            clear_all_data()
        else:
            print("Usage: python manage_data_en.py [show|clear]")
        return
    
    # Interactive mode
    try:
        while True:
            print("\n=== Data Management Tool ===")
            print("1. View all data")
            print("2. Create test user")
            print("3. Clear all data")
            print("4. Exit")
            
            choice = input("\nSelect operation (1-4): ")
            
            if choice == '1':
                show_all_data()
            elif choice == '2':
                create_test_user()
            elif choice == '3':
                clear_all_data()
            elif choice == '4':
                print("👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice, please try again")
    except (EOFError, KeyboardInterrupt):
        print("\n👋 Goodbye!")

if __name__ == "__main__":
    main()
