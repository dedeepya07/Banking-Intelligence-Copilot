import json
import time
from typing import Dict, Any, Optional, List
from .context_manager import context_manager
from .config import settings
from .llm_engine import llm_engine

class ContextAwareLLM:
    def __init__(self):
        self.max_context_tokens = 2000  # Max context to send to LLM
        self.context_threshold = 0.3    # Minimum relevance to include context
    
    def process_with_context(
        self,
        user_input: str,
        session_id: str,
        context_type: str = "conversation",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process user input with context awareness"""
        start_time = time.time()
        
        try:
            # Get relevant context
            relevant_context = context_manager.get_relevant_context(
                session_id, 
                user_input,
                max_context_length=self.max_context_tokens
            )
            
            # Build context-aware prompt
            prompt = self._build_context_prompt(user_input, relevant_context)
            
            # Generate response using LLM
            if settings.is_llm_available():
                if settings.get_llm_service() == "openai":
                    llm_response = self._call_openai_with_context(prompt)
                else:
                    llm_response = self._call_ollama_with_context(prompt)
            else:
                # Fallback response when no LLM is available
                llm_response = self._generate_fallback_response(user_input, relevant_context)
            
            # Save context for future reference
            context_id = context_manager.save_context(
                session_id=session_id,
                user_input=user_input,
                ai_response=llm_response,
                context_type=context_type,
                metadata=metadata
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return {
                "response": llm_response,
                "context_id": context_id,
                "session_id": session_id,
                "context_used": bool(relevant_context),
                "context_length": len(relevant_context),
                "processing_time_ms": processing_time,
                "context_summary": self._summarize_context_used(relevant_context)
            }
            
        except Exception as e:
            return {
                "response": f"I apologize, but I encountered an error processing your request: {str(e)}",
                "error": str(e),
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
    
    def get_conversation_history(
        self,
        session_id: str,
        limit: Optional[int] = None,
        include_metadata: bool = False
    ) -> Dict[str, Any]:
        """Get conversation history for a session"""
        return context_manager.get_context(
            session_id=session_id,
            limit=limit,
            include_metadata=include_metadata
        )
    
    def search_conversation(
        self,
        session_id: str,
        query: str,
        search_type: str = "semantic"
    ) -> List[Dict[str, Any]]:
        """Search within conversation history"""
        return context_manager.search_context(
            session_id=session_id,
            query=query,
            search_type=search_type
        )
    
    def delete_conversation(
        self,
        session_id: str,
        context_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Delete conversation context"""
        success = context_manager.delete_context(
            session_id=session_id,
            context_id=context_id
        )
        
        return {
            "success": success,
            "session_id": session_id,
            "context_id": context_id,
            "deleted_item": "specific_entry" if context_id else "entire_session"
        }
    
    def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        """Get session statistics"""
        return context_manager.get_session_stats(session_id)
    
    def _build_context_prompt(self, user_input: str, context: str) -> str:
        """Build prompt with context"""
        if not context:
            return user_input
        
        prompt = f"""You are an AI assistant with memory of previous conversations. 

Previous Context:
{context}

Current User Input:
{user_input}

Please provide a helpful response that acknowledges the context when relevant. If the context isn't relevant to the current question, respond naturally to the current input."""
        
        return prompt
    
    def _call_openai_with_context(self, prompt: str) -> str:
        """Call OpenAI API with context-aware prompt"""
        try:
            response = llm_engine.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful AI assistant with memory of previous conversations. Use the provided context to give more relevant and personalized responses."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    def _call_ollama_with_context(self, prompt: str) -> str:
        """Call Ollama API with context-aware prompt"""
        try:
            import requests
            
            response = requests.post(
                f"{settings.OLLAMA_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 1000
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json().get("response", "I apologize, but I couldn't generate a response.")
            else:
                raise Exception(f"Ollama API error: {response.status_code}")
                
        except Exception as e:
            raise Exception(f"Ollama error: {str(e)}")
    
    def _generate_fallback_response(self, user_input: str, context: str) -> str:
        """Generate fallback response when no LLM is available"""
        if not context:
            return f"I received your message: '{user_input}'. However, no LLM service is configured. Please configure OpenAI or Ollama to enable AI responses."
        
        return f"I understand you're asking about: '{user_input}'. I can see we have previous conversation context, but no LLM service is configured. Please configure OpenAI or Ollama to enable AI responses with context memory."
    
    def _summarize_context_used(self, context: str) -> str:
        """Summarize the context that was used"""
        if not context:
            return "No previous context used"
        
        lines = context.split('\n')
        context_items = [line for line in lines if line.startswith(('Previous', 'Recent', 'Session'))]
        
        return f"Used {len(context_items)} context items from conversation history"

# Global context-aware LLM instance
context_llm = ContextAwareLLM()
