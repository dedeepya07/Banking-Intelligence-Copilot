from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from .database import SessionLocal
from .models import ScheduledQuery, ScheduledResult, User
from .services import QueryService
from .audit import AuditService
import json
import requests
import time

scheduler = BackgroundScheduler()
query_service = QueryService()
audit_service = AuditService()

def stringify_results(results):
    try:
        return json.dumps(results, default=str)
    except Exception:
        return str(results)

def run_scheduled_queries():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        # Find active queries ready to run
        active_queries = db.query(ScheduledQuery).filter(
            ScheduledQuery.is_active == True,
            (ScheduledQuery.next_run <= now) | (ScheduledQuery.next_run == None)
        ).all()

        for sq in active_queries:
            user = db.query(User).filter(User.id == sq.user_id).first()
            if not user:
                continue

            start_time = time.time()
            
            error_message = None
            sql = ""
            row_count = 0
            suspicious_flag = False
            result_snapshot = "{}"
            status = "error"
            
            try:
                # Same execution as Query endpoint
                result = query_service.execute_natural_language_query(sq.nl_query, db, user)
                
                if result.explanation and "SQL validation failed: Unsafe" in result.explanation:
                    suspicious_flag = True
                    error_message = "Suspicious query detected and blocked."
                else:
                    sql = result.sql
                    row_count = len(result.results) if result.results else 0
                    result_snapshot = stringify_results(result.results[:100] if result.results else []) # save snapshot up to 100 rows
                    status = "success" if row_count > 0 else "no_results"
            except Exception as e:
                error_message = str(e)
            
            execution_time = int((time.time() - start_time) * 1000)
            
            if suspicious_flag:
                status = "blocked"

            # Audit log
            audit_service.log_query(
                user_id=user.id,
                natural_language=sq.nl_query,
                generated_sql=sql,
                parameters={},
                execution_time_ms=execution_time,
                status=status,
                error_message=error_message,
                db=db,
                role=user.role.value if hasattr(user.role, 'value') else user.role,
                rows_returned=row_count,
                source_type="scheduled",
                suspicious_flag=suspicious_flag,
                ip_address="system_scheduler"
            )

            # Store result
            sr = ScheduledResult(
                scheduled_query_id=sq.id,
                generated_sql=sql,
                rows_returned=row_count,
                execution_time_ms=execution_time,
                result_snapshot=result_snapshot,
                executed_at=now
            )
            db.add(sr)
            db.commit()

            # Webhook
            if not suspicious_flag and sq.delivery_method == 'webhook' and sq.webhook_url:
                try:
                    payload = {"query": sq.nl_query, "sql": sql, "results": json.loads(result_snapshot)}
                    requests.post(sq.webhook_url, json=payload, timeout=5)
                except Exception as e:
                    print(f"Webhook execution failed: {e}")
            
            # Compute next run
            sq.last_run = now
            if sq.frequency == 'daily':
                sq.next_run = now + timedelta(days=1)
            elif sq.frequency == 'weekly':
                sq.next_run = now + timedelta(days=7)
            elif sq.frequency == 'monthly':
                sq.next_run = now + timedelta(days=30)
            elif sq.frequency == 'minute': # Dev testing
                sq.next_run = now + timedelta(minutes=1)
            else:
                sq.next_run = now + timedelta(days=1)
                
            db.commit()

    except Exception as e:
        print(f"Scheduler failed: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler.add_job(run_scheduled_queries, 'interval', minutes=1)
    scheduler.start()
