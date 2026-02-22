from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime
import enum

class UserRole(enum.Enum):
    analyst = "analyst"
    auditor = "auditor"
    admin = "admin"

class TransactionType(enum.Enum):
    credit_card = "credit_card"
    debit_card = "debit_card"
    UPI = "UPI"
    NEFT = "NEFT"

class RiskLevel(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String)
    address = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    accounts = relationship("Account", back_populates="customer")

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    account_type = Column(String, nullable=False)
    balance = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")

class BankBranch(Base):
    __tablename__ = "bank_branches"
    
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(String, unique=True, nullable=False)
    bank_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    address = Column(Text)
    is_active = Column(Boolean, default=True)

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    description = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Fraud detection fields
    risk_score = Column(Float, default=0.0)
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.low)
    model_used = Column(String)
    fraud_flag = Column(Boolean, default=False)
    branch_id = Column(Integer, ForeignKey("bank_branches.id"))
    
    account = relationship("Account", back_populates="transactions")
    branch = relationship("BankBranch")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    permissions = Column(Text)  # JSON string of permissions

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    resource = Column(String)
    query = Column(Text)
    parameters = Column(Text)
    execution_time_ms = Column(Integer)
    status = Column(String)  # success, failure, error
    error_message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Enterprise Audit Enhancement Fields
    role = Column(String)
    nl_query = Column(Text)
    generated_sql = Column(Text)
    rows_returned = Column(Integer)
    source_type = Column(String) # typed / voice / scheduled
    suspicious_flag = Column(Boolean, default=False)
    ip_address = Column(String)
    hybrid_flag = Column(Boolean, default=False)
    agent_name = Column(String)
    detected_pattern = Column(String)
    
    user = relationship("User")

class AIAgent(Base):
    __tablename__ = "ai_agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # nl_to_sql, fraud_detection, etc.
    model_name = Column(String)
    version = Column(String)
    is_active = Column(Boolean, default=True)
    configuration = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class ModelPerformanceMetrics(Base):
    __tablename__ = "model_performance_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False)
    model_type = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Performance metrics
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    latency_ms = Column(Integer)
    throughput = Column(Float)
    
    # Additional metadata
    data_points = Column(Integer)
    parameters = Column(Text)  # JSON string

class ScheduledQuery(Base):
    __tablename__ = "scheduled_queries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    nl_query = Column(Text, nullable=False)
    frequency = Column(String, nullable=False) # daily / weekly / monthly
    delivery_method = Column(String, nullable=False) # dashboard / webhook
    webhook_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_run = Column(DateTime, nullable=True)
    next_run = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ScheduledResult(Base):
    __tablename__ = "scheduled_results"

    id = Column(Integer, primary_key=True, index=True)
    scheduled_query_id = Column(Integer, ForeignKey("scheduled_queries.id"))
    generated_sql = Column(Text)
    rows_returned = Column(Integer)
    execution_time_ms = Column(Integer)
    result_snapshot = Column(Text) # JSON
    executed_at = Column(DateTime, default=datetime.utcnow)

class QuantumModelMetrics(Base):
    __tablename__ = "quantum_model_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, unique=True, nullable=False)
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    inference_latency_ms = Column(Float)
    dataset_size = Column(Integer)
    last_evaluated = Column(DateTime, default=datetime.utcnow)

class QueryLog(Base):
    __tablename__ = "query_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String)
    nl_query = Column(Text)
    generated_sql = Column(Text)
    rows_returned = Column(Integer, default=0)
    execution_time_ms = Column(Integer)
    source_type = Column(String)
    suspicious_flag = Column(Boolean, default=False)
    block_reason = Column(Text, nullable=True)
    ip_address = Column(String)
    query_risk_score = Column(Float, default=0.0)
    query_risk_level = Column(String, default="low") # low / medium / high
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
