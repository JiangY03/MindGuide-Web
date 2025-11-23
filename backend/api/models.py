from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class UserProfile(models.Model):
    """User profile"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    client_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} ({self.client_id})"

class MoodEntry(models.Model):
    """Mood entry"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mood_entries')
    date = models.DateField()
    score = models.IntegerField()  # 1-5
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.email} - {self.date}: {self.score}"

class Assessment(models.Model):
    """Mental health assessment"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assessments')
    answers = models.JSONField()  # Store 9 question answers
    total = models.IntegerField()
    level = models.CharField(max_length=50)
    crisis = models.BooleanField(default=False)
    ai_summary = models.TextField(blank=True, null=True)
    ai_recommendations = models.JSONField(default=list, blank=True)
    ai_risk_level = models.CharField(max_length=20, default='low')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.created_at.date()}: {self.total} ({self.level})"

class ChatMessage(models.Model):
    """Chat message"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    message = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.created_at}: {self.message[:50]}..."

class SurveyResponse(models.Model):
    """Survey response"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='survey_responses')
    survey_type = models.CharField(max_length=50)  # 'sus' or 'satisfaction'
    answers = models.JSONField()
    score = models.IntegerField(null=True, blank=True)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.survey_type}: {self.created_at.date()}"

class CognitiveRecord(models.Model):
    """Cognitive restructuring record"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cognitive_records')
    situation = models.TextField()
    automatic_thought = models.TextField()
    emotion_intensity = models.IntegerField()  # 0-100
    evidence = models.TextField()
    alternative = models.TextField()
    re_rate = models.IntegerField()  # 0-100
    before_feeling = models.IntegerField()  # 0-100
    after_feeling = models.IntegerField()  # 0-100
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.created_at.date()}: {self.situation[:50]}..."
