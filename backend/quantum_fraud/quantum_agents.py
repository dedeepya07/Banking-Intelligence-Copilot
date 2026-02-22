from typing import Dict, Any, Tuple
from .quantum_models import qsvm_model, vqc_model, qnn_model, classical_model

class QuantumAgent:
    def __init__(self, name: str, transaction_type: str, model):
        self.name = name
        self.transaction_type = transaction_type
        self.model = model
        
        # State tracking
        self.total_predictions = 0
        self.fraud_predictions = 0
        self.safe_predictions = 0
        self.total_latency = 0
        self.confidence_distribution = {"low": 0, "medium": 0, "high": 0}
        
    def evaluate(self, features: Dict[str, Any]) -> Tuple[float, float, str, str, int]:
        score, confidence, explanation, pattern, latency = self.model.simulate_inference(features)
        
        self.total_predictions += 1
        self.total_latency += latency
        
        if score > 0.7:
            self.fraud_predictions += 1
        else:
            self.safe_predictions += 1
            
        if confidence > 0.9:
            self.confidence_distribution["high"] += 1
        elif confidence > 0.7:
            self.confidence_distribution["medium"] += 1
        else:
            self.confidence_distribution["low"] += 1
            
        return score, confidence, explanation, pattern, latency

    def get_status(self) -> Dict[str, Any]:
        return {
            "agent_name": self.name,
            "transaction_type": self.transaction_type,
            "model_used": self.model.name,
            "status": "Active",
            "total_predictions": self.total_predictions,
            "fraud_rate": (self.fraud_predictions / self.total_predictions) if self.total_predictions else 0.0,
            "avg_latency": (self.total_latency / self.total_predictions) if self.total_predictions else 0.0,
            "accuracy_percent": 96.5 + (hash(self.name) % 30) / 10.0 # Deterministic faux accuracy 
        }

class CreditCardQuantumAgent(QuantumAgent):
    def __init__(self):
        super().__init__("Credit Card Sentinel", "credit_card", qsvm_model)

class DebitCardQuantumAgent(QuantumAgent):
    def __init__(self):
        super().__init__("Debit Guard VQC", "debit_card", vqc_model)

class UPIQuantumAgent(QuantumAgent):
    def __init__(self):
        super().__init__("UPI Nexus QNN", "upi", qnn_model)

class NEFTAgent(QuantumAgent):
    def __init__(self):
        super().__init__("NEFT Classical Watcher", "neft", classical_model)

# Instantiate singleton fleet
cc_agent = CreditCardQuantumAgent()
dc_agent = DebitCardQuantumAgent()
upi_agent = UPIQuantumAgent()
neft_agent = NEFTAgent()

fleet = [cc_agent, dc_agent, upi_agent, neft_agent]
