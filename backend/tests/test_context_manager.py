import pytest
from context_manager import context_manager
from datetime import datetime
import time

def test_save_and_retrieve_context():
    """Test saving and retrieving context"""
    session_id = "test_session_1"
    user_input = "What is fraud detection?"
    ai_response = "Fraud detection is a process..."
    
    # Save context
    context_id = context_manager.save_context(
        session_id=session_id,
        user_input=user_input,
        ai_response=ai_response
    )
    
    assert context_id is not None
    assert len(context_id) == 16  # MD5 hash length
    
    # Retrieve context
    retrieved = context_manager.get_context(session_id)
    
    assert retrieved["exists"] is True
    assert retrieved["total_exchanges"] == 1
    assert len(retrieved["context_history"]) == 1
    
    entry = retrieved["context_history"][0]
    assert entry["user_input"] == user_input
    assert entry["ai_response"] == ai_response
    assert entry["session_id"] == session_id

def test_multiple_context_entries():
    """Test multiple context entries in a session"""
    session_id = "test_session_2"
    
    # Add multiple entries
    for i in range(3):
        context_manager.save_context(
            session_id=session_id,
            user_input=f"Question {i+1}",
            ai_response=f"Answer {i+1}"
        )
    
    # Retrieve all
    retrieved = context_manager.get_context(session_id)
    
    assert retrieved["total_exchanges"] == 3
    assert len(retrieved["context_history"]) == 3
    
    # Check order (most recent last)
    for i, entry in enumerate(retrieved["context_history"]):
        assert entry["user_input"] == f"Question {i+1}"
        assert entry["ai_response"] == f"Answer {i+1}"

def test_context_search():
    """Test context search functionality"""
    session_id = "test_session_3"
    
    # Add test data
    test_entries = [
        ("What is machine learning?", "ML is a subset of AI..."),
        ("How does fraud detection work?", "Fraud detection uses algorithms..."),
        ("What are neural networks?", "Neural networks are computing systems...")
    ]
    
    for user_input, ai_response in test_entries:
        context_manager.save_context(
            session_id=session_id,
            user_input=user_input,
            ai_response=ai_response
        )
    
    # Search for "machine learning"
    results = context_manager.search_context(session_id, "machine learning")
    
    assert len(results) >= 1
    assert any("machine learning" in result["user_input"].lower() for result in results)
    
    # Search for "fraud"
    results = context_manager.search_context(session_id, "fraud")
    
    assert len(results) >= 1
    assert any("fraud" in result["user_input"].lower() or "fraud" in result["ai_response"].lower() 
              for result in results)

def test_relevant_context_retrieval():
    """Test getting relevant context for current query"""
    session_id = "test_session_4"
    
    # Add conversation about banking
    context_manager.save_context(
        session_id=session_id,
        user_input="What are the types of bank accounts?",
        ai_response="Banks offer savings, current, and fixed deposit accounts."
    )
    
    context_manager.save_context(
        session_id=session_id,
        user_input="How do I open a savings account?",
        ai_response="To open a savings account, you need ID proof and address proof."
    )
    
    # Query about accounts should get relevant context
    relevant_context = context_manager.get_relevant_context(
        session_id, 
        "Tell me more about bank accounts"
    )
    
    assert "bank accounts" in relevant_context.lower() or "savings account" in relevant_context.lower()
    assert len(relevant_context) > 0

def test_context_deletion():
    """Test context deletion"""
    session_id = "test_session_5"
    
    # Add context
    context_id = context_manager.save_context(
        session_id=session_id,
        user_input="Test message",
        ai_response="Test response"
    )
    
    # Verify it exists
    retrieved = context_manager.get_context(session_id)
    assert retrieved["exists"] is True
    
    # Delete specific context
    success = context_manager.delete_context(session_id, context_id)
    assert success is True
    
    # Verify it's deleted (session should still exist but with no entries)
    retrieved = context_manager.get_context(session_id)
    assert retrieved["total_exchanges"] == 0
    
    # Delete entire session
    success = context_manager.delete_context(session_id)
    assert success is True
    
    # Verify session is deleted
    retrieved = context_manager.get_context(session_id)
    assert retrieved["exists"] is False

def test_session_stats():
    """Test session statistics"""
    session_id = "test_session_6"
    
    # Add some context
    total_chars = 0
    for i in range(5):
        user_input = f"Question {i+1} with some additional text"
        ai_response = f"Answer {i+1} with more detailed response text"
        total_chars += len(user_input) + len(ai_response)
        
        context_manager.save_context(
            session_id=session_id,
            user_input=user_input,
            ai_response=ai_response
        )
    
    # Get stats
    stats = context_manager.get_session_stats(session_id)
    
    assert stats["exists"] is True
    assert stats["total_exchanges"] == 5
    assert stats["total_characters"] == total_chars
    assert stats["average_exchange_length"] > 0
    assert stats["session_duration_seconds"] >= 0

def test_context_limit():
    """Test context history limit"""
    session_id = "test_session_7"
    
    # Add more entries than the limit
    original_limit = context_manager.max_history_items
    context_manager.max_history_items = 3
    
    try:
        # Add 5 entries
        for i in range(5):
            context_manager.save_context(
                session_id=session_id,
                user_input=f"Question {i+1}",
                ai_response=f"Answer {i+1}"
            )
        
        # Should only have 3 entries (most recent)
        retrieved = context_manager.get_context(session_id)
        assert retrieved["total_exchanges"] == 3
        assert len(retrieved["context_history"]) == 3
        
        # Check that we have the most recent entries
        questions = [entry["user_input"] for entry in retrieved["context_history"]]
        assert "Question 3" in questions
        assert "Question 4" in questions
        assert "Question 5" in questions
        assert "Question 1" not in questions
        assert "Question 2" not in questions
        
    finally:
        # Restore original limit
        context_manager.max_history_items = original_limit

def test_nonexistent_session():
    """Test handling of nonexistent sessions"""
    # Get context for nonexistent session
    retrieved = context_manager.get_context("nonexistent_session")
    assert retrieved["exists"] is False
    assert retrieved["total_exchanges"] == 0
    assert len(retrieved["context_history"]) == 0
    
    # Search in nonexistent session
    results = context_manager.search_context("nonexistent_session", "test query")
    assert len(results) == 0
    
    # Get stats for nonexistent session
    stats = context_manager.get_session_stats("nonexistent_session")
    assert stats["exists"] is False

if __name__ == "__main__":
    pytest.main([__file__])
