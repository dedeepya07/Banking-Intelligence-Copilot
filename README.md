# Banking Intelligence Copilot 🏦🧠
**A fully functional Enterprise Banking Platform** built with **FastAPI, React, SQLite, and OpenAI.**

It includes a comprehensive feature set handling: Natural Language Querying, Quantum & Classical Fraud Risk Intelligence, Query Governance, and Administrative RBAC capabilities.

## 🚀 Key Features
- **Query Assistant:** Talk to banking data using natural language contextually and retrieve safe, bounded SQL results via generative AI.
- **Fraud Intelligence:** Hybrid classical + simulated quantum fraud detection on sensitive transactions.
- **Audit Logs:** Full logging mechanism tracking data accessed, SQL synthesized, executing IPs, and block reasons.
- **Query Governance:** Deterministic rule enforcement with continuous monitoring for complex SQL queries reducing dangerous database load.
- **Role-Based Access Control (RBAC):** Native authorization matrix limiting actions based on permissions, fully bypassing authentication to run as Administrator.

## 🛠 Tech Stack
- **Frontend**: React, TypeScript, React Router, Vite, TailwindCSS (Shadcn/UI components)
- **Backend**: Python, FastAPI, SQLAlchemy
- **Data/Intelligence Engine**: OpenAI API, Ollama (local support), SQLite (Production DB mapped to `banking_intelligence.db`)

## 🏗 Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Buildathon26/Buildathon26-Quantum-Coders.git
   cd Buildathon26-Quantum-Coders
   ```
2. **Backend Setup:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   
   # Add your OpenAI Key in backend/.env
   # OPENAI_API_KEY=sk-...
   
   # Start the FastAPI Server
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
3. **Frontend Setup:**
   ```bash
   npm install
   npm run dev
   ```

*You can open `http://localhost:5173/` in your browser. All operations are allowed under the `admin` profile.*