import time
import uuid
import json
import requests

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request, File, UploadFile
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

# Import models and database
from .database import engine, get_db
from .models import Base, User, UserRole, ScheduledQuery, ScheduledResult, QueryLog
from .query_governance.suspicious_detector import suspicious_detector
from .insights_engine import insights_engine
from .schemas import (
    UserLogin, Token, TokenData, QueryRequest, QueryResponse, SchemaResponse,
    Transaction, HighRiskTransaction, AIAgent, SystemMetrics,
    NearbyBranchRequest, NearbyBranchResponse, AuditLogEntry,
    AIAgentCreate, VoiceTranscribeResponse,
    ScheduledQueryCreate, ScheduledQueryOut, ScheduledResultOut,
    QueryLogEntry, InsightAlert
)

# Import context management
from .context_llm import context_llm
from .schemas_context import (
    ContextRequest, ContextResponse, ConversationHistory, SearchRequest,
    DeleteContextRequest, DeleteContextResponse, SessionStats,
    CreateSessionRequest, CreateSessionResponse, SessionList
)

# Import services
from .services import QueryService, TransactionService, BranchService, MetricsService, AgentService
from .audit import audit_service

# Import auth
from .auth import (
    authenticate_user, create_access_token, get_current_active_user,
    require_admin, timedelta, settings
)

# Import engines
from .fraud_engine import fraud_engine
from .llm_engine import llm_engine

# Create database tables
Base.metadata.create_all(bind=engine)

from sqlalchemy import text
try:
    with engine.begin() as conn:
        for column_query in [
            "ALTER TABLE audit_logs ADD COLUMN role VARCHAR;",
            "ALTER TABLE audit_logs ADD COLUMN nl_query TEXT;",
            "ALTER TABLE audit_logs ADD COLUMN generated_sql TEXT;",
            "ALTER TABLE audit_logs ADD COLUMN rows_returned INTEGER;",
            "ALTER TABLE audit_logs ADD COLUMN source_type VARCHAR;",
            "ALTER TABLE audit_logs ADD COLUMN suspicious_flag BOOLEAN DEFAULT 0;",
            "ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR;",
            "ALTER TABLE audit_logs ADD COLUMN hybrid_flag BOOLEAN DEFAULT 0;",
            "ALTER TABLE audit_logs ADD COLUMN agent_name VARCHAR;",
            "ALTER TABLE audit_logs ADD COLUMN detected_pattern VARCHAR;",
            "ALTER TABLE query_logs ADD COLUMN query_risk_score FLOAT DEFAULT 0.0;",
            "ALTER TABLE query_logs ADD COLUMN query_risk_level VARCHAR DEFAULT 'low';"
        ]:
            try:
                conn.execute(text(column_query))
            except Exception:
                pass
except Exception:
    pass

from .quantum_fraud.performance_monitor import initialize_quantum_metrics
try:
    with Session(engine) as db:
        initialize_quantum_metrics(db)
except Exception:
    pass

from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
from .scheduler import start_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield

# Initialize FastAPI app
app = FastAPI(
    title="Banking Intelligence Copilot",
    description="AI-powered banking intelligence and fraud detection system",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
query_service = QueryService()
transaction_service = TransactionService()
branch_service = BranchService()
metrics_service = MetricsService()
agent_service = AgentService()

security = HTTPBearer()

# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Authentication endpoints
@app.post("/api/auth/login", response_model=Token)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token"""
    user = authenticate_user(db, user_login.username, user_login.password)
    if not user:
        audit_service.log_authentication(
            user_id=None,
            username=user_login.username,
            success=False,
            db=db
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    audit_service.log_authentication(
        user_id=user.id,
        username=user.username,
        success=True,
        db=db
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "role": user.role
    }

# Query endpoints
@app.post("/api/query", response_model=QueryResponse)
async def execute_query(
    request: Request,
    query_request: QueryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Execute natural language query with governance, insights, and session context"""
    start_time = time.time()
    ip_address = request.client.host if request.client else "unknown"
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    
    # 1. Start Logging Utility
    def log_to_governance(suspicious=False, reason=None, sql="", results_count=0, exec_time=0, risk_score=0.0, risk_level="low"):
        new_log = QueryLog(
            user_id=current_user.id,
            role=role_val,
            nl_query=query_request.natural_language,
            generated_sql=sql,
            rows_returned=results_count,
            execution_time_ms=exec_time,
            source_type=query_request.source_type,
            suspicious_flag=suspicious,
            block_reason=reason,
            ip_address=ip_address,
            query_risk_score=risk_score,
            query_risk_level=risk_level
        )
        db.add(new_log)
        db.commit()

    # 2. Suspicious Detection Engine check
    check = suspicious_detector.check_query(current_user.id, query_request.natural_language, db)
    if check["suspicious"]:
        log_to_governance(suspicious=True, reason=check["reason"], risk_score=0.9, risk_level="high")
        raise HTTPException(status_code=429, detail=f"Blocked: {check['reason']}")

    try:
        # 3. SQL Generation & Execution with session support
        result = query_service.execute_natural_language_query(
            query_request.natural_language, 
            db, 
            current_user,
            session_id=query_request.session_id,
            explain=query_request.explain_query
        )
        
        execution_time = int((time.time() - start_time) * 1000)
        
        # 4. Generate Auto Insights
        insights = insights_engine.generate_insights(result.results, query_request.natural_language)
        
        # 5. Log final result
        log_to_governance(
            sql=result.sql, 
            results_count=len(result.results), 
            exec_time=execution_time,
            risk_score=result.query_risk_score,
            risk_level=result.query_risk_level,
            reason=result.clarification if result.clarification_required else None,
            suspicious=result.clarification_required
        )
        
        # Map result to response schema
        response = QueryResponse(
            sql=result.sql,
            params=result.params,
            explanation=result.explanation,
            confidence=result.confidence,
            clarification=result.clarification,
            clarification_required=result.clarification_required,
            results=result.results,
            execution_time_ms=execution_time,
            insights=InsightAlert(**insights) if insights else None,
            explanation_details=result.explanation_details,
            query_risk_level=result.query_risk_level,
            query_risk_score=result.query_risk_score,
            is_truncated=result.is_truncated
        )
        return response
        
    except Exception as e:
        execution_time = int((time.time() - start_time) * 1000)
        log_to_governance(reason=str(e), exec_time=execution_time, risk_score=0.5, risk_level="medium")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query execution failed: {str(e)}"
        )

@app.get("/api/query-logs", response_model=List[QueryLogEntry])
async def get_query_logs(
    suspicious_only: bool = False,
    user_id: Optional[int] = None,
    source_type: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get query governance logs"""
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    query = db.query(QueryLog)
    
    if role_val != "admin":
        query = query.filter(QueryLog.user_id == current_user.id)
    elif user_id:
        query = query.filter(QueryLog.user_id == user_id)
        
    if suspicious_only:
        query = query.filter(QueryLog.suspicious_flag == True)
    if source_type:
        query = query.filter(QueryLog.source_type == source_type)
        
    return query.order_by(QueryLog.timestamp.desc()).limit(100).all()

@app.post("/api/voice-transcribe")
async def voice_transcribe(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Transcribe voice using Sarvam STT API"""
    start_time = time.time()
    
    # 1. Validate file size (10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024
    audio_content = await file.read()
    if len(audio_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
    # 2. Validate MIME type
    allowed_types = ["audio/webm", "audio/wav", "audio/mpeg", "audio/mp3", "audio/ogg"]
    if file.content_type not in allowed_types and not any(file.filename.endswith(ext) for ext in [".wav", ".webm", ".mp3", ".ogg"]):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    try:
        if not settings.SARVAM_API_KEY:
            raise HTTPException(status_code=500, detail="SARVAM_API_KEY not configured")

        headers = {
            "api-subscription-key": settings.SARVAM_API_KEY
        }
        
        # Sarvam expects multipart form data with the file
        files = {
            'file': (file.filename, audio_content, file.content_type),
        }
        data = {
            'model': 'saaras:v2.5' # Translation model
        }
        
        sarvam_url = "https://api.sarvam.ai/speech-to-text-translate"
        response = requests.post(sarvam_url, headers=headers, files=files, data=data)
        
        if not response.ok:
            # Fallback to standard speech to text if translate is not available or errors out
            sarvam_url = "https://api.sarvam.ai/speech-to-text"
            data['model'] = 'saaras:v3' # STT model
            
            # Re-create files tuple
            files = { 'file': (file.filename, audio_content, file.content_type) }
            
            response = requests.post(sarvam_url, headers=headers, files=files, data=data)
            
        if not response.ok:
            raise Exception(f"Sarvam API error: {response.text}")
            
        result_json = response.json()
        transcribed_text = result_json.get("transcript", "")
        language_detected = result_json.get("language_code", "en-IN") 
        
        latency = int((time.time() - start_time) * 1000)
        
        # Log success
        audit_service.log_data_access(
            user_id=current_user.id,
            action="voice_transcription",
            resource="voice_assistant",
            details={"latency_ms": latency},
            db=db
        )
        
        # We also need to mark success manually since log_data_access doesn't take status or execution_time
        # Let's import AuditLog locally to avoid import issues
        from .models import AuditLog
        last_log = db.query(AuditLog).filter_by(user_id=current_user.id, action="voice_transcription").order_by(AuditLog.id.desc()).first()
        if last_log:
            last_log.execution_time_ms = latency
            last_log.status = "success"
            db.commit()

        return {
            "transcribed_text": transcribed_text,
            "detected_language": language_detected,
            "latency_ms": latency
        }

    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        import traceback
        tb = traceback.format_exc()
        print("Transcription Exception:", tb)
        
        # Log failure
        audit_service.log_data_access(
            user_id=current_user.id,
            action="voice_transcription",
            resource="voice_assistant",
            details={"error": str(e), "latency_ms": latency},
            db=db
        )
        
        from .models import AuditLog
        last_log = db.query(AuditLog).filter_by(user_id=current_user.id, action="voice_transcription").order_by(AuditLog.id.desc()).first()
        if last_log:
            last_log.execution_time_ms = latency
            last_log.status = "error"
            db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}\n\nTraceback:\n{tb}"
        )

@app.get("/api/schema", response_model=SchemaResponse)
async def get_database_schema(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get database schema information"""
    try:
        schema = query_service.get_database_schema(db)
        
        audit_service.log_data_access(
            user_id=current_user.id,
            action="schema_access",
            resource="database_schema",
            details={},
            db=db
        )
        
        return schema
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get schema: {str(e)}"
        )

# Transaction endpoints
@app.get("/api/transactions", response_model=List[dict])
async def get_transactions(
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get transactions with fraud analysis"""
    try:
        transactions = transaction_service.get_transactions(db, limit)
        
        audit_service.log_data_access(
            user_id=current_user.id,
            action="transactions_access",
            resource="transactions",
            details={"limit": limit},
            db=db
        )
        
        return transactions
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get transactions: {str(e)}"
        )

@app.get("/api/fraud/high-risk", response_model=List[HighRiskTransaction])
async def get_high_risk_transactions(
    threshold: float = 0.7,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get high-risk transactions"""
    try:
        high_risk = transaction_service.get_high_risk_transactions(db, threshold)
        
        audit_service.log_data_access(
            user_id=current_user.id,
            action="high_risk_access",
            resource="fraud_transactions",
            details={"threshold": threshold},
            db=db
        )
        
        return high_risk
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get high-risk transactions: {str(e)}"
        )

# AI Agent endpoints
@app.get("/api/agents", response_model=List[dict])
async def get_agents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all AI agents"""
    try:
        agents = agent_service.get_agents(db)
        
        audit_service.log_data_access(
            user_id=current_user.id,
            action="agents_access",
            resource="ai_agents",
            details={},
            db=db
        )
        
        return agents
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agents: {str(e)}"
        )

@app.get("/api/agents/{agent_id}", response_model=dict)
async def get_agent_by_id(
    agent_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get agent by ID"""
    try:
        agent = agent_service.get_agent_by_id(agent_id, db)
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )
        
        audit_service.log_data_access(
            user_id=current_user.id,
            action="agent_access",
            resource="ai_agent",
            details={"agent_id": agent_id},
            db=db
        )
        
        return agent
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agent: {str(e)}"
        )

# Audit endpoints
@app.get("/api/audit/{user_id}", response_model=List[AuditLogEntry])
async def get_audit_logs(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get audit logs (admin sees all, users see their own)"""
    try:
        role_value = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
        is_admin = role_value in ["admin", "auditor"]
        
        if not is_admin and (user_id == 0 or user_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to view these logs")
            
        target_user_id = None if (user_id == 0 and is_admin) else user_id
        logs = audit_service.get_audit_trail(user_id=target_user_id, db=db)
        
        audit_service.log_data_access(
            user_id=current_user.id,
            action="audit_access",
            resource="audit_logs",
            details={"target_user_id": user_id},
            db=db
        )
        
        return logs
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get audit logs: {str(e)}"
        )

# Metrics endpoint
@app.get("/api/metrics", response_model=SystemMetrics)
async def get_system_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get system performance metrics"""
    try:
        metrics = metrics_service.get_system_metrics(db)
        
        audit_service.log_data_access(
            user_id=current_user.id,
            action="metrics_access",
            resource="system_metrics",
            details={},
            db=db
        )
        
        return metrics
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get metrics: {str(e)}"
        )

# Branch endpoints
@app.get("/api/branches/nearby", response_model=NearbyBranchResponse)
async def get_nearby_branches(
    lat: float,
    lng: float,
    radius: float = 10.0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get nearby bank branches"""
    try:
        branches = branch_service.get_nearby_branches(lat, lng, radius, db)
        
        audit_service.log_data_access(
            user_id=current_user.id,
            action="branches_search",
            resource="bank_branches",
            details={"lat": lat, "lng": lng, "radius": radius},
            db=db
        )
        
        return NearbyBranchResponse(branches=branches, count=len(branches))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get nearby branches: {str(e)}"
        )

# Context Management Endpoints
@app.post("/api/context/chat", response_model=ContextResponse)
async def chat_with_context(
    context_request: ContextRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Chat with AI using context memory"""
    try:
        # Add user info to metadata
        metadata = context_request.metadata or {}
        metadata["user_id"] = current_user.id
        metadata["user_role"] = current_user.role.value
        
        result = context_llm.process_with_context(
            user_input=context_request.user_input,
            session_id=context_request.session_id,
            context_type=context_request.context_type,
            metadata=metadata
        )
        
        # Log the interaction
        audit_service.log_data_access(
            user_id=current_user.id,
            action="context_chat",
            resource="conversation",
            details={
                "session_id": context_request.session_id,
                "context_used": result.get("context_used", False),
                "processing_time_ms": result.get("processing_time_ms", 0)
            },
            db=None  # We'll handle this separately since context is in-memory
        )
        
        return ContextResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Context chat failed: {str(e)}"
        )

@app.get("/api/context/history/{session_id}", response_model=ConversationHistory)
async def get_conversation_history(
    session_id: str,
    limit: Optional[int] = None,
    include_metadata: bool = False,
    current_user: User = Depends(get_current_active_user)
):
    """Get conversation history for a session"""
    try:
        history = context_llm.get_conversation_history(
            session_id=session_id,
            limit=limit,
            include_metadata=include_metadata
        )
        
        audit_service.log_data_access(
            user_id=current_user.id,
            action="context_history",
            resource="conversation",
            details={"session_id": session_id, "limit": limit},
            db=None
        )
        
        return ConversationHistory(**history)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversation history: {str(e)}"
        )

@app.post("/api/context/search", response_model=List[Dict[str, Any]])
async def search_conversation(
    search_request: SearchRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Search within conversation history"""
    try:
        results = context_llm.search_conversation(
            session_id=search_request.session_id,
            query=search_request.query,
            search_type=search_request.search_type
        )
        
        audit_service.log_data_access(
            user_id=current_user.id,
            action="context_search",
            resource="conversation",
            details={
                "session_id": search_request.session_id,
                "query": search_request.query,
                "search_type": search_request.search_type
            },
            db=None
        )
        
        return results
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conversation search failed: {str(e)}"
        )

@app.delete("/api/context/delete", response_model=DeleteContextResponse)
async def delete_conversation_context(
    delete_request: DeleteContextRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Delete conversation context"""
    try:
        result = context_llm.delete_conversation(
            session_id=delete_request.session_id,
            context_id=delete_request.context_id
        )
        
        audit_service.log_data_access(
            user_id=current_user.id,
            action="context_delete",
            resource="conversation",
            details={
                "session_id": delete_request.session_id,
                "context_id": delete_request.context_id
            },
            db=None
        )
        
        return DeleteContextResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete context: {str(e)}"
        )

@app.get("/api/context/stats/{session_id}", response_model=SessionStats)
async def get_session_statistics(
    session_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get session statistics"""
    try:
        stats = context_llm.get_session_stats(session_id)
        
        audit_service.log_data_access(
            user_id=current_user.id,
            action="context_stats",
            resource="conversation",
            details={"session_id": session_id},
            db=None
        )
        
        return SessionStats(**stats)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session stats: {str(e)}"
        )

@app.post("/api/scheduled", response_model=ScheduledQueryOut)
async def create_scheduled_query(
    sq: ScheduledQueryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    new_sq = ScheduledQuery(
        user_id=current_user.id,
        nl_query=sq.nl_query,
        frequency=sq.frequency,
        delivery_method=sq.delivery_method,
        webhook_url=sq.webhook_url,
        is_active=sq.is_active
    )
    db.add(new_sq)
    db.commit()
    db.refresh(new_sq)
    return new_sq

@app.get("/api/scheduled", response_model=List[ScheduledQueryOut])
async def list_scheduled_queries(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if role_val in ['admin', 'auditor']:
        return db.query(ScheduledQuery).all()
    return db.query(ScheduledQuery).filter(ScheduledQuery.user_id == current_user.id).all()

@app.put("/api/scheduled/{sq_id}", response_model=ScheduledQueryOut)
async def update_scheduled_query(
    sq_id: int,
    sq_update: ScheduledQueryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    sq = db.query(ScheduledQuery).filter(ScheduledQuery.id == sq_id).first()
    if not sq:
        raise HTTPException(status_code=404, detail="Not found")
        
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if role_val not in ['admin', 'auditor'] and sq.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    sq.nl_query = sq_update.nl_query
    sq.frequency = sq_update.frequency
    sq.delivery_method = sq_update.delivery_method
    sq.webhook_url = sq_update.webhook_url
    sq.is_active = sq_update.is_active
    db.commit()
    db.refresh(sq)
    return sq

@app.delete("/api/scheduled/{sq_id}")
async def delete_scheduled_query(
    sq_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    sq = db.query(ScheduledQuery).filter(ScheduledQuery.id == sq_id).first()
    if not sq:
        raise HTTPException(status_code=404, detail="Not found")
        
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if role_val not in ['admin', 'auditor'] and sq.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    db.delete(sq)
    db.commit()
    return {"message": "Deleted successfully"}

@app.get("/api/scheduled/{sq_id}/results", response_model=List[ScheduledResultOut])
async def list_scheduled_results(
    sq_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    sq = db.query(ScheduledQuery).filter(ScheduledQuery.id == sq_id).first()
    if not sq:
        raise HTTPException(status_code=404, detail="Not found")
        
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if role_val not in ['admin', 'auditor'] and sq.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    return db.query(ScheduledResult).filter(ScheduledResult.scheduled_query_id == sq_id).order_by(ScheduledResult.executed_at.desc()).limit(10).all()

# Quantum Fraud Intelligence endpoints
from pydantic import BaseModel
class QuantumSimulateRequest(BaseModel):
    transaction_id: str
    amount: float
    transaction_type: str = "credit_card"
    is_fraud: Optional[bool] = False

@app.get("/api/quantum/metrics")
async def get_quantum_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    from .models import QuantumModelMetrics
    return db.query(QuantumModelMetrics).all()

@app.post("/api/quantum/simulate")
async def simulate_quantum_inference(
    request_data: QuantumSimulateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    from .quantum_fraud.hybrid_engine import hybrid_engine
    
    start_time = time.time()
    
    # Analyze with hybrid engine
    tx_dict = {
        "transaction_id": request_data.transaction_id,
        "amount": request_data.amount,
        "transaction_type": request_data.transaction_type,
        "is_fraud": request_data.is_fraud
    }
    
    result = hybrid_engine.analyze_transaction(tx_dict)
    
    exec_time_ms = int((time.time() - start_time) * 1000)
    
    # Audit log record
    is_hybrid = result.get("hybrid_triggered", False)
    latency_ms = result.get("inference_latency_ms", exec_time_ms)
    agent_name = result.get("agent_name", "None")
    detected_pattern = result.get("detected_pattern", "None")
    
    # Handle Enum serialization for classical purely
    if hasattr(result.get("risk_level", ""), "value"):
        result["risk_level"] = result["risk_level"].value
    
    from .models import AuditLog
    new_audit = AuditLog(
        user_id=current_user.id,
        action="quantum_inference",
        resource="fraud_engine",
        query=f"Simulate TR-{request_data.transaction_id}",
        parameters=json.dumps(tx_dict),
        execution_time_ms=latency_ms,
        status="success",
        role=current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
        source_type="simulate",
        hybrid_flag=is_hybrid,
        agent_name=agent_name,
        detected_pattern=detected_pattern
    )
    db.add(new_audit)
    db.commit()
    
    return result

@app.get("/api/quantum/agents/status")
async def get_quantum_agents_status(
    current_user: User = Depends(get_current_active_user)
):
    from .quantum_fraud.quantum_agents import fleet
    return [agent.get_status() for agent in fleet]

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "llm_status": llm_engine.get_service_status()
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Banking Intelligence Copilot API",
        "version": "1.0.0",
        "docs": "/docs",
        "llm_available": settings.is_llm_available()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
