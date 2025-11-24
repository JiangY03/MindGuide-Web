from django.apps import AppConfig
import logging
import subprocess
import time
import os

logger = logging.getLogger(__name__)

# Flag to prevent duplicate initialization
_ai_initialized = False


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        """Initialize AI service when Django starts"""
        global _ai_initialized
        
        # Prevent duplicate initialization (Django calls ready() multiple times in dev mode)
        if _ai_initialized:
            return
        
        # Only initialize in main process (not in reloader subprocess)
        # Check for Django's runserver reloader
        import sys
        if 'runserver' in sys.argv:
            # In Django's runserver, the reloader creates a child process
            # We only want to run in the main process
            if os.environ.get('RUN_MAIN') != 'true':
                return
        
        _ai_initialized = True
        
        try:
            from .ai_service import ai_service
            from django.conf import settings
            
            logger.info("=" * 60)
            logger.info("Initializing AI Service...")
            logger.info("=" * 60)
            
            # Check if Ollama is available
            if ai_service.is_available():
                logger.info(f"✓ AI service (Ollama) is available at {settings.OLLAMA_BASE_URL}")
                logger.info(f"  Model: {settings.AI_MODEL_NAME}")
                logger.info("  Status: Ready to use")
            else:
                logger.warning(f"⚠ AI service (Ollama) is not available at {settings.OLLAMA_BASE_URL}")
                logger.info("  Attempting to start Ollama service...")
                
                # Try to start Ollama in the background
                try:
                    # Check if ollama command exists
                    result = subprocess.run(['which', 'ollama'], 
                                          capture_output=True, 
                                          text=True, 
                                          timeout=2)
                    if result.returncode == 0:
                        ollama_path = result.stdout.strip()
                        logger.info(f"  Found Ollama at: {ollama_path}")
                        
                        # Try to start Ollama serve in background
                        try:
                            # Check if Ollama is already running (cross-platform)
                            if os.name == 'nt':  # Windows
                                check_result = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq ollama.exe'],
                                                             capture_output=True,
                                                             timeout=2)
                                is_running = 'ollama.exe' in check_result.stdout.decode('utf-8', errors='ignore')
                            else:  # macOS/Linux
                                check_result = subprocess.run(['pgrep', '-f', 'ollama serve'],
                                                             capture_output=True,
                                                             timeout=2)
                                is_running = check_result.returncode == 0
                            
                            if is_running:
                                logger.info("  Ollama service is already running")
                                # Wait a moment and check again
                                time.sleep(1)
                                if ai_service.is_available():
                                    logger.info("  ✓ Connected to Ollama service")
                            else:
                                logger.info("  Starting Ollama service in background...")
                                # Start Ollama in background (non-blocking)
                                subprocess.Popen(['ollama', 'serve'],
                                               stdout=subprocess.PIPE,
                                               stderr=subprocess.PIPE,
                                               start_new_session=True)
                                # Wait a bit for Ollama to start
                                logger.info("  Waiting for Ollama to start...")
                                for i in range(5):  # Try for 5 seconds
                                    time.sleep(1)
                                    if ai_service.is_available():
                                        logger.info(f"  ✓ Ollama service started successfully (took {i+1}s)")
                                        break
                                else:
                                    logger.warning("  ⚠ Ollama service may still be starting.")
                                    logger.info("  Please wait a moment and try again, or start manually: ollama serve")
                        except Exception as e:
                            logger.warning(f"  Could not start Ollama automatically: {e}")
                            logger.info("  Please start Ollama manually: ollama serve")
                    else:
                        logger.warning("  Ollama command not found. Please install Ollama first.")
                        logger.info("  Installation: https://ollama.ai")
                        logger.info("  After installation, start with: ollama serve")
                except Exception as e:
                    logger.warning(f"  Could not check for Ollama: {e}")
                    logger.info("  Please ensure Ollama is installed and running: ollama serve")
            
            logger.info("=" * 60)
                    
        except Exception as e:
            logger.error(f"Error initializing AI service: {e}")
            import traceback
            logger.error(traceback.format_exc())
