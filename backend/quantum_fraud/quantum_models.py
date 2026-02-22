import time
import random
from typing import Dict, Any, Tuple

class SimulatedQuantumModel:
    def __init__(self, name: str, base_latency_ms: int):
        self.name = name
        self.base_latency_ms = base_latency_ms

    def simulate_inference(self, features: Dict[str, Any]) -> Tuple[float, float, str, str, int]:
        # simulate some latency
        latency = self.base_latency_ms + random.randint(-15, 25)
        time.sleep(latency / 1000.0)
        
        amount = features.get('amount', 0)
        risk_base = (amount / 100000.0)
        
        # Deterministic pattern detection logic
        pattern = "Normal baseline usage"
        explanation = f"Evaluated safely in {self.name} Hilbert space mapping."
        
        # We will use transaction ID explicitly if we need determinism, but we'll use amount to fake rules
        if amount > 50000:
            pattern = "Velocity + Geographic Anomaly"
            explanation = "High-dimensional spike detected correlating excessive amount with cross-border signatures."
            risk_base += 0.45
        elif amount > 15000:
            pattern = "Behavioral Deviation Cluster"
            explanation = "Transaction vector diverges from established historic usage manifolds."
            risk_base += 0.25
        elif amount > 5000 and features.get("transaction_type") in ["credit_card", "UPI"]:
            pattern = "Merchant Risk Correlation"
            explanation = "Subspace alignment shows affinity with known compromised merchant endpoints."
            risk_base += 0.35
            
        score = min(0.99, max(0.1, risk_base + random.uniform(-0.05, 0.15)))
        confidence = min(0.99, max(0.7, 1.0 - (abs(0.5 - score) * 0.4) + random.uniform(-0.05, 0.05)))
        
        return score, confidence, explanation, pattern, latency

class QSVM(SimulatedQuantumModel):
    def __init__(self):
        super().__init__("QSVM", 120)

class VQC(SimulatedQuantumModel):
    def __init__(self):
        super().__init__("VQC", 150)

class QNN(SimulatedQuantumModel):
    def __init__(self):
        super().__init__("QNN", 200)

class ClassicalFallback(SimulatedQuantumModel):
    def __init__(self):
        super().__init__("Classical", 25)

qsvm_model = QSVM()
vqc_model = VQC()
qnn_model = QNN()
classical_model = ClassicalFallback()
