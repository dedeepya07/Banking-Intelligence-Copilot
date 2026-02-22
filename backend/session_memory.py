import time
from typing import Dict, Any, Optional, List

class SessionMemory:
    def __init__(self, max_sessions: int = 1000, ttl_seconds: int = 3600):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.max_sessions = max_sessions
        self.ttl_seconds = ttl_seconds
    
    def get_context(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve context for a session if valid"""
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        if time.time() - session["last_accessed"] > self.ttl_seconds:
            del self.sessions[session_id]
            return None
        
        session["last_accessed"] = time.time()
        return session["context"]
    
    def update_context(self, session_id: str, last_query: str, last_sql: str, entities: Dict[str, Any], filters: List[str]):
        """Update or create session context"""
        # Cleanup if hitting max sessions
        if len(self.sessions) >= self.max_sessions:
            # Drop oldest 10%
            sorted_sessions = sorted(self.sessions.items(), key=lambda x: x[1]["last_accessed"])
            for i in range(int(self.max_sessions * 0.1)):
                del self.sessions[sorted_sessions[i][0]]
        
        self.sessions[session_id] = {
            "last_accessed": time.time(),
            "context": {
                "last_query": last_query,
                "last_sql": last_sql,
                "entities": entities,
                "filters": filters
            }
        }

session_memory = SessionMemory()
