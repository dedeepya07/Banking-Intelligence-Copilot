import pytest
from context_llm import context_llm
from context_manager import context_manager
from unittest.mock import patch, MagicMock

def test_context_aware_processing():
    """Test basic context-aware processing"""
    session_id = "test_llm_session"
    user_input = "What is fraud detection?"
    
    # Mock the LLM engine to avoid actual API calls
    with patch('context_llm.settings') as mock_settings:
        mock_settings.is_llm_available.return_value = False
        mock_settings.get_llm_service.return_value = "none"
        
        result = context_llm.process_with_context(
            user_input=user_input,
            session_id=session_id
        )
        
        assert "response" in result
        assert "context_id" in result
        assert result["session_id"] == session_id
        assert result["context_used"] is False  # No previous context
        assert "processing_time_ms" in result
        assert result["response"] is not None

def test_context_with_previous_history():
    """Test processing with existing context"""
    session_id = "test_llm_session_history"
    
    # First, add some context
    context_manager.save_context(
        session_id=session_id,
        user_input="What is banking?",
        ai_response="Banking is the business of managing money."
    )
    
    # Now process with context
    with patch('context_llm.settings') as mock_settings:
        mock_settings.is_llm_available.return_value = False
        mock_settings.get_llm_service.return_value = "none"
        
        result = context_llm.process_with_context(
            user_input="Tell me more about it",
            session_id=session_id
        )
        
        assert result["context_used"] is True  # Should use previous context
        assert result["context_length"] > 0
        assert "context_summary" in result

def test_conversation_history_retrieval():
    """Test getting conversation history"""
    session_id = "test_history_session"
    
    # Add multiple context entries
    for i in range(3):
        context_manager.save_context(
            session_id=session_id,
            user_input=f"Question {i+1}",
            ai_response=f"Answer {i+1}"
        )
    
    # Get full history
    history = context_llm.get_conversation_history(session_id)
    
    assert history["exists"] is True
    assert history["total_exchanges"] == 3
    assert len(history["context_history"]) == 3
    
    # Get limited history
    limited_history = context_llm.get_conversation_history(session_id, limit=2)
    assert len(limited_history["context_history"]) == 2

def test_conversation_search():
    """Test conversation search functionality"""
    session_id = "test_search_session"
    
    # Add test data
    test_data = [
        ("What is machine learning?", "ML is a subset of AI..."),
        ("How do banks detect fraud?", "Banks use various algorithms..."),
        ("What are neural networks?", "Neural networks are computing systems...")
    ]
    
    for user_input, ai_response in test_data:
        context_manager.save_context(
            session_id=session_id,
            user_input=user_input,
            ai_response=ai_response
        )
    
    # Search for specific terms
    results = context_llm.search_conversation(session_id, "machine learning")
    assert len(results) >= 1
    
    results = context_llm.search_conversation(session_id, "banks")
    assert len(results) >= 1
    
    # Search with no results
    results = context_llm.search_conversation(session_id, "quantum physics")
    assert len(results) == 0

def test_context_deletion():
    """Test context deletion through LLM interface"""
    session_id = "test_delete_session"
    
    # Add context
    context_id = context_manager.save_context(
        session_id=session_id,
        user_input="Test message",
        ai_response="Test response"
    )
    
    # Delete specific context
    result = context_llm.delete_conversation(session_id, context_id)
    assert result["success"] is True
    assert result["deleted_item"] == "specific_entry"
    
    # Delete entire session
    result = context_llm.delete_conversation(session_id)
    assert result["success"] is True
    assert result["deleted_item"] == "entire_session"

def test_session_statistics():
    """Test getting session statistics"""
    session_id = "test_stats_session"
    
    # Add some context
    for i in range(3):
        context_manager.save_context(
            session_id=session_id,
            user_input=f"Question {i+1}",
            ai_response=f"Answer {i+1}"
        )
    
    # Get stats
    stats = context_llm.get_session_stats(session_id)
    
    assert stats["exists"] is True
    assert stats["total_exchanges"] == 3
    assert stats["total_characters"] > 0

def test_openai_integration():
    """Test OpenAI integration (mocked)"""
    session_id = "test_openai_session"
    user_input = "What is AI?"
    
    # Mock OpenAI response
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "AI is artificial intelligence."
    
    with patch('context_llm.settings') as mock_settings, \
         patch('context_llm.llm_engine.openai_client') as mock_client:
        
        mock_settings.is_llm_available.return_value = True
        mock_settings.get_llm_service.return_value = "openai"
        mock_settings.OPENAI_MODEL = "gpt-3.5-turbo"
        mock_client.chat.completions.create.return_value = mock_response
        
        result = context_llm.process_with_context(
            user_input=user_input,
            session_id=session_id
        )
        
        assert "AI is artificial intelligence." in result["response"]
        assert result["context_used"] is False  # No previous context

def test_ollama_integration():
    """Test Ollama integration (mocked)"""
    session_id = "test_ollama_session"
    user_input = "What is banking?"
    
    # Mock Ollama response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"response": "Banking is financial services."}
    
    with patch('context_llm.settings') as mock_settings, \
         patch('context_llm.requests.post', return_value=mock_response):
        
        mock_settings.is_llm_available.return_value = True
        mock_settings.get_llm_service.return_value = "ollama"
        mock_settings.OLLAMA_URL = "http://localhost:11434"
        mock_settings.OLLAMA_MODEL = "llama2"
        
        result = context_llm.process_with_context(
            user_input=user_input,
            session_id=session_id
        )
        
        assert "Banking is financial services." in result["response"]

def test_error_handling():
    """Test error handling in context processing"""
    session_id = "test_error_session"
    user_input = "Test input"
    
    # Mock settings to return no LLM available
    with patch('context_llm.settings') as mock_settings:
        mock_settings.is_llm_available.return_value = False
        mock_settings.get_llm_service.return_value = "none"
        
        result = context_llm.process_with_context(
            user_input=user_input,
            session_id=session_id
        )
        
        # Should still return a response even without LLM
        assert "response" in result
        assert result["response"] is not None
        assert "processing_time_ms" in result

def test_metadata_handling():
    """Test metadata handling in context processing"""
    session_id = "test_metadata_session"
    user_input = "Test input"
    metadata = {"user_type": "analyst", "department": "risk"}
    
    with patch('context_llm.settings') as mock_settings:
        mock_settings.is_llm_available.return_value = False
        mock_settings.get_llm_service.return_value = "none"
        
        result = context_llm.process_with_context(
            user_input=user_input,
            session_id=session_id,
            metadata=metadata
        )
        
        assert result["context_id"] is not None
        
        # Verify metadata was saved
        context = context_manager.get_context(session_id, include_metadata=True)
        assert context["exists"] is True
        assert len(context["context_history"]) == 1
        
        entry_metadata = context["context_history"][0].get("metadata", {})
        assert entry_metadata["user_type"] == "analyst"
        assert entry_metadata["department"] == "risk"

if __name__ == "__main__":
    pytest.main([__file__])
