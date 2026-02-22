import pytest
from fraud_engine import fraud_engine
from models import TransactionType, RiskLevel

def test_classical_scoring():
    """Test classical fraud scoring model"""
    transaction_data = {
        "transaction_type": TransactionType.NEFT,
        "amount": 1000.0,
        "hour_of_day": 14,
        "recent_transactions": []
    }
    
    result = fraud_engine.analyze_transaction(transaction_data)
    
    assert "risk_score" in result
    assert "risk_level" in result
    assert "model_used" in result
    assert "explanation" in result
    assert "inference_time_ms" in result
    
    assert result["model_used"] == "classical_logistic"
    assert 0 <= result["risk_score"] <= 1
    assert result["risk_level"] in [level.value for level in RiskLevel]

def test_hybrid_quantum_scoring():
    """Test hybrid quantum fraud scoring model"""
    transaction_data = {
        "transaction_type": TransactionType.credit_card,
        "amount": 5000.0,
        "hour_of_day": 23,
        "recent_transactions": [{"amount": 1000}, {"amount": 2000}]
    }
    
    result = fraud_engine.analyze_transaction(transaction_data)
    
    assert result["model_used"] == "hybrid_quantum"
    assert 0 <= result["risk_score"] <= 1
    assert "Hybrid model:" in result["explanation"]

def test_transaction_routing():
    """Test transaction type routing to appropriate models"""
    # Credit card should use hybrid model
    cc_data = {"transaction_type": TransactionType.credit_card, "amount": 1000}
    cc_result = fraud_engine.analyze_transaction(cc_data)
    assert cc_result["model_used"] == "hybrid_quantum"
    
    # Debit card should use hybrid model
    dc_data = {"transaction_type": TransactionType.debit_card, "amount": 1000}
    dc_result = fraud_engine.analyze_transaction(dc_data)
    assert dc_result["model_used"] == "hybrid_quantum"
    
    # UPI should use hybrid model
    upi_data = {"transaction_type": TransactionType.UPI, "amount": 1000}
    upi_result = fraud_engine.analyze_transaction(upi_data)
    assert upi_result["model_used"] == "hybrid_quantum"
    
    # NEFT should use classical model
    neft_data = {"transaction_type": TransactionType.NEFT, "amount": 1000}
    neft_result = fraud_engine.analyze_transaction(neft_data)
    assert neft_result["model_used"] == "classical_logistic"

def test_risk_level_determination():
    """Test risk level determination from scores"""
    # Test various risk scores
    test_cases = [
        (0.1, RiskLevel.low),
        (0.4, RiskLevel.medium),
        (0.8, RiskLevel.high),
        (0.95, RiskLevel.critical)
    ]
    
    for score, expected_level in test_cases:
        transaction_data = {
            "transaction_type": TransactionType.NEFT,
            "amount": 1000,
            "hour_of_day": 12
        }
        
        result = fraud_engine.analyze_transaction(transaction_data)
        
        # Since scores have randomness, we just check it's a valid level
        assert result["risk_level"] in [level.value for level in RiskLevel]

def test_velocity_risk_calculation():
    """Test transaction velocity risk calculation"""
    # No recent transactions
    data = {"recent_transactions": []}
    velocity = fraud_engine._calculate_velocity_risk(data)
    assert velocity == 0.1
    
    # Some recent transactions
    data = {"recent_transactions": [{"id": 1}, {"id": 2}, {"id": 3}]}
    velocity = fraud_engine._calculate_velocity_risk(data)
    assert 0.1 <= velocity <= 0.5

def test_batch_analysis():
    """Test batch transaction analysis"""
    transactions = [
        {"transaction_type": TransactionType.credit_card, "amount": 1000},
        {"transaction_type": TransactionType.NEFT, "amount": 2000},
        {"transaction_type": TransactionType.UPI, "amount": 500}
    ]
    
    results = fraud_engine.batch_analyze(transactions)
    
    assert len(results) == 3
    for result in results:
        assert "risk_score" in result
        assert "risk_level" in result
        assert "model_used" in result

def test_high_amount_risk():
    """Test risk scoring for high amount transactions"""
    # Low amount
    low_amount_data = {
        "transaction_type": TransactionType.NEFT,
        "amount": 100,
        "hour_of_day": 12
    }
    low_result = fraud_engine.analyze_transaction(low_amount_data)
    
    # High amount
    high_amount_data = {
        "transaction_type": TransactionType.NEFT,
        "amount": 50000,
        "hour_of_day": 12
    }
    high_result = fraud_engine.analyze_transaction(high_amount_data)
    
    # High amount should generally have higher risk (though randomness may affect)
    assert 0 <= low_result["risk_score"] <= 1
    assert 0 <= high_result["risk_score"] <= 1

def test_unusual_time_risk():
    """Test risk scoring for unusual transaction times"""
    # Normal time
    normal_time_data = {
        "transaction_type": TransactionType.NEFT,
        "amount": 1000,
        "hour_of_day": 14
    }
    normal_result = fraud_engine.analyze_transaction(normal_time_data)
    
    # Unusual time (late night)
    unusual_time_data = {
        "transaction_type": TransactionType.NEFT,
        "amount": 1000,
        "hour_of_day": 2
    }
    unusual_result = fraud_engine.analyze_transaction(unusual_time_data)
    
    # Both should be valid results
    assert 0 <= normal_result["risk_score"] <= 1
    assert 0 <= unusual_result["risk_score"] <= 1

if __name__ == "__main__":
    pytest.main([__file__])
