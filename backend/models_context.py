from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime
import json

class ConversationSession(Base):
    __tablename__ = "conversation_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Optional user association
    title = Column(String)  # Auto-generated or user-provided title
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    session_metadata = Column(Text)  # JSON string for additional metadata
    
    # Relationships
    user = relationship("User", back_populates="conversation_sessions")
    context_entries = relationship("ContextEntry", back_populates="session", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "title": self.title,
            "created_at": self.created_at.isoformat(),
            "last_updated": self.last_updated.isoformat(),
            "is_active": self.is_active,
            "metadata": json.loads(self.session_metadata) if self.session_metadata else {}
        }

class ContextEntry(Base):
    __tablename__ = "context_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    context_id = Column(String, unique=True, index=True, nullable=False)
    session_id = Column(String, ForeignKey("conversation_sessions.session_id"), nullable=False)
    user_input = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    context_type = Column(String, default="conversation")  # conversation, query, analysis, etc.
    timestamp = Column(DateTime, default=datetime.utcnow)
    summary = Column(Text)  # Auto-generated summary
    relevance_score = Column(Integer, default=0)  # For search relevance
    entry_metadata = Column(Text)  # JSON string for additional metadata
    is_deleted = Column(Boolean, default=False)
    
    # Relationships
    session = relationship("ConversationSession", back_populates="context_entries")
    
    def to_dict(self):
        return {
            "id": self.id,
            "context_id": self.context_id,
            "session_id": self.session_id,
            "user_input": self.user_input,
            "ai_response": self.ai_response,
            "context_type": self.context_type,
            "timestamp": self.timestamp.isoformat(),
            "summary": self.summary,
            "relevance_score": self.relevance_score,
            "metadata": json.loads(self.entry_metadata) if self.entry_metadata else {},
            "is_deleted": self.is_deleted
        }

class ContextVector(Base):
    __tablename__ = "context_vectors"
    
    id = Column(Integer, primary_key=True, index=True)
    context_id = Column(String, ForeignKey("context_entries.context_id"), nullable=False)
    vector_data = Column(Text, nullable=False)  # JSON string representing embedding vector
    vector_model = Column(String)  # Model used to generate vector
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    context_entry = relationship("ContextEntry")

# Update User model to include conversation sessions relationship
from .models import User

# Add the relationship to User model (this would ideally be in models.py)
User.conversation_sessions = relationship("ConversationSession", back_populates="user")
