from sqlalchemy.orm import Session
from .models import Customer, Account, Transaction, BankBranch, User, UserRole, TransactionType, RiskLevel, AuditLog, QueryLog
from .database import Base, engine
from datetime import datetime, timedelta
import hashlib
import random

def simple_hash(password: str) -> str:
    """Simple password hashing for demo"""
    return hashlib.sha256(password.encode()).hexdigest()

# Names for every alphabet (A-Z) with South Indian names added
NAMES_BY_ALPHABET = {
    'A': ['Amit', 'Anjali', 'Arjun', 'Aditya', 'Alok', 'Aarti', 'Anita', 'Akhil', 'Amrita', 'Aparna', 'Abhishek', 'Aakash', 'Anika', 'Aravind', 'Ananth', 'Anirudh', 'Anusha', 'Abhiram'],
    'B': ['Bharat', 'Bina', 'Bhupesh', 'Bhavna', 'Balram', 'Brijesh', 'Babita', 'Barkha', 'Birju', 'Bimala', 'Bhavesh', 'Bhakti', 'Binoy', 'Bela', 'Balaji', 'Bhaskar', 'Basavaraj'],
    'C': ['Chandan', 'Chitra', 'Chetan', 'Charu', 'Chirag', 'Chhaya', 'Champak', 'Chanchal', 'Chetna', 'Chander', 'Charmy', 'Chaitanya', 'Charvi', 'Chinmay', 'Chandrasekhar', 'Chandra'],
    'D': ['Deepak', 'Divya', 'Dinesh', 'Deipti', 'Dilip', 'Damini', 'Dharmesh', 'Dolly', 'Devendra', 'Dhara', 'Daksh', 'Darpan', 'Disha', 'Deep', 'Dhanush', 'Dilipan'],
    'E': ['Eshan', 'Ekta', 'Eklavya', 'Eesha', 'Emanual', 'Eshita', 'Eshwar', 'Elina', 'Ehsan', 'Eram', 'Edwin', 'Ena', 'Esha', 'Evan', 'Ezhil', 'Elango'],
    'F': ['Farhan', 'Falguni', 'Feroz', 'Farah', 'Faisal', 'Fatima', 'Fidush', 'Farzana', 'Flavia', 'Felix', 'Firoz', 'Farhad', 'Farid', 'Fiza'],
    'G': ['Ganesh', 'Gita', 'Gautam', 'Gayatri', 'Girish', 'Gauri', 'Gopal', 'Gulab', 'Govind', 'Gunjan', 'Gagan', 'Garima', 'Gaurav', 'Gaurie', 'Gajendra', 'Gokul'],
    'H': ['Harish', 'Hema', 'Hemant', 'Heena', 'Hitesh', 'Hina', 'Hardik', 'Harsha', 'Himanshu', 'Honey', 'Harsh', 'Hiral', 'Huma', 'Hardik', 'Hari', 'Hariharan'],
    'I': ['Ishwar', 'Indu', 'Irfan', 'Isha', 'Imran', 'Ishita', 'Iqbal', 'Indira', 'Ishan', 'Inaya', 'Idris', 'Indrani', 'Imon', 'Ishaan', 'Ilamathi'],
    'J': ['Jatin', 'Jyoti', 'Jitendra', 'Jaya', 'Jagdish', 'Janki', 'Jayesh', 'Jasmin', 'Jaswant', 'Juhi', 'Javed', 'Jiya', 'Janvi', 'Jitesh', 'Janardhan', 'Jeeva'],
    'K': ['Karan', 'Kavita', 'Kamal', 'Kiran', 'Kishore', 'Komal', 'Kartik', 'Kritika', 'Kunal', 'Kusum', 'Kailash', 'Kajol', 'Kedar', 'Kriti', 'Karthik', 'Kalyan', 'Krishna'],
    'L': ['Lalit', 'Laxmi', 'Lokesh', 'Latika', 'Laxman', 'Leela', 'Lucky', 'Lipi', 'Lavendu', 'Lata', 'Luv', 'Lina', 'Leena', 'Lokesh', 'Lokeshwar'],
    'M': ['Manish', 'Meera', 'Mahesh', 'Madhu', 'Manoj', 'Maya', 'Mohit', 'Mona', 'Mukesh', 'Mamta', 'Mayank', 'Mrunal', 'Mehak', 'Manavi', 'Mani', 'Murugan', 'Madhavan'],
    'N': ['Nitin', 'Neha', 'Naveen', 'Nisha', 'Naresh', 'Niyati', 'Nikhil', 'Nupur', 'Nishant', 'Nandini', 'Nayan', 'Namrata', 'Nandish', 'Naira', 'Nagaraj', 'Naveen'],
    'O': ['Omkar', 'Oindrila', 'Ojas', 'Oshin', 'Onkar', 'Ovia', 'Omesh', 'Opal', 'Omaan', 'Ojasvi', 'Olivia', 'Oormila', 'Ojas', 'Oishi', 'Omana'],
    'P': ['Pankaj', 'Priya', 'Prashant', 'Poonam', 'Pawan', 'Payal', 'Pradeep', 'Pallavi', 'Pushkar', 'Pooja', 'Parth', 'Prisha', 'Praneeth', 'Pavitra', 'Prakash', 'Prabhu'],
    'Q': ['Qasim', 'Qudrat', 'Qamar', 'Qainaat', 'Quadir', 'Qurat', 'Qubool', 'Qayyum', 'Quincy', 'Qutub', 'Qira', 'Qadim', 'Qais', 'Quinn'],
    'R': ['Rahul', 'Ritu', 'Rajesh', 'Rashmi', 'Rakesh', 'Reema', 'Rohan', 'Roshni', 'Ravi', 'Rupa', 'Rishi', 'Ria', 'Rupesh', 'Ridhima', 'Ramkumar', 'Rajiv'],
    'S': ['Suresh', 'Sneha', 'Sanjay', 'Swati', 'Sunil', 'Sarika', 'Sameer', 'Shweta', 'Sagar', 'Sapna', 'Shubham', 'Sonal', 'Shivam', 'Siddhi', 'Siva', 'Subramani'],
    'T': ['Tarun', 'Tanu', 'Tushar', 'Tripti', 'Tanmay', 'Tanja', 'Tapas', 'Tejal', 'Tejas', 'Tulsi', 'Tanvi', 'Trisha', 'Tejaswi', 'Tanushree', 'Tamil', 'Thangam'],
    'U': ['Umesh', 'Urmila', 'Uday', 'Usha', 'Utkarsh', 'Uma', 'Upendra', 'Urvi', 'Umar', 'Upasana', 'Ujjwal', 'Unnati', 'Urvashi', 'Utpal', 'Udayan'],
    'V': ['Vikram', 'Vidya', 'Vineet', 'Vini', 'Vijay', 'Vimala', 'Vivek', 'Vrushali', 'Varun', 'Vani', 'Vansh', 'Vanya', 'Vihaan', 'Vrunda', 'Venkat', 'Venkatesh'],
    'W': ['Waman', 'Warda', 'Wasim', 'Wajida', 'Waris', 'Winnie', 'Wilson', 'Wafa', 'Waqas', 'Wasan', 'Wasiq', 'Wendy', 'Wyatt', 'Waris'],
    'X': ['Xavier', 'Ximena', 'Xander', 'Xyla', 'Xerxes', 'Xena', 'Xavian', 'Xia', 'Xayden', 'Xaria', 'Xylon', 'Xyla', 'Xenon', 'Xerox'],
    'Y': ['Yogesh', 'Yagini', 'Yash', 'Yamini', 'Yuvraj', 'Yogita', 'Yashwant', 'Yukta', 'Yuvika', 'Yaseen', 'Yashaswi', 'Yuti', 'Yohan', 'Yashita', 'Yuvan'],
    'Z': ['Zuber', 'Zoya', 'Zaid', 'Zeenat', 'Zakir', 'Zaini', 'Zeeshan', 'Zara', 'Zameer', 'Zeba', 'Zion', 'Zunaira', 'Zayed', 'Zoya']
}

LAST_NAMES = ["Sharma", "Patel", "Reddy", "Kumar", "Singh", "Gupta", "Jain", "Agarwal", "Verma", "Malhotra", "Joshi", "Mehta", "Shah", "Rao", "Nair", "Das", "Chatterjee", "Banerjee", "Kulkarni", "Deshmukh", "Choudhury", "Bose", "Menon", "Iyengar", "Iyer", "Ranganathan", "Naidu", "Subramanian", "Murthy", "Gopalakrishnan"]

CITIES_DATA = [
    # Existing / Major
    {"city": "New Delhi", "state": "Delhi", "lat": 28.6139, "lng": 77.2090},
    {"city": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lng": 72.8777},
    {"city": "Bangalore", "state": "Karnataka", "lat": 12.9716, "lng": 77.5946},
    {"city": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lng": 88.3639},
    {"city": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lng": 78.4867},
    {"city": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lng": 80.2707},
    {"city": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567},
    {"city": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lng": 72.5714},
    {"city": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lng": 75.7873},
    {"city": "Bhopal", "state": "Madhya Pradesh", "lat": 23.2599, "lng": 77.4126},
    {"city": "Indore", "state": "Madhya Pradesh", "lat": 22.7196, "lng": 75.8577},
    {"city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lng": 80.9462},
    {"city": "Chandigarh", "state": "Chandigarh", "lat": 30.7333, "lng": 76.7794},
    {"city": "Patna", "state": "Bihar", "lat": 25.5941, "lng": 85.1376},
    {"city": "Guwahati", "state": "Assam", "lat": 26.1158, "lng": 91.7086},
    {"city": "Surat", "state": "Gujarat", "lat": 21.1702, "lng": 72.8311},
    {"city": "Nagpur", "state": "Maharashtra", "lat": 21.1458, "lng": 79.0882},
    # Andhra Pradesh Cities (Requested)
    {"city": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lng": 83.2185},
    {"city": "Vijayawada", "state": "Andhra Pradesh", "lat": 16.5062, "lng": 80.6480},
    {"city": "Tirupati", "state": "Andhra Pradesh", "lat": 13.6285, "lng": 79.4192},
    {"city": "Rajahmundry", "state": "Andhra Pradesh", "lat": 17.0005, "lng": 81.7729},
    {"city": "Guntur", "state": "Andhra Pradesh", "lat": 16.3067, "lng": 80.4365},
    {"city": "Nellore", "state": "Andhra Pradesh", "lat": 14.4426, "lng": 79.9865},
    {"city": "Kakinada", "state": "Andhra Pradesh", "lat": 16.9891, "lng": 82.2475},
    {"city": "Kurnool", "state": "Andhra Pradesh", "lat": 15.8281, "lng": 78.0373},
    {"city": "Anantapur", "state": "Andhra Pradesh", "lat": 14.6819, "lng": 77.6006},
    # More Indian Cities to reach 70+
    {"city": "Kanpur", "state": "Uttar Pradesh", "lat": 26.4499, "lng": 80.3319},
    {"city": "Thane", "state": "Maharashtra", "lat": 19.2183, "lng": 72.9781},
    {"city": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lng": 83.2185},
    {"city": "Vadodara", "state": "Gujarat", "lat": 22.3072, "lng": 73.1812},
    {"city": "Ghaziabad", "state": "Uttar Pradesh", "lat": 28.6692, "lng": 77.4538},
    {"city": "Ludhiana", "state": "Punjab", "lat": 30.9010, "lng": 75.8573},
    {"city": "Agra", "state": "Uttar Pradesh", "lat": 27.1767, "lng": 78.0081},
    {"city": "Nashik", "state": "Maharashtra", "lat": 19.9975, "lng": 73.7898},
    {"city": "Faridabad", "state": "Haryana", "lat": 28.4089, "lng": 77.3178},
    {"city": "Meerut", "state": "Uttar Pradesh", "lat": 28.9845, "lng": 77.7064},
    {"city": "Rajkot", "state": "Gujarat", "lat": 22.3039, "lng": 70.8022},
    {"city": "Kalyan-Dombivli", "state": "Maharashtra", "lat": 19.2354, "lng": 73.1296},
    {"city": "Vasai-Virar", "state": "Maharashtra", "lat": 19.3919, "lng": 72.8397},
    {"city": "Varanasi", "state": "Uttar Pradesh", "lat": 25.3176, "lng": 82.9739},
    {"city": "Srinagar", "state": "Jammu and Kashmir", "lat": 34.0837, "lng": 74.7973},
    {"city": "Aurangabad", "state": "Maharashtra", "lat": 19.8762, "lng": 75.3433},
    {"city": "Dhanbad", "state": "Jharkhand", "lat": 23.7957, "lng": 86.4304},
    {"city": "Amritsar", "state": "Punjab", "lat": 31.6340, "lng": 74.8723},
    {"city": "Navi Mumbai", "state": "Maharashtra", "lat": 19.0330, "lng": 73.0297},
    {"city": "Allahabad", "state": "Uttar Pradesh", "lat": 25.4358, "lng": 81.8463},
    {"city": "Howrah", "state": "West Bengal", "lat": 22.5958, "lng": 88.2636},
    {"city": "Ranchi", "state": "Jharkhand", "lat": 23.3441, "lng": 85.3096},
    {"city": "Gwalior", "state": "Madhya Pradesh", "lat": 26.2124, "lng": 78.1772},
    {"city": "Jabalpur", "state": "Madhya Pradesh", "lat": 23.1815, "lng": 79.9864},
    {"city": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lng": 76.9558},
    {"city": "Vijayawada", "state": "Andhra Pradesh", "lat": 16.5062, "lng": 80.6480},
    {"city": "Jodhpur", "state": "Rajasthan", "lat": 26.2389, "lng": 73.0243},
    {"city": "Madurai", "state": "Tamil Nadu", "lat": 9.9252, "lng": 78.1198},
    {"city": "Raipur", "state": "Chhattisgarh", "lat": 21.2514, "lng": 81.6296},
    {"city": "Kota", "state": "Rajasthan", "lat": 25.1761, "lng": 75.8362},
    {"city": "Solapur", "state": "Maharashtra", "lat": 17.6599, "lng": 75.9064},
    {"city": "Hubli-Dharwad", "state": "Karnataka", "lat": 15.3647, "lng": 75.1240},
    {"city": "Mysore", "state": "Karnataka", "lat": 12.2958, "lng": 76.6394},
    {"city": "Tiruchirappalli", "state": "Tamil Nadu", "lat": 10.7905, "lng": 78.7047},
    {"city": "Bareilly", "state": "Uttar Pradesh", "lat": 28.3670, "lng": 79.4304},
    {"city": "Aligarh", "state": "Uttar Pradesh", "lat": 27.8974, "lng": 78.0880},
    {"city": "Gurgaon", "state": "Haryana", "lat": 28.4595, "lng": 77.0266},
    {"city": "Jalandhar", "state": "Punjab", "lat": 31.3260, "lng": 75.5762},
    {"city": "Bhubaneswar", "state": "Odisha", "lat": 20.2961, "lng": 85.8245},
    {"city": "Salem", "state": "Tamil Nadu", "lat": 11.6643, "lng": 78.1460},
    {"city": "Warangal", "state": "Telangana", "lat": 17.9689, "lng": 79.5941},
    {"city": "Mira-Bhayandar", "state": "Maharashtra", "lat": 19.2813, "lng": 72.8557},
    {"city": "Thiruvananthapuram", "state": "Kerala", "lat": 8.5241, "lng": 76.9366},
    {"city": "Bhiwandi", "state": "Maharashtra", "lat": 19.2967, "lng": 73.0597},
    {"city": "Saharanpur", "state": "Uttar Pradesh", "lat": 29.9671, "lng": 77.5510},
    {"city": "Amravati", "state": "Maharashtra", "lat": 20.9320, "lng": 77.7523},
    {"city": "Noida", "state": "Uttar Pradesh", "lat": 28.5355, "lng": 77.3910},
    {"city": "Jamshedpur", "state": "Jharkhand", "lat": 22.8046, "lng": 86.2029},
    {"city": "Bhilai", "state": "Chhattisgarh", "lat": 21.1938, "lng": 81.3509},
    {"city": "Cuttack", "state": "Odisha", "lat": 20.4625, "lng": 85.8830},
    {"city": "Firozabad", "state": "Uttar Pradesh", "lat": 27.1513, "lng": 78.3957},
    {"city": "Kochi", "state": "Kerala", "lat": 9.9312, "lng": 76.2673},
    {"city": "Dehradun", "state": "Uttarakhand", "lat": 30.3165, "lng": 78.0322},
    {"city": "Warangal", "state": "Telangana", "lat": 17.9689, "lng": 79.5941},
    {"city": "Ujjain", "state": "Madhya Pradesh", "lat": 23.1765, "lng": 75.7885},
    {"city": "Jhansi", "state": "Uttar Pradesh", "lat": 25.4484, "lng": 78.5685},
    {"city": "Mangalore", "state": "Karnataka", "lat": 12.9141, "lng": 74.8560}
]

def seed_database(db: Session):
    """Seed database with realistic demo data matching user requirements"""
    
    # 1. Create users
    print("Seeding users...")
    admin_user = User(
        username="admin",
        email="admin@bank.com",
        hashed_password=simple_hash("admin123"),
        role=UserRole.admin,
        is_active=True
    )
    db.add(admin_user)
    
    analyst_user = User(
        username="analyst1",
        email="analyst1@bank.com",
        hashed_password=simple_hash("analyst123"),
        role=UserRole.analyst,
        is_active=True
    )
    db.add(analyst_user)
    
    auditor_user = User(
        username="auditor1",
        email="auditor1@bank.com",
        hashed_password=simple_hash("auditor123"),
        role=UserRole.auditor,
        is_active=True
    )
    db.add(auditor_user)
    db.commit()
    
    # 2. Create bank branches for all cities
    print(f"Seeding {len(CITIES_DATA)} branches...")
    branches = []
    # Deduplicate cities just in case
    unique_cities = { (c['city'], c['state']): c for c in CITIES_DATA }.values()
    
    for i, city_data in enumerate(unique_cities):
        branch = BankBranch(
            branch_id=f"B{i+1:03d}",
            bank_name="National Bank",
            latitude=city_data["lat"],
            longitude=city_data["lng"],
            city=city_data["city"],
            state=city_data["state"],
            address=f"Branch {i+1}, Main Road, {city_data['city']}"
        )
        branches.append(branch)
        db.add(branch)
    db.commit()
    
    # 3. Create customers for every alphabet
    print("Seeding customers...")
    customers = []
    customer_count = 0
    all_city_list = list(unique_cities)
    
    for char, names in NAMES_BY_ALPHABET.items():
        # Pick a random count more than 10 for each alphabet
        count = random.randint(12, 18)
        for i in range(count):
            first_name = random.choice(names)
            last_name = random.choice(LAST_NAMES)
            full_name = f"{first_name} {last_name}"
            
            # Ensure uniqueness of email
            customer_count += 1
            random_city_data = random.choice(all_city_list)
            customer = Customer(
                name=full_name,
                email=f"customer_{char}_{i}_{customer_count}@demo.com",
                phone=f"+91-{random.randint(60000, 99999)}{random.randint(10000, 99999)}",
                address=f"H.No {random.randint(100, 999)}, Phase {random.randint(1, 5)}, {random_city_data['city']}"
            )
            customers.append(customer)
            db.add(customer)
    
    db.commit()
    
    # 4. Create accounts for each customer
    print("Seeding accounts...")
    account_types = ["Savings", "Current", "Fixed Deposit", "Recurring Deposit"]
    accounts = []
    for customer in customers:
        num_accounts = random.randint(1, 2)
        for j in range(num_accounts):
            account = Account(
                account_number=f"ACC{random.randint(100000, 999999)}{random.randint(1000, 9999)}",
                customer_id=customer.id,
                account_type=random.choice(account_types),
                balance=random.uniform(5000, 5000000),
                is_active=True
            )
            accounts.append(account)
            db.add(account)
    db.commit()
    
    # 5. Create transactions
    print("Seeding transactions...")
    transaction_types = list(TransactionType)
    risk_levels = list(RiskLevel)
    
    generated_txn_ids = set()
    
    for account in accounts:
        # Each account gets some transactions
        num_txns = random.randint(4, 12)
        for k in range(num_txns):
            # Normal distribution of timestamps (last 60 days for more history)
            days_ago = random.randint(0, 60)
            timestamp = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            
            branch = random.choice(branches)
            
            while True:
                txn_id = f"TXN{random.randint(100000, 999999)}{random.randint(1000, 9999)}"
                if txn_id not in generated_txn_ids:
                    generated_txn_ids.add(txn_id)
                    break
            
            transaction = Transaction(
                transaction_id=txn_id,
                account_id=account.id,
                amount=random.uniform(50, 200000),
                transaction_type=random.choice(transaction_types),
                description=f"{random.choice(['Online Payment', 'ATM Withdrawal', 'Transfer', 'Bill Pay', 'Grocery', 'Investment', 'Hotel', 'Travel'])}",
                timestamp=timestamp,
                risk_score=random.uniform(0, 1),
                risk_level=random.choice(risk_levels),
                model_used=random.choice(["classical_logistic", "hybrid_quantum"]),
                fraud_flag=random.random() < 0.03,
                branch_id=branch.id
            )
            db.add(transaction)
    
    db.commit()
    
    print("Database seeding complete!")
    print(f"Stats: {len(customers)} customers, {len(accounts)} accounts, {len(branches)} branches, {len(generated_txn_ids)} transactions.")

if __name__ == "__main__":
    from .database import SessionLocal
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
