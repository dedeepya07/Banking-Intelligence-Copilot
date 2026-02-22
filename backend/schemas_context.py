from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Context Management Schemas
class ContextRequest(BaseModel):
    user_input: str = Field(..., description="User input text")
    session_id: str = Field(..., description="Session identifier")
    context_type: str = Field(default="conversation", description="Type of context")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")

class ContextResponse(BaseModel):
    response: str = Field(..., description="AI response")
    context_id: str = Field(..., description="Generated context ID")
    session_id: str = Field(..., description="Session ID")
    context_used: bool = Field(..., description="Whether previous context was used")
    context_length: int = Field(..., description="Length of context used")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")
    context_summary: str = Field(..., description="Summary of context used")
    error: Optional[str] = Field(default=None, description="Error message if any")

class ConversationHistory(BaseModel):
    session_id: str
    context_history: List[Dict[str, Any]]
    session_summary: str
    total_exchanges: int
    created_at: str
    last_updated: str
    exists: bool

class SearchRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    query: str = Field(..., description="Search query")
    search_type: str = Field(default="semantic", description="Type of search: keyword or semantic")

class SearchResult(BaseModel):
    context_id: str
    user_input: str
    ai_response: str
    timestamp: str
    relevance_score: float
    summary: str

class DeleteContextRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    context_id: Optional[str] = Field(default=None, description="Specific context ID to delete")

class DeleteContextResponse(BaseModel):
    success: bool
    session_id: str
    context_id: Optional[str]
    deleted_item: str

class SessionStats(BaseModel):
    exists: bool
    total_exchanges: Optional[int] = None
    total_characters: Optional[int] = None
    average_exchange_length: Optional[float] = None
    session_duration_seconds: Optional[float] = None
    created_at: Optional[str] = None
    last_updated: Optional[str] = None

# Session Management Schemas
class CreateSessionRequest(BaseModel):
    user_id: Optional[int] = Field(default=None, description="User ID if authenticated")
    title: Optional[str] = Field(default=None, description="Session title")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Session metadata")

class CreateSessionResponse(BaseModel):
    session_id: str
    user_id: Optional[int]
    title: str
    created_at: str
    is_active: bool

class SessionList(BaseModel):
    sessions: List[Dict[str, Any]]
    total_count: int

class SessionUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, description="New session title")
    is_active: Optional[bool] = Field(default=None, description="Session active status")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Updated metadata")

# Context Analysis Schemas
class ContextAnalysis(BaseModel):
    session_id: str
    total_exchanges: int
    key_topics: List[str]
    sentiment_analysis: Optional[Dict[str, Any]] = None
    conversation_flow: List[str]
    engagement_metrics: Dict[str, float]

class ContextExport(BaseModel):
    session_id: str
    export_format: str = Field(default="json", description="Export format: json, csv, txt")
    include_metadata: bool = Field(default=True, description="Include metadata in export")
    
class ContextExportResponse(BaseModel):
    download_url: str
    file_name: str
    file_size: int
    export_format: str
    created_at: str
