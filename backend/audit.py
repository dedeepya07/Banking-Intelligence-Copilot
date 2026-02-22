from sqlalchemy.orm import Session
from .models import AuditLog, User
from datetime import datetime
from typing import Optional, Dict, Any
import json
import traceback

class AuditService:
    def log_query(
        self,
        user_id: Optional[int],
        natural_language: str,
        generated_sql: str,
        parameters: Dict[str, Any],
        execution_time_ms: int,
        status: str,
        error_message: Optional[str] = None,
        db: Session = None,
        role: Optional[str] = None,
        rows_returned: Optional[int] = None,
        source_type: Optional[str] = "typed",
        suspicious_flag: bool = False,
        ip_address: Optional[str] = None
    ):
        """Log query execution for audit"""
        if db is None:
            return
        
        try:
            audit_entry = AuditLog(
                user_id=user_id,
                action="query_execution",
                resource="natural_language_query",
                query=natural_language,
                parameters=json.dumps({
                    "generated_sql": generated_sql,
                    "params": parameters
                }),
                execution_time_ms=execution_time_ms,
                status=status,
                error_message=error_message,
                timestamp=datetime.utcnow(),
                role=role,
                nl_query=natural_language,
                generated_sql=generated_sql,
                rows_returned=rows_returned,
                source_type=source_type,
                suspicious_flag=suspicious_flag,
                ip_address=ip_address
            )
            
            db.add(audit_entry)
            db.commit()
            
        except Exception as e:
            # Don't let audit logging fail the main operation
            print(f"Audit logging failed: {str(e)}")
    
    def log_authentication(
        self,
        user_id: Optional[int],
        username: str,
        success: bool,
        ip_address: Optional[str] = None,
        db: Session = None
    ):
        """Log authentication attempts"""
        if db is None:
            return
        
        try:
            audit_entry = AuditLog(
                user_id=user_id,
                action="authentication",
                resource="login",
                query=f"Login attempt for user: {username}",
                parameters=json.dumps({
                    "username": username,
                    "ip_address": ip_address,
                    "success": success
                }),
                status="success" if success else "failure",
                timestamp=datetime.utcnow()
            )
            
            db.add(audit_entry)
            db.commit()
            
        except Exception as e:
            print(f"Audit logging failed: {str(e)}")
    
    def log_fraud_analysis(
        self,
        user_id: Optional[int],
        transaction_id: str,
        risk_score: float,
        model_used: str,
        execution_time_ms: int,
        db: Session = None
    ):
        """Log fraud analysis events"""
        if db is None:
            return
        
        try:
            audit_entry = AuditLog(
                user_id=user_id,
                action="fraud_analysis",
                resource="transaction",
                query=f"Fraud analysis for transaction: {transaction_id}",
                parameters=json.dumps({
                    "transaction_id": transaction_id,
                    "risk_score": risk_score,
                    "model_used": model_used
                }),
                execution_time_ms=execution_time_ms,
                status="success",
                timestamp=datetime.utcnow()
            )
            
            db.add(audit_entry)
            db.commit()
            
        except Exception as e:
            print(f"Audit logging failed: {str(e)}")
    
    def log_data_access(
        self,
        user_id: int,
        action: str,
        resource: str,
        details: Dict[str, Any],
        db: Session = None
    ):
        """Log general data access events"""
        if db is None:
            return
        
        try:
            audit_entry = AuditLog(
                user_id=user_id,
                action=action,
                resource=resource,
                query=json.dumps(details),
                parameters=json.dumps(details),
                status="success",
                timestamp=datetime.utcnow()
            )
            
            db.add(audit_entry)
            db.commit()
            
        except Exception as e:
            print(f"Audit logging failed: {str(e)}")
    
    def get_audit_trail(
        self,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        limit: int = 100,
        db: Session = None
    ):
        """Get audit trail entries"""
        if db is None:
            return []
        
        try:
            query = db.query(AuditLog)
            
            if user_id:
                query = query.filter(AuditLog.user_id == user_id)
            
            if action:
                query = query.filter(AuditLog.action == action)
            
            entries = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
            
            results = []
            for entry in entries:
                result = {
                    "id": entry.id,
                    "user_id": entry.user_id,
                    "action": entry.action,
                    "resource": entry.resource,
                    "query": entry.query,
                    "execution_time_ms": entry.execution_time_ms,
                    "status": entry.status,
                    "timestamp": entry.timestamp.isoformat(),
                    "role": entry.role,
                    "nl_query": entry.nl_query,
                    "generated_sql": entry.generated_sql,
                    "rows_returned": entry.rows_returned,
                    "source_type": entry.source_type,
                    "suspicious_flag": entry.suspicious_flag,
                    "ip_address": entry.ip_address,
                    "error_message": entry.error_message
                }
                
                # Parse parameters if they exist
                if entry.parameters:
                    try:
                        result["parameters"] = json.loads(entry.parameters)
                    except:
                        result["parameters"] = {}
                
                results.append(result)
            
            return results
            
        except Exception as e:
            print(f"Failed to get audit trail: {str(e)}")
            return []
    
    def get_user_activity_summary(
        self,
        user_id: int,
        days: int = 30,
        db: Session = None
    ):
        """Get user activity summary"""
        if db is None:
            return {}
        
        try:
            from datetime import timedelta
            from sqlalchemy import func
            
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Query activity summary
            summary = db.query(
                AuditLog.action,
                func.count(AuditLog.id).label("count"),
                func.avg(AuditLog.execution_time_ms).label("avg_time")
            ).filter(
                AuditLog.user_id == user_id,
                AuditLog.timestamp >= cutoff_date
            ).group_by(AuditLog.action).all()
            
            results = {}
            for action, count, avg_time in summary:
                results[action] = {
                    "count": count,
                    "avg_execution_time_ms": float(avg_time) if avg_time else 0
                }
            
            return results
            
        except Exception as e:
            print(f"Failed to get user activity summary: {str(e)}")
            return {}

audit_service = AuditService()
