import json
import time
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import User, AIAgent
import hashlib

class ContextManager:
    def __init__(self):
        self.context_store = {}  # In-memory store for demo
        self.max_context_length = 10000  # Max characters per context
        self.context_ttl = 3600  # 1 hour TTL
        self.max_history_items = 50  # Max history items per session
    
    def save_context(
        self, 
        session_id: str, 
        user_input: str, 
        ai_response: str, 
        context_type: str = "conversation",
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Save conversation context with metadata"""
        timestamp = datetime.utcnow()
        
        context_entry = {
            "id": self._generate_context_id(session_id, timestamp),
            "session_id": session_id,
            "user_input": user_input,
            "ai_response": ai_response,
            "context_type": context_type,
            "timestamp": timestamp.isoformat(),
            "metadata": metadata or {},
            "summary": self._generate_summary(user_input, ai_response)
        }
        
        # Initialize session if not exists
        if session_id not in self.context_store:
            self.context_store[session_id] = {
                "created_at": timestamp.isoformat(),
                "last_updated": timestamp.isoformat(),
                "context_history": [],
                "session_summary": "",
                "total_exchanges": 0
            }
        
        session = self.context_store[session_id]
        
        # Add to history
        session["context_history"].append(context_entry)
        
        # Maintain history limit
        if len(session["context_history"]) > self.max_history_items:
            session["context_history"] = session["context_history"][-self.max_history_items:]
        
        # Update session metadata
        session["last_updated"] = timestamp.isoformat()
        session["total_exchanges"] += 1
        
        # Generate session summary
        session["session_summary"] = self._generate_session_summary(session["context_history"])
        
        return context_entry["id"]
    
    def get_context(
        self, 
        session_id: str, 
        limit: Optional[int] = None,
        include_metadata: bool = True
    ) -> Dict[str, Any]:
        """Retrieve conversation context for a session"""
        if session_id not in self.context_store:
            return {
                "session_id": session_id,
                "context_history": [],
                "session_summary": "",
                "total_exchanges": 0,
                "exists": False
            }
        
        session = self.context_store[session_id]
        
        # Apply limit if specified
        history = session["context_history"]
        if limit and limit > 0:
            history = history[-limit:]
        
        result = {
            "session_id": session_id,
            "context_history": history if include_metadata else [
                {
                    "user_input": entry["user_input"],
                    "ai_response": entry["ai_response"],
                    "timestamp": entry["timestamp"]
                }
                for entry in history
            ],
            "session_summary": session["session_summary"],
            "total_exchanges": session["total_exchanges"],
            "created_at": session["created_at"],
            "last_updated": session["last_updated"],
            "exists": True
        }
        
        return result
    
    def search_context(
        self, 
        session_id: str, 
        query: str, 
        search_type: str = "semantic"
    ) -> List[Dict[str, Any]]:
        """Search within conversation context"""
        if session_id not in self.context_store:
            return []
        
        session = self.context_store[session_id]
        results = []
        
        if search_type == "keyword":
            results = self._keyword_search(session["context_history"], query)
        elif search_type == "semantic":
            results = self._semantic_search(session["context_history"], query)
        
        return results
    
    def get_relevant_context(
        self, 
        session_id: str, 
        current_query: str,
        max_context_length: int = 2000
    ) -> str:
        """Get most relevant context for current query"""
        if session_id not in self.context_store:
            return ""
        
        session = self.context_store[session_id]
        
        # Get recent exchanges
        recent_exchanges = session["context_history"][-5:]  # Last 5 exchanges
        
        # Search for relevant historical context
        relevant_exchanges = self._semantic_search(
            session["context_history"], 
            current_query,
            limit=3
        )
        
        # Combine recent and relevant context
        context_parts = []
        
        # Add session summary
        if session["session_summary"]:
            context_parts.append(f"Session Summary: {session['session_summary']}")
        
        # Add relevant exchanges
        for exchange in relevant_exchanges:
            context_parts.append(f"Previous Q: {exchange['user_input']}")
            context_parts.append(f"Previous A: {exchange['ai_response']}")
        
        # Add recent exchanges if not already included
        for exchange in recent_exchanges:
            if exchange not in relevant_exchanges:
                context_parts.append(f"Recent Q: {exchange['user_input']}")
                context_parts.append(f"Recent A: {exchange['ai_response']}")
        
        # Combine and limit length
        full_context = "\n".join(context_parts)
        
        if len(full_context) > max_context_length:
            # Truncate from the beginning, keeping the most recent
            full_context = "..." + full_context[-max_context_length:]
        
        return full_context
    
    def delete_context(self, session_id: str, context_id: Optional[str] = None) -> bool:
        """Delete context (specific entry or entire session)"""
        if session_id not in self.context_store:
            return False
        
        if context_id:
            # Delete specific context entry
            session = self.context_store[session_id]
            session["context_history"] = [
                entry for entry in session["context_history"] 
                if entry["id"] != context_id
            ]
            
            # Update session summary
            session["session_summary"] = self._generate_session_summary(session["context_history"])
            session["total_exchanges"] = len(session["context_history"])
        else:
            # Delete entire session
            del self.context_store[session_id]
        
        return True
    
    def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        """Get statistics for a session"""
        if session_id not in self.context_store:
            return {"exists": False}
        
        session = self.context_store[session_id]
        
        # Calculate statistics
        total_chars = sum(
            len(entry["user_input"]) + len(entry["ai_response"]) 
            for entry in session["context_history"]
        )
        
        avg_exchange_length = total_chars / max(session["total_exchanges"], 1)
        
        # Time analysis
        created_at = datetime.fromisoformat(session["created_at"])
        last_updated = datetime.fromisoformat(session["last_updated"])
        session_duration = (last_updated - created_at).total_seconds()
        
        return {
            "exists": True,
            "total_exchanges": session["total_exchanges"],
            "total_characters": total_chars,
            "average_exchange_length": avg_exchange_length,
            "session_duration_seconds": session_duration,
            "created_at": session["created_at"],
            "last_updated": session["last_updated"]
        }
    
    def cleanup_expired_sessions(self, max_age_hours: int = 24) -> int:
        """Clean up expired sessions"""
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        expired_sessions = []
        
        for session_id, session in self.context_store.items():
            last_updated = datetime.fromisoformat(session["last_updated"])
            if last_updated < cutoff_time:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del self.context_store[session_id]
        
        return len(expired_sessions)
    
    def _generate_context_id(self, session_id: str, timestamp: datetime) -> str:
        """Generate unique context ID"""
        content = f"{session_id}_{timestamp.isoformat()}_{time.time()}"
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    def _generate_summary(self, user_input: str, ai_response: str) -> str:
        """Generate summary for a single exchange"""
        # Simple extractive summarization
        combined = f"{user_input} {ai_response}"
        
        # Extract key phrases (simplified)
        words = combined.split()
        key_words = [word for word in words if len(word) > 4][:5]
        
        return " ".join(key_words) if key_words else combined[:100]
    
    def _generate_session_summary(self, context_history: List[Dict[str, Any]]) -> str:
        """Generate summary for entire session"""
        if not context_history:
            return ""
        
        # Extract key topics from recent exchanges
        recent_summaries = [entry["summary"] for entry in context_history[-10:]]
        
        # Combine and deduplicate
        all_words = " ".join(recent_summaries).split()
        unique_words = list(dict.fromkeys(all_words))[:10]  # Remove duplicates, keep first 10
        
        return " ".join(unique_words) if unique_words else "General conversation"
    
    def _keyword_search(self, context_history: List[Dict[str, Any]], query: str) -> List[Dict[str, Any]]:
        """Simple keyword-based search"""
        query_words = query.lower().split()
        results = []
        
        for entry in context_history:
            content = f"{entry['user_input']} {entry['ai_response']}".lower()
            
            # Count matching words
            matches = sum(1 for word in query_words if word in content)
            
            if matches > 0:
                entry_copy = entry.copy()
                entry_copy["relevance_score"] = matches / len(query_words)
                results.append(entry_copy)
        
        # Sort by relevance
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results
    
    def _semantic_search(self, context_history: List[Dict[str, Any]], query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Simplified semantic search (can be enhanced with embeddings)"""
        # For now, use keyword search as base
        results = self._keyword_search(context_history, query)
        
        # Add recency boost
        for i, entry in enumerate(results):
            # More recent entries get a boost
            recency_boost = (i + 1) / len(results) * 0.1
            entry["relevance_score"] += recency_boost
        
        # Re-sort and limit
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results[:limit]

# Global context manager instance
context_manager = ContextManager()
