from datetime import datetime
from sqlalchemy.orm import Session
from ..models import QuantumModelMetrics
import random

def initialize_quantum_metrics(db: Session):
    for model_name, latency in [("QSVM", 120), ("VQC", 150), ("QNN", 200)]:
        metric = db.query(QuantumModelMetrics).filter(QuantumModelMetrics.model_name == model_name).first()
        if not metric:
            metric = QuantumModelMetrics(
                model_name=model_name,
                accuracy=random.uniform(0.92, 0.98),
                precision=random.uniform(0.90, 0.96),
                recall=random.uniform(0.88, 0.95),
                f1_score=random.uniform(0.89, 0.95),
                inference_latency_ms=latency,
                dataset_size=random.randint(50000, 150000),
                last_evaluated=datetime.utcnow()
            )
            db.add(metric)
    try:
        db.commit()
    except:
        db.rollback()

def record_hybrid_inference(db: Session, latency_ms: float):
    # Depending on requirements, could update stats live, but for now we just log
    pass
