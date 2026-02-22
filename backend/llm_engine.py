import json
import time
from typing import Dict, Any, Optional
import requests
from .config import settings

# Try to import OpenAI, but make it optional
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

class LLMEngine:
    def __init__(self):
        self.use_openai = settings.USE_OPENAI and bool(settings.OPENAI_API_KEY) and OPENAI_AVAILABLE
        self.use_ollama = settings.OLLAMA_ENABLED and bool(settings.OLLAMA_URL)
        
        if self.use_openai and OpenAI:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def generate_sql(self, natural_language: str, schema_info: str, context: Optional[Dict[str, Any]] = None, explain: bool = False) -> Dict[str, Any]:
        """Generate SQL from natural language query with context awareness"""
        start_time = time.time()
        
        # Check if any LLM service is available
        if not settings.is_llm_available():
            # Attempt to use smart mock for demo purposes
            mock_response = self._smart_mock_generate(natural_language, context)
            if mock_response:
                mock_response["generation_time_ms"] = int((time.time() - start_time) * 1000)
                mock_response["service_used"] = "mock_demo_engine"
                if explain:
                    mock_response["explanation_details"] = self._generate_mock_explanation(mock_response)
                return mock_response
                
            return {
                "sql": "",
                "params": {},
                "explanation": "No LLM service configured. Please configure OpenAI or Ollama.",
                "confidence": 0.0,
                "clarification": "Configure LLM service to use natural language queries",
                "error": "no_llm_configured",
                "generation_time_ms": int((time.time() - start_time) * 1000)
            }
        
        try:
            if self.use_openai:
                response = self._generate_with_openai(natural_language, schema_info, context, explain)
            elif self.use_ollama:
                response = self._generate_with_ollama(natural_language, schema_info, context, explain)
            else:
                return self._fallback_response(natural_language)
            
            # Parse response
            try:
                # Remove any markdown code block indicators if present
                clean_response = response.strip()
                if clean_response.startswith("```"):
                    lines = clean_response.split("\n")
                    if lines[0].startswith("```json"):
                        clean_response = "\n".join(lines[1:-1])
                    else:
                        clean_response = "\n".join(lines[1:-1])
                
                parsed_response = json.loads(clean_response)
            except json.JSONDecodeError:
                return {
                    "sql": "",
                    "params": {},
                    "explanation": "Failed to parse LLM response.",
                    "confidence": 0.0,
                    "clarification": "Please rephrase your query",
                    "error": "json_parsing_error",
                    "generation_time_ms": int((time.time() - start_time) * 1000)
                }
            
            # Add execution time and service info
            parsed_response["generation_time_ms"] = int((time.time() - start_time) * 1000)
            parsed_response["service_used"] = settings.get_llm_service()
            
            return parsed_response
            
        except Exception as e:
            error_msg = "LLM service error"
            if settings.DEBUG:
                error_msg = f"LLM generation failed: {str(e)}"
            
            return {
                "sql": "",
                "params": {},
                "explanation": error_msg,
                "confidence": 0.0,
                "clarification": "Please try again later",
                "error": "service_error",
                "generation_time_ms": int((time.time() - start_time) * 1000)
            }
    
    def _generate_with_openai(self, natural_language: str, schema_info: str, context: Optional[Dict[str, Any]], explain: bool) -> str:
        """Generate SQL using OpenAI API"""
        if not self.use_openai or not OpenAI:
            raise Exception("OpenAI is not configured or not available")
        
        prompt = self._build_prompt(natural_language, schema_info, context, explain)
        
        response = self.openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a SQL expert for a banking system. Convert natural language to SQL queries. Always return valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=1500
        )
        
        return response.choices[0].message.content
    
    def _generate_with_ollama(self, natural_language: str, schema_info: str, context: Optional[Dict[str, Any]], explain: bool) -> str:
        """Generate SQL using Ollama local model"""
        if not self.use_ollama:
            raise Exception("Ollama is not configured")
        
        prompt = self._build_prompt(natural_language, schema_info, context, explain)
        
        response = requests.post(
            f"{settings.OLLAMA_URL}/api/generate",
            json={
                "model": settings.OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_predict": 1500
                }
            },
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json().get("response", "")
        else:
            raise Exception(f"Ollama API error: {response.status_code}")
    
    def _build_prompt(self, natural_language: str, schema_info: str, context: Optional[Dict[str, Any]], explain: bool) -> str:
        """Build specialized prompt for LLM incorporating context and explanation requirements"""
        context_str = ""
        if context:
            context_str = f"""
Previous Context:
- Last Query: {context['last_query']}
- Last SQL: {context['last_sql']}
- Identified Entities: {context['entities']}
- Active Filters: {context['filters']}
"""

        explain_requirement = ""
        if explain:
            explain_requirement = """
6. NEW REQUIREMENT: include "explanation_details" object with:
   - "parsed_intent": summarized query intent
   - "entity_mapping": extracted parameters (e.g. name -> Rahul)
   - "join_reasoning": list of why specific tables are joined
   - "filter_interpretation": list of how filters are applied
   - "aggregation_logic": description of math/grouping used
"""

        return f"""
Database Schema:
{schema_info}
{context_str}

Natural Language Query:
{natural_language}

Generate a SQL query and metadata. 

Requirements:
1. Return valid JSON only.
2. If multiple entities match (e.g. "Rahul"), set "clarification_required": true and ask the user to clarify.
3. If critical params are missing (e.g. "show transactions" without time or account), set "clarification_required": true.
4. For follow-up queries (e.g. "Only debit"), combine with the previous context provided.
5. JSON structure:
{{
    "sql": "SELECT ...",
    "params": {{...}},
    "explanation": "...",
    "confidence": 0.95,
    "clarification": null,
    "clarification_required": false,
    "entities": {{...}},
    "filters": [...],
    {'"explanation_details": {...}' if explain else ''}
}}
{explain_requirement}
"""
    
    def _smart_mock_generate(self, natural_language: str, context: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """Smart mock with basic context support for demo purposes"""
        nl = natural_language.lower()
        
        # Handle follow-ups in mock
        if context and nl in ["only debit", "debit only", "just debit"]:
            return {
                "sql": "SELECT transaction_id, amount, transaction_type, timestamp FROM transactions WHERE transaction_type = 'debit_card' ORDER BY timestamp DESC LIMIT 10",
                "params": {},
                "explanation": "Filtering the previous query for debit transactions only.",
                "confidence": 0.95,
                "clarification": None,
                "clarification_required": False,
                "entities": {"transaction_type": "debit_card"},
                "filters": ["debit_card"]
            }

        if "rahul" in nl:
             return {
                "sql": "",
                "params": {},
                "explanation": "Multiple customers found with the name Rahul.",
                "confidence": 0.0,
                "clarification": "Multiple customers named 'Rahul' exist (Rahul Sharma, Rahul Kumar). Which one are you interested in?",
                "clarification_required": True,
                "entities": {"name": "Rahul"},
                "filters": []
            }
        
        mocks = [
            {
                "keywords": ["count", "transaction"],
                "sql": "SELECT COUNT(*) as total_transactions FROM transactions LIMIT 1",
                "explanation": "Counting all transactions in the database",
                "entities": {},
                "filters": []
            },
            {
                "keywords": ["list", "customer"],
                "sql": "SELECT name, email, city FROM customers LIMIT 10",
                "explanation": "Retrieving a list of customers with their basic details",
                "entities": {},
                "filters": []
            },
            {
                "keywords": ["total", "amount", "transaction"],
                "sql": "SELECT SUM(amount) as total_volume FROM transactions LIMIT 1",
                "explanation": "Calculating the total transaction volume",
                "entities": {},
                "filters": []
            },
            {
                "keywords": ["high", "risk"],
                "sql": "SELECT transaction_id, amount, risk_score FROM transactions WHERE risk_score > 0.8 ORDER BY risk_score DESC LIMIT 10",
                "explanation": "Filtering transactions with a high risk score (>0.8)",
                "entities": {"risk_threshold": 0.8},
                "filters": ["risk_score > 0.8"]
            }
        ]
        
        for mock in mocks:
            if all(kw in nl for kw in mock["keywords"]):
                return {
                    "sql": mock["sql"],
                    "params": {},
                    "explanation": mock["explanation"] + " (Demo Engine Fallback)",
                    "confidence": 0.9,
                    "clarification": None,
                    "clarification_required": False,
                    "entities": mock["entities"],
                    "filters": mock["filters"]
                }
        
        return {
            "sql": "SELECT transaction_id, amount, transaction_type, timestamp FROM transactions ORDER BY timestamp DESC LIMIT 10",
            "params": {},
            "explanation": f"Generic query fallback for: '{natural_language}'. (Demo Engine Fallback).",
            "confidence": 0.5,
            "clarification": None,
            "clarification_required": False,
            "entities": {},
            "filters": []
        }
    
    def _generate_mock_explanation(self, mock_response: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a structured mock explanation"""
        return {
            "parsed_intent": "Demonstration query for banking data analysis",
            "entity_mapping": mock_response.get("entities", {}),
            "join_reasoning": ["Joined transactions and branches if location data requested"],
            "filter_interpretation": mock_response.get("filters", ["Latest records used as default"]),
            "aggregation_logic": "Standard SQL aggregation (COUNT/SUM) or windowing (LIMIT)."
        }

    def _fallback_response(self, natural_language: str) -> Dict[str, Any]:
        """Fallback response when no LLM is available"""
        return {
            "sql": "",
            "params": {},
            "explanation": "No LLM service configured. Please set up OpenAI or Ollama.",
            "confidence": 0.0,
            "clarification": "Configure LLM service to use natural language queries",
            "error": "no_llm_configured"
        }
    
    def get_schema_info(self) -> str:
        """Get database schema information for prompt"""
        from .models import Base
        
        schema_info = []
        for table_name, table in Base.metadata.tables.items():
            columns = []
            for column in table.columns:
                col_type = str(column.type)
                columns.append(f"  - {column.name}: {col_type}")
            
            schema_info.append(f"Table: {table_name}\n" + "\n".join(columns))
        
        return "\n\n".join(schema_info)
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get LLM service status"""
        return {
            "llm_available": settings.is_llm_available(),
            "service": settings.get_llm_service(),
            "openai_configured": self.use_openai,
            "ollama_configured": self.use_ollama,
            "openai_available": OPENAI_AVAILABLE,
            "openai_model": settings.OPENAI_MODEL if self.use_openai else None,
            "ollama_model": settings.OLLAMA_MODEL if self.use_ollama else None
        }

llm_engine = LLMEngine()
