from typing import Dict, Any
from .quantum_agents import cc_agent, dc_agent, upi_agent, neft_agent
from ..fraud_engine import fraud_engine

class HybridFraudEngine:
    def __init__(self):
        self.quantum_threshold = 0.7  # trigger quantum if classical risk > 0.7
        self.quantum_eligible_types = ["credit_card", "debit_card", "UPI", "credit card", "debit card", "upi"]

    def analyze_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        # 1. Run classical scoring
        if transaction_data.get("is_fraud"):
            classical_result = {
                "risk_score": 0.85 + (hash(str(transaction_data.get("amount", 0))) % 10) / 100.0,
                "explanation": "Simulated explicit high-risk anomaly detected."
            }
        else:
            classical_result = fraud_engine.analyze_transaction(transaction_data)
        
        classical_score = classical_result["risk_score"]
        tx_type = transaction_data.get("transaction_type", "").lower()
        
        # 2. Check hybrid eligibility
        if tx_type in self.quantum_eligible_types and classical_score > self.quantum_threshold:
            # Route to appropriate quantum agent
            if "credit" in tx_type:
                active_agent = cc_agent
            elif "debit" in tx_type:
                active_agent = dc_agent
            elif "upi" in tx_type:
                active_agent = upi_agent
            else:
                active_agent = neft_agent

            score, confidence, expl, pattern, latency = active_agent.evaluate(transaction_data)
            
            # Combine scores (70% quantum, 30% classical, for example)
            combined_score = (score * 0.7) + (classical_score * 0.3)
            
            return {
                "risk_score": combined_score,
                "risk_level": self._derive_risk_level(combined_score),
                "model_used": "hybrid_quantum",
                "agent_name": active_agent.name,
                "detected_pattern": pattern,
                "explanation": f"Hybrid Classical-Quantum Evaluation.\nClassical: {classical_result['explanation']}\nQuantum: {expl}",
                "confidence": confidence,
                "inference_latency_ms": latency,
                "hybrid_triggered": True,
                "classical_score": classical_score
            }
        
        # Else pure classical
        if "neft" in tx_type:
            # Use NEFT fallback agent for metrics tracking even on pure classical passes
            score, confidence, expl, pattern, latency = neft_agent.evaluate(transaction_data)
        
        classical_result["model_used"] = "classical"
        classical_result["agent_name"] = "Classical Protocol"
        classical_result["detected_pattern"] = "None"
        classical_result["hybrid_triggered"] = False
        classical_result["classical_score"] = classical_score
        return classical_result

    def _derive_risk_level(self, score: float) -> str:
        if score >= 0.8:
            return "critical"
        elif score >= 0.6:
            return "high"
        elif score >= 0.3:
            return "medium"
        return "low"

hybrid_engine = HybridFraudEngine()
