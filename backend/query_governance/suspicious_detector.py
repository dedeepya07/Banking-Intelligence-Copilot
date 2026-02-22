from datetime import datetime, timedelta
from sqlalchemy import func, and_
from sqlalchemy.orm import Session
from ..models import QueryLog
import re

class SuspiciousDetector:
    def check_query(self, user_id: int, nl_query: str, db: Session) -> dict:
        """
        Check if a query or user behavior is suspicious based on deterministic rules.
        """
        now = datetime.utcnow()
        
        # Rule 1: > 50 queries within 60 seconds
        one_minute_ago = now - timedelta(seconds=60)
        recent_query_count = db.query(QueryLog).filter(
            QueryLog.user_id == user_id,
            QueryLog.timestamp >= one_minute_ago
        ).count()
        
        if recent_query_count >= 50:
            return {"suspicious": True, "reason": "High-frequency query pattern (Rate limiting triggered)"}
            
        # Rule 2: > 100,000 rows extracted within 5 minutes
        five_minutes_ago = now - timedelta(minutes=5)
        total_rows = db.query(func.sum(QueryLog.rows_returned)).filter(
            QueryLog.user_id == user_id,
            QueryLog.timestamp >= five_minutes_ago
        ).scalar() or 0
        
        if total_rows > 100000:
            return {"suspicious": True, "reason": "Massive data extraction pattern detected"}
            
        # Rule 3: > 5 broad SELECT * queries without filters (mocking detection on NL or SQL if possible)
        # We'll check the NL query for broad keywords if it's the first check, or recent logs
        broad_keywords = ["all transactions", "everything", "all records", "show all"]
        is_current_broad = any(k in nl_query.lower() for k in broad_keywords)
        
        if is_current_broad:
            # SQLite compatible multi-keyword check using OR with LIKE
            recent_broad_count = db.query(QueryLog).filter(
                QueryLog.user_id == user_id,
                QueryLog.timestamp >= five_minutes_ago,
                and_(
                    QueryLog.nl_query.like(f"%{k}%") for k in broad_keywords
                )
            ).count()
            
            if recent_broad_count >= 5:
                # Re-check count with OR instead of AND if we want ANY keyword
                # Actually, broad_keywords contains "all transactions" etc.
                pass 
            
            # Simple combined check for ANY broad keyword
            recent_broad_count = 0
            for k in broad_keywords:
                recent_broad_count += db.query(QueryLog).filter(
                    QueryLog.user_id == user_id,
                    QueryLog.timestamp >= five_minutes_ago,
                    QueryLog.nl_query.like(f"%{k}%")
                ).count()
            
            if recent_broad_count >= 5:
                return {"suspicious": True, "reason": "Repeated broad data scans without filtering"}

        # Rule 4: Detect incremental date scanning patterns (e.g., "Jan 1", "Jan 2", "Jan 3")
        # Rule 5: Detect automated pagination scraping (OFFSET incremental)
        # We can look at the last 3 queries for sequential similarity
        recent_queries = db.query(QueryLog).filter(
            QueryLog.user_id == user_id
        ).order_by(QueryLog.timestamp.desc()).limit(5).all()
        
        if len(recent_queries) >= 3:
            # Date scanning heuristic: look for numbers changing by 1 in consecutive queries
            # This is complex to do perfectly, so we use a pattern signature
            dates = []
            for q in recent_queries:
                match = re.search(r'\d+', q.nl_query)
                if match: dates.append(int(match.group()))
            
            if len(dates) >= 3:
                # Check for arithmetic progression (1, 2, 3 or 10, 20, 30)
                diffs = [dates[i] - dates[i+1] for i in range(len(dates)-1)]
                if all(d == diffs[0] and d != 0 for d in diffs):
                    return {"suspicious": True, "reason": "Automated sequential scanning pattern detected"}

        return {"suspicious": False, "reason": None}

suspicious_detector = SuspiciousDetector()
