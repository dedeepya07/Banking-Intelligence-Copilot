from sqlalchemy.orm import Session
from .models import Customer, Account, Transaction, BankBranch, User, UserRole, TransactionType, RiskLevel, AuditLog
from .database import Base, engine
from datetime import datetime, timedelta
import hashlib
import random

def simple_hash(password: str) -> str:
    """Simple password hashing for demo"""
    return hashlib.sha256(password.encode()).hexdigest()

def seed_database(db: Session):
    """Seed database with realistic demo data"""
    
    # Create users
    users = [
        User(
            username="admin",
            email="admin@bank.com",
            hashed_password=simple_hash("admin123"),
            role=UserRole.admin,
            is_active=True
        ),
        User(
            username="analyst1",
            email="analyst1@bank.com",
            hashed_password=simple_hash("analyst123"),
            role=UserRole.analyst,
            is_active=True
        ),
        User(
            username="auditor1",
            email="auditor1@bank.com",
            hashed_password=simple_hash("auditor123"),
            role=UserRole.auditor,
            is_active=True
        )
    ]
    
    for user in users:
        db.add(user)
    db.commit()
    
    # Create bank branches
    branches = [
        BankBranch(
            branch_id="B001",
            bank_name="National Bank",
            latitude=28.6139,
            longitude=77.2090,
            city="New Delhi",
            state="Delhi",
            address="Connaught Place, New Delhi"
        ),
        BankBranch(
            branch_id="B002",
            bank_name="National Bank",
            latitude=19.0760,
            longitude=72.8777,
            city="Mumbai",
            state="Maharashtra",
            address="Bandra Kurla Complex, Mumbai"
        ),
        BankBranch(
            branch_id="B003",
            bank_name="National Bank",
            latitude=12.9716,
            longitude=77.5946,
            city="Bangalore",
            state="Karnataka",
            address="MG Road, Bangalore"
        ),
        BankBranch(
            branch_id="B004",
            bank_name="National Bank",
            latitude=22.5726,
            longitude=88.3639,
            city="Kolkata",
            state="West Bengal",
            address="Park Street, Kolkata"
        ),
        BankBranch(
            branch_id="B005",
            bank_name="National Bank",
            latitude=17.3850,
            longitude=78.4867,
            city="Hyderabad",
            state="Telangana",
            address="Banjara Hills, Hyderabad"
        )
    ]
    
    for branch in branches:
        db.add(branch)
    db.commit()
    
    # Create customers
    first_names = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rohit", "Kavita", "Arjun", "Meera"]
    last_names = ["Sharma", "Patel", "Reddy", "Kumar", "Singh", "Gupta", "Jain", "Agarwal", "Verma", "Malhotra"]
    
    customers = []
    for i in range(50):
        customer = Customer(
            name=f"{random.choice(first_names)} {random.choice(last_names)}",
            email=f"customer{i+1}@email.com",
            phone=f"+91-98{random.randint(10000000, 99999999)}",
            address=f"Address {i+1}, City {random.choice(['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Hyderabad'])}"
        )
        customers.append(customer)
        db.add(customer)
    
    db.commit()
    
    # Create accounts
    account_types = ["Savings", "Current", "Fixed Deposit", "Recurring Deposit"]
    accounts = []
    
    for customer in customers:
        num_accounts = random.randint(1, 3)
        for j in range(num_accounts):
            account = Account(
                account_number=f"ACC{random.randint(1000000, 9999999)}",
                customer_id=customer.id,
                account_type=random.choice(account_types),
                balance=random.uniform(1000, 1000000),
                is_active=True
            )
            accounts.append(account)
            db.add(account)
    
    db.commit()
    
    # Create transactions
    transaction_types = list(TransactionType)
    risk_levels = list(RiskLevel)
    
    generated_txn_ids = set()
    
    for account in accounts[:100]:  # Create transactions for first 100 accounts
        num_transactions = random.randint(5, 20)
        
        for k in range(num_transactions):
            # Generate random timestamp within last 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            timestamp = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)
            
            while True:
                txn_id = f"TXN{random.randint(10000000, 99999999)}"
                if txn_id not in generated_txn_ids:
                    generated_txn_ids.add(txn_id)
                    break
            
            transaction = Transaction(
                transaction_id=txn_id,
                account_id=account.id,
                amount=random.uniform(100, 50000),
                transaction_type=random.choice(transaction_types),
                description=f"Transaction {k+1}",
                timestamp=timestamp,
                risk_score=random.uniform(0, 1),
                risk_level=random.choice(risk_levels),
                model_used=random.choice(["classical_logistic", "hybrid_quantum"]),
                fraud_flag=random.random() < 0.05,  # 5% fraud rate
                branch_id=random.choice(branches).id
            )
            db.add(transaction)
    
    db.commit()
    
    print(f"Seeded database with:")
    print(f"- {len(users)} users")
    print(f"- {len(branches)} bank branches")
    print(f"- {len(customers)} customers")
    print(f"- {len(accounts)} accounts")
    print(f"- {db.query(Transaction).count()} transactions")
    
    # Generate some Audit Logs for demo
    audit_actions = [
        {"action": "login", "resource": "auth_system", "status": "success"},
        {"action": "data_access", "resource": "transaction_explorer", "status": "success"},
        {"action": "fraud_analysis", "resource": "risk_engine", "status": "success"},
        {"action": "query_execution", "resource": "query_assistant", "status": "success"},
        {"action": "unmask_pii", "resource": "customer_data", "status": "success"},
        {"action": "login_failed", "resource": "auth_system", "status": "error"}
    ]
    
    for _ in range(25):
        random_action = random.choice(audit_actions)
        log = AuditLog(
            user_id=random.choice(users).id,
            action=random_action["action"],
            resource=random_action["resource"],
            query="SELECT COUNT(*) FROM transactions;" if random_action["action"] == "query_execution" else None,
            execution_time_ms=random.randint(10, 500) if random_action["action"] == "query_execution" else None,
            status=random_action["status"],
            timestamp=datetime.utcnow() - timedelta(minutes=random.randint(1, 1440))
        )
        db.add(log)
        
    # Generate explicit failed audit logs
    for _ in range(5):
        log = AuditLog(
            user_id=random.choice(users).id,
            action="api_access_denied",
            resource="admin_panel",
            status="failure",
            error_message="Insufficient permissions for resource access",
            timestamp=datetime.utcnow() - timedelta(hours=random.randint(1, 24))
        )
        db.add(log)

    from .models import QueryLog
    # Generate some Query Logs for governance demo
    queries = [
        "Show me all transactions greater than 10000",
        "List customers in Mumbai",
        "Total balance for all accounts",
        "Recent fraud alerts in New Delhi",
        "Show me everything", # broad query
        "SELECT * FROM users", # potential suspicious
    ]
    
    for _ in range(15):
        is_suspicious = random.random() < 0.2
        nl_query = random.choice(queries)
        log = QueryLog(
            user_id=random.choice(users).id,
            role="analyst",
            nl_query=nl_query,
            generated_sql="SELECT * FROM transactions WHERE amount > 10000;" if not is_suspicious else "SELECT * FROM users;",
            rows_returned=random.randint(0, 100) if not is_suspicious else 0,
            execution_time_ms=random.randint(50, 300),
            source_type="typed",
            suspicious_flag=is_suspicious,
            block_reason="Broad data scanning detected" if is_suspicious and "everything" in nl_query else ("Unauthorized SQL pattern" if is_suspicious else None),
            ip_address=f"192.168.1.{random.randint(1, 254)}",
            timestamp=datetime.utcnow() - timedelta(minutes=random.randint(1, 1440))
        )
        db.add(log)
        
    db.commit()
    print(f"- 25 audit logs generated")
    print(f"- 5 explicit failure logs added")
    print(f"- 15 query governance logs seeded")

if __name__ == "__main__":
    from .database import SessionLocal, engine
    from .models import Base
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Seed data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
