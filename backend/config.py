from typing import Optional
import os
from dotenv import load_dotenv

# Force load from backend directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

class Settings:
    def __init__(self):
        # Database
        self.DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./banking_intelligence.db")
        
        # JWT
        self.SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
        self.ALGORITHM = "HS256"
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
        
        # LLM Configuration
        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        self.OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        self.USE_OPENAI = os.getenv("USE_OPENAI", "false").lower() == "true"
        
        self.OLLAMA_URL = os.getenv("OLLAMA_URL")
        self.OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama2")
        self.OLLAMA_ENABLED = os.getenv("OLLAMA_ENABLED", "false").lower() == "true"
        
        # Phase 2 Configuration (included for future use)
        self.MAPS_API_KEY = os.getenv("MAPS_API_KEY")
        self.VOICE_API_ENABLED = os.getenv("VOICE_API_ENABLED", "false").lower() == "true"
        self.SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
        
        # Application
        self.APP_NAME = os.getenv("APP_NAME", "Banking Intelligence Copilot")
        self.VERSION = os.getenv("VERSION", "1.0.0")
        self.DEBUG = os.getenv("DEBUG", "false").lower() == "true"
        
        # Security
        self.MAX_QUERY_RESULTS = int(os.getenv("MAX_QUERY_RESULTS", "1000"))
        self.QUERY_TIMEOUT_SECONDS = int(os.getenv("QUERY_TIMEOUT_SECONDS", "30"))
        
        # Auto-detect services
        self._post_init()
    
    def _post_init(self):
        """Post-initialization configuration validation"""
        # Auto-detect OpenAI availability
        if self.OPENAI_API_KEY and self.OPENAI_API_KEY.strip():
            self.USE_OPENAI = True
        
        # Auto-detect Ollama availability
        if self.OLLAMA_URL and self.OLLAMA_URL.strip():
            self.OLLAMA_ENABLED = True
    
    def is_llm_available(self) -> bool:
        """Check if any LLM service is available"""
        has_openai = self.USE_OPENAI and self.OPENAI_API_KEY != "your-openai-api-key-here"
        return has_openai or self.OLLAMA_ENABLED
    
    def get_llm_service(self) -> str:
        """Get the preferred LLM service"""
        if self.USE_OPENAI:
            return "openai"
        elif self.OLLAMA_ENABLED:
            return "ollama"
        else:
            return "none"

settings = Settings()
