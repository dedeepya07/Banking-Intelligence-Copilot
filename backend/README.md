# Banking Intelligence Copilot Backend

A production-ready FastAPI backend for AI-powered banking intelligence and fraud detection.

## Features

- **Natural Language → SQL**: Secure NL-to-SQL conversion with validation
- **Context-Aware AI Chat**: LLM with memory and conversation history
- **Fraud Detection**: Classical and hybrid quantum-enhanced fraud scoring
- **Authentication**: JWT-based auth with role-based access control (RBAC)
- **Audit Logging**: Comprehensive audit trail for all operations
- **PII Masking**: Automatic data masking based on user roles
- **Bank Branches**: Location-based branch search functionality
- **Observability**: System metrics and performance monitoring
- **LLM Integration**: Support for OpenAI and Ollama models

## Context-Aware AI Features

### Memory & Context Management
- **Session-based conversations** with persistent memory
- **Intelligent context retrieval** based on semantic relevance
- **Conversation history** with search and filtering
- **Session statistics** and analytics
- **Context deletion** (specific entries or entire sessions)

### Smart Context Usage
- **Automatic context detection** for relevant previous conversations
- **Context-aware prompts** that enhance LLM responses
- **Relevance scoring** to find most useful context
- **Configurable context limits** to optimize performance

### Search & Discovery
- **Keyword search** within conversation history
- **Semantic search** (can be enhanced with embeddings)
- **Relevance-ranked results** with scoring
- **Session-based filtering**

## Architecture

```
backend/
├── main.py              # FastAPI application and endpoints
├── config.py            # Configuration management
├── database.py          # Database connection and session
├── models.py            # SQLAlchemy ORM models
├── schemas.py           # Pydantic data validation schemas
├── auth.py              # JWT authentication and authorization
├── rbac.py              # Role-based access control
├── sql_validator.py     # SQL security validation
├── llm_engine.py        # Natural language to SQL engine
├── fraud_engine.py      # Fraud detection algorithms
├── quantum_engine.py    # Quantum-enhanced scoring simulation
├── services.py          # Business logic services
├── audit.py             # Audit logging service
├── context_manager.py   # Context memory management
├── context_llm.py       # Context-aware LLM interface
├── models_context.py    # Context database models
├── schemas_context.py   # Context API schemas
├── seed_data.py         # Database seeding script
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Quick Start

### Manual Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   export DATABASE_URL="sqlite:///./banking_intelligence.db"
   export SECRET_KEY="your-secret-key"
   export OPENAI_API_KEY="your-openai-key"  # Optional
   export OLLAMA_URL="http://localhost:11434"  # Optional
   ```

3. **Initialize database:**
   ```bash
   python seed_data.py
   ```

4. **Run the application:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Access API documentation:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc
   - OpenAPI Spec: http://localhost:8000/openapi.json

## Authentication

### Default Users

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| analyst1 | analyst123 | analyst |
| auditor1 | auditor123 | auditor |

### Context-Aware AI Chat

#### Start a Conversation
```bash
# First, get your auth token
TOKEN=$(curl -s -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Start a conversation with context
curl -X POST "http://localhost:8000/api/context/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "What is fraud detection in banking?",
    "session_id": "session_123",
    "context_type": "conversation"
  }'
```

#### Get Conversation History
```bash
curl -X GET "http://localhost:8000/api/context/history/session_123?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### Search Within Conversation
```bash
curl -X POST "http://localhost:8000/api/context/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_123",
    "query": "fraud detection",
    "search_type": "semantic"
  }'
```

#### Get Session Statistics
```bash
curl -X GET "http://localhost:8000/api/context/stats/session_123" \
  -H "Authorization: Bearer $TOKEN"
```

### API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication

### Query Engine
- `POST /api/query` - Execute natural language queries
- `GET /api/schema` - Get database schema

### Context-Aware AI Chat
- `POST /api/context/chat` - Chat with AI using context memory
- `GET /api/context/history/{session_id}` - Get conversation history
- `POST /api/context/search` - Search within conversation history
- `DELETE /api/context/delete` - Delete conversation context
- `GET /api/context/stats/{session_id}` - Get session statistics

### Transactions
- `GET /api/transactions` - Get transactions with fraud analysis
- `GET /api/fraud/high-risk` - Get high-risk transactions

### AI Agents
- `GET /api/agents` - Get all AI agents
- `GET /api/agents/{id}` - Get agent by ID

### System
- `GET /api/metrics` - Get system performance metrics
- `GET /api/audit/{user_id}` - Get audit logs (admin only)
- `GET /api/branches/nearby` - Get nearby bank branches

### Health
- `GET /api/health` - Health check endpoint

## Configuration

### Environment Variables

All external services must be configured using environment variables. **Never hardcode API keys.**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Database connection string | `sqlite:///./banking_intelligence.db` | No |
| `SECRET_KEY` | JWT secret key | `your-secret-key-change-in-production` | Yes (production) |
| `OPENAI_API_KEY` | OpenAI API key | None | No |
| `OPENAI_MODEL` | OpenAI model name | `gpt-3.5-turbo` | No |
| `USE_OPENAI` | Enable OpenAI integration | `false` | No |
| `OLLAMA_URL` | Ollama service URL | None | No |
| `OLLAMA_MODEL` | Ollama model name | `llama2` | No |
| `OLLAMA_ENABLED` | Enable Ollama integration | `false` | No |
| `MAPS_API_KEY` | Maps API key (Phase 2) | None | No |
| `VOICE_API_ENABLED` | Enable voice features (Phase 2) | `false` | No |
| `DEBUG` | Debug mode | `false` | No |
| `MAX_QUERY_RESULTS` | Maximum query results | `1000` | No |

### Setup Instructions

1. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your API keys:**
   ```bash
   # For OpenAI
   OPENAI_API_KEY=sk-your-openai-api-key-here
   USE_OPENAI=true
   
   # For Ollama (local LLM)
   OLLAMA_URL=http://localhost:11434
   OLLAMA_ENABLED=true
   
   # Security
   SECRET_KEY=your-very-secure-secret-key-here
   ```

3. **Never commit .env to version control**
   ```bash
   echo ".env" >> .gitignore
   ```

### LLM Service Configuration

#### Option 1: OpenAI
```bash
# Set environment variables
export OPENAI_API_KEY="sk-your-openai-api-key"
export USE_OPENAI=true

# Or add to .env file
echo "OPENAI_API_KEY=sk-your-openai-api-key" >> .env
echo "USE_OPENAI=true" >> .env
```

#### Option 2: Ollama (Local)
```bash
# Start Ollama (requires Ollama installed locally)
ollama serve

# Pull a model
ollama pull llama2

# Set environment variables
export OLLAMA_URL="http://localhost:11434"
export OLLAMA_ENABLED=true

# Or add to .env file
echo "OLLAMA_URL=http://localhost:11434" >> .env
echo "OLLAMA_ENABLED=true" >> .env
```

### Graceful Fallback

The system automatically detects available LLM services:

- **If no LLM is configured**: Returns controlled error messages
- **If OpenAI fails**: Falls back to Ollama if available
- **If both fail**: Returns helpful error messages without exposing sensitive data

### Security Notes

- **API keys are never logged** or exposed in responses
- **Debug mode** only shows detailed errors when explicitly enabled
- **Environment variables** are loaded securely from `.env` file
- **Production deployments** should use proper secret management

## Database Support

- **SQLite**: Default for development
- **PostgreSQL**: Recommended for production
- **MySQL**: Supported via SQLAlchemy

## Security Features

### SQL Validation
- SELECT-only queries enforced
- Automatic LIMIT clause validation
- Table and column name validation
- Parameterized queries only
- No DML/DDL operations allowed

### Role-Based Access Control
- **Admin**: Full access to all data and features
- **Analyst**: Limited access with PII masking
- **Auditor**: Read-only access with full PII masking

### PII Masking
- Email addresses partially masked for analysts
- Full masking for auditors
- No masking for administrators

## Fraud Detection

### Models
- **Classical**: Logistic regression simulation
- **Hybrid Quantum**: Classical + quantum-enhanced scoring

### Transaction Routing
- Credit Card → Hybrid model
- Debit Card → Hybrid model  
- UPI → Hybrid model
- NEFT → Classical model

### Risk Levels
- Low (0-0.3)
- Medium (0.3-0.6)
- High (0.6-0.9)
- Critical (0.9-1.0)

## Monitoring

### Metrics Available
- Query execution time
- LLM latency
- Fraud inference time
- System uptime
- Transaction volume
- Fraud detection rate

### Audit Logging
- All query executions
- Authentication attempts
- Data access events
- Fraud analysis runs

## Development

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/
```

### Code Style
```bash
# Install linting tools
pip install black flake8 mypy

# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

## Production Deployment

### Manual Production Setup

1. **Install dependencies in production:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set production environment variables:**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   export SECRET_KEY="your-production-secret-key"
   export DEBUG=false
   ```

3. **Run with production server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

### Using Process Manager (systemd)

Create `/etc/systemd/system/banking-backend.service`:
```ini
[Unit]
Description=Banking Intelligence Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/backend
Environment=DATABASE_URL=postgresql://user:password@localhost:5432/dbname
Environment=SECRET_KEY=your-production-secret-key
ExecStart=/usr/local/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Start the service:
```bash
sudo systemctl enable banking-backend
sudo systemctl start banking-backend
```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check DATABASE_URL format
   - Verify database is running
   - Ensure credentials are correct

2. **LLM service unavailable**
   - Verify OpenAI API key is valid
   - Check Ollama service is running
   - Review network connectivity

3. **Authentication failures**
   - Verify JWT secret key
   - Check user credentials
   - Review token expiration

### Logs
```bash
# Application logs (if using file logging)
tail -f app.log

# systemd service logs
sudo journalctl -u banking-backend -f
```

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Review the API documentation
- Check the troubleshooting guide
