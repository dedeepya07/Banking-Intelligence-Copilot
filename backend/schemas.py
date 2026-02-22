from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    analyst = "analyst"
    auditor = "auditor"
    admin = "admin"

class TransactionType(str, Enum):
    credit_card = "credit_card"
    debit_card = "debit_card"
    UPI = "UPI"
    NEFT = "NEFT"

class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

# Auth Schemas
class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str
    role: UserRole

class TokenData(BaseModel):
    username: Optional[str] = None

# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    email: str  # Changed from EmailStr to str
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Account Schemas
class AccountBase(BaseModel):
    account_number: str
    account_type: str
    balance: float = 0.0

class AccountCreate(AccountBase):
    customer_id: int

class Account(AccountBase):
    id: int
    customer_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Transaction Schemas
class TransactionBase(BaseModel):
    amount: float
    transaction_type: TransactionType
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    account_id: int
    branch_id: Optional[int] = None

class Transaction(TransactionBase):
    id: int
    transaction_id: str
    account_id: int
    customer_name: Optional[str] = None
    timestamp: datetime
    risk_score: float
    risk_level: RiskLevel
    model_used: Optional[str] = None
    fraud_flag: bool = False
    branch_id: Optional[int] = None
    
    class Config:
        from_attributes = True

# Bank Branch Schemas
class BankBranchBase(BaseModel):
    branch_id: str
    bank_name: str
    latitude: float
    longitude: float
    city: str
    state: str
    address: Optional[str] = None

class BankBranchCreate(BankBranchBase):
    pass

class BankBranch(BankBranchBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

# Query Schemas
class QueryRequest(BaseModel):
    natural_language: str
    source_type: Optional[str] = "typed"
    session_id: Optional[str] = None
    explain_query: Optional[bool] = False

class InsightAlert(BaseModel):
    summary: str
    risk_alerts: List[str]
    behavioral_trends: List[str]
    absolute_change: Optional[str] = None
    percentage_change: Optional[str] = None
    seven_day_avg: Optional[str] = None
    comparison_window: Optional[str] = "7 days"
    confidence_level: float = 0.0
    generated_at: str

class QueryExplanation(BaseModel):
    parsed_intent: str
    entity_mapping: Dict[str, Any]
    join_reasoning: List[str]
    filter_interpretation: List[str]
    aggregation_logic: str

class QueryResponse(BaseModel):
    sql: str
    params: Dict[str, Any]
    explanation: str
    confidence: float
    clarification: Optional[str] = None
    clarification_required: bool = False
    results: List[Dict[str, Any]]
    execution_time_ms: int
    insights: Optional[InsightAlert] = None
    explanation_details: Optional[QueryExplanation] = None
    query_risk_level: str = "low"
    query_risk_score: float = 0.0
    is_truncated: bool = False

class SchemaResponse(BaseModel):
    tables: Dict[str, List[str]]

class VoiceTranscribeResponse(BaseModel):
    transcribed_text: str
    detected_language: str
    latency_ms: int

# Fraud Detection Schemas
class FraudAnalysis(BaseModel):
    risk_score: float
    risk_level: RiskLevel
    model_used: str
    explanation: str

class HighRiskTransaction(BaseModel):
    transaction_id: str
    amount: float
    risk_score: float
    risk_level: RiskLevel
    timestamp: datetime

# AI Agent Schemas
class AIAgentBase(BaseModel):
    name: str
    type: str
    model_name: Optional[str] = None
    version: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None

class AIAgentCreate(AIAgentBase):
    pass

class AIAgent(AIAgentBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Metrics Schemas
class SystemMetrics(BaseModel):
    total_queries: int
    avg_query_time_ms: float
    total_transactions: int
    fraud_detection_rate: float
    active_agents: int
    uptime_seconds: int
    total_voice_requests: int = 0
    voice_success_count: int = 0
    voice_failure_count: int = 0
    avg_transcription_latency_ms: float = 0.0
    
    # Scheduled metrics
    total_audit_entries: int = 0
    suspicious_query_count: int = 0
    total_scheduled_jobs: int = 0
    scheduled_success_count: int = 0
    scheduled_failure_count: int = 0
    average_scheduled_execution_time_ms: float = 0.0
    geo_filtered_queries_count: int = 0
    
    # Quantum metrics
    total_quantum_inferences: int = 0
    hybrid_trigger_rate: float = 0.0
    classical_vs_quantum_accuracy: float = 0.0
    avg_quantum_latency_ms: float = 0.0

    # Governance & Insight Metrics
    total_queries_logged: int = 0
    blocked_query_rate: float = 0.0
    total_insights_generated: int = 0
    average_query_execution_time: float = 0.0
    avg_llm_latency: float = 0.0
    avg_sql_validation_time: float = 0.0
    clarification_rate: float = 0.0
    policy_block_rate: float = 0.0
    query_success_rate: float = 0.0

# Audit Schemas
class AuditLogEntry(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    resource: Optional[str] = None
    query: Optional[str] = None
    execution_time_ms: Optional[int] = None
    error_message: Optional[str] = None
    status: str
    timestamp: datetime
    
    # Enterpise additions
    role: Optional[str] = None
    nl_query: Optional[str] = None
    generated_sql: Optional[str] = None
    rows_returned: Optional[int] = None
    source_type: Optional[str] = None
    suspicious_flag: Optional[bool] = None
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True

class QueryLogEntry(BaseModel):
    id: int
    user_id: int
    role: str
    nl_query: str
    generated_sql: str
    rows_returned: int
    execution_time_ms: int
    source_type: str
    suspicious_flag: bool
    block_reason: Optional[str] = None
    ip_address: str
    query_risk_score: float = 0.0
    query_risk_level: str = "low"
    timestamp: datetime

    class Config:
        from_attributes = True

class ScheduledQueryBase(BaseModel):
    nl_query: str
    frequency: str
    delivery_method: str
    webhook_url: Optional[str] = None
    is_active: bool = True

class ScheduledQueryCreate(ScheduledQueryBase):
    pass

class ScheduledQueryOut(ScheduledQueryBase):
    id: int
    user_id: int
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ScheduledResultOut(BaseModel):
    id: int
    scheduled_query_id: int
    generated_sql: str
    rows_returned: int
    execution_time_ms: int
    result_snapshot: str
    executed_at: datetime

    class Config:
        from_attributes = True

# Nearby Branches Schema
class NearbyBranchRequest(BaseModel):
    lat: float
    lng: float
    radius: float = 10.0  # km

class NearbyBranchResponse(BaseModel):
    branches: List[BankBranch]
    count: int
