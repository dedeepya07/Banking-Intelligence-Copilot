import random
import math
import time
from typing import Dict, Any
from .models import TransactionType, RiskLevel

# Try to import numpy, but make it optional
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    # Create fallback numpy functions
    class NumpyFallback:
        @staticmethod
        def log1p(x):
            return math.log1p(x)
        
        @staticmethod
        def exp(x):
            return math.exp(x)
        
        @staticmethod
        def sin(x):
            return math.sin(x)
        
        @staticmethod
        def cos(x):
            return math.cos(x)
        
        @staticmethod
        def angle(complex_num):
            return math.atan2(complex_num.imag, complex_num.real)
        
        @staticmethod
        def sqrt(x):
            return math.sqrt(x)
        
        @staticmethod
        def clip(value, min_val, max_val):
            return max(min_val, min(max_val, value))
        
        @staticmethod
        def random():
            return random.random()
        
        def normal(loc, scale):
            u1 = random.random()
            u2 = random.random()
            z0 = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
            return z0 * scale + loc
    
    np = NumpyFallback()

class FraudEngine:
    def __init__(self):
        self.classical_threshold = 0.7
        self.hybrid_threshold = 0.6
        self.quantum_enhancement = 0.1  # Simulated quantum enhancement
    
    def analyze_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze transaction for fraud risk"""
        start_time = time.time()
        
        transaction_type = transaction_data.get('transaction_type', TransactionType.NEFT)
        amount = float(transaction_data.get('amount', 0))
        
        # Route to appropriate model based on transaction type
        if transaction_type in [TransactionType.credit_card, TransactionType.debit_card, TransactionType.UPI]:
            result = self._hybrid_quantum_scoring(transaction_data)
        else:
            result = self._classical_scoring(transaction_data)
        
        # Add execution time
        result['inference_time_ms'] = int((time.time() - start_time) * 1000)
        
        return result
    
    def _classical_scoring(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Classical fraud scoring (logistic regression simulation)"""
        amount = float(transaction_data.get('amount', 0))
        hour_of_day = transaction_data.get('hour_of_day', 12)
        
        # Feature engineering
        amount_log = math.log1p(amount)
        amount_normalized = min(amount_log / 10, 1.0)  # Normalize
        
        # Risk factors
        high_amount_risk = amount_normalized * 0.3
        unusual_time_risk = 0.2 if hour_of_day < 6 or hour_of_day > 22 else 0.0
        velocity_risk = self._calculate_velocity_risk(transaction_data)
        
        # Classical logistic-style scoring
        features = [amount_normalized, unusual_time_risk, velocity_risk]
        weights = [0.4, 0.3, 0.3]
        
        # Simulate logistic function
        linear_combination = sum(f * w for f, w in zip(features, weights))
        risk_score = 1 / (1 + math.exp(-linear_combination + 2))  # Shift to make scores more realistic
        
        # Add some noise for realism
        noise = random.gauss(0, 0.05)  # Use gauss instead of normal
        risk_score += noise
        risk_score = max(0, min(1, risk_score))
        
        risk_level = self._determine_risk_level(risk_score, self.classical_threshold)
        
        return {
            "risk_score": float(risk_score),
            "risk_level": risk_level,
            "model_used": "classical_logistic",
            "explanation": f"Classical model: Amount risk ({high_amount_risk:.2f}), Time risk ({unusual_time_risk:.2f}), Velocity risk ({velocity_risk:.2f})"
        }
    
    def _hybrid_quantum_scoring(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Hybrid quantum-enhanced fraud scoring"""
        # Get classical score first
        classical_result = self._classical_scoring(transaction_data)
        classical_score = classical_result["risk_score"]
        
        # Quantum enhancement simulation
        quantum_features = self._extract_quantum_features(transaction_data)
        quantum_score = self._quantum_scoring(quantum_features)
        
        # Hybrid combination
        hybrid_score = 0.7 * classical_score + 0.3 * quantum_score
        
        # Apply quantum enhancement factor
        if quantum_score > 0.8:
            hybrid_score += self.quantum_enhancement
        
        hybrid_score = max(0, min(1, hybrid_score))
        risk_level = self._determine_risk_level(hybrid_score, self.hybrid_threshold)
        
        return {
            "risk_score": float(hybrid_score),
            "risk_level": risk_level,
            "model_used": "hybrid_quantum",
            "explanation": f"Hybrid model: Classical ({classical_score:.3f}) + Quantum ({quantum_score:.3f}) = {hybrid_score:.3f}"
        }
    
    def _extract_quantum_features(self, transaction_data: Dict[str, Any]) -> list:
        """Extract quantum-inspired features"""
        amount = float(transaction_data.get('amount', 0))
        transaction_type = transaction_data.get('transaction_type', TransactionType.NEFT)
        
        # Simulate quantum state features
        amount_phase = math.atan2(amount * 0.1, amount)
        type_amplitude = hash(str(transaction_type)) % 100 / 100.0
        
        # Quantum-inspired features (simplified)
        features = [
            math.sin(amount_phase),
            math.cos(amount_phase),
            type_amplitude,
            random.random()  # Quantum noise simulation
        ]
        
        return features
    
    def _quantum_scoring(self, features: list) -> float:
        """Simulate quantum scoring algorithm"""
        # Simulate quantum interference pattern
        weights = [0.3, -0.2, 0.4, 0.1]
        interference = sum(f * w for f, w in zip(features, weights))
        
        # Quantum measurement simulation
        measurement_prob = 1 / (1 + math.exp(-interference))
        
        # Add quantum uncertainty
        uncertainty = random.gauss(0, 0.02)  # Use gauss instead of normal
        quantum_score = max(0, min(1, measurement_prob + uncertainty))
        
        return float(quantum_score)
    
    def _calculate_velocity_risk(self, transaction_data: Dict[str, Any]) -> float:
        """Calculate transaction velocity risk"""
        # Simulate velocity based on transaction patterns
        recent_transactions = transaction_data.get('recent_transactions', [])
        
        if not recent_transactions:
            return 0.1
        
        # Count transactions in last hour
        recent_count = len(recent_transactions)
        velocity_risk = min(recent_count * 0.1, 0.5)
        
        return velocity_risk
    
    def _determine_risk_level(self, risk_score: float, threshold: float) -> RiskLevel:
        """Determine risk level from score"""
        if risk_score >= 0.9:
            return RiskLevel.critical
        elif risk_score >= threshold:
            return RiskLevel.high
        elif risk_score >= threshold * 0.7:
            return RiskLevel.medium
        else:
            return RiskLevel.low
    
    def batch_analyze(self, transactions: list) -> list:
        """Analyze multiple transactions"""
        results = []
        for transaction in transactions:
            result = self.analyze_transaction(transaction)
            results.append(result)
        return results

fraud_engine = FraudEngine()
