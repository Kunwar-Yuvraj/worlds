# AI Novel Writing Platform - Testing & Verification Plan

This document outlines how to test and verify every component of the AI Novel Writing Platform backend, step by step—**even if you do NOT have PostgreSQL installed!**

---

## ⚡ How Testing Works Without PostgreSQL Installed

You **do NOT need PostgreSQL installed** on your computer to test or run this project!

1. **Automated Unit & Integration Tests**:
   - The test suite uses **SQLite in-memory** (`sqlite+aiosqlite:///:memory:`).
   - In `backend/app/database/models/embedding.py`, the 768-dimensional `Vector` column uses `.with_variant(JSON, "sqlite")`. This allows SQLite to transparently store vector embeddings as JSON arrays during testing without requiring PostgreSQL or the `pgvector` extension!

2. **Live Development Server Fallback**:
   - We updated `backend/.env` with `DATABASE_URL="sqlite+aiosqlite:///./ai_novel_writer.db"`.
   - On server startup (`uvicorn app.main:app`), FastAPI automatically creates local database tables in `ai_novel_writer.db` if PostgreSQL is not installed.
   - When deploying to production with PostgreSQL, simply uncomment the `postgresql+asyncpg://...` line in `backend/.env`.

---

## 📍 Where is the LangGraph Code Written?

The LangGraph AI multi-agent workflow is implemented in the following locations:

| Component | File Path | Description |
|---|---|---|
| **Graph Workflow Pipeline** | [`backend/app/graph/workflow.py`](file:///d:/AI%20novel%20writer/backend/app/graph/workflow.py) | Main LangGraph `StateGraph` definition. Connects `planner` ➔ `retrieval` ➔ `writer` ➔ `consistency` ➔ `editor` ➔ `memory` ➔ `END`. |
| **Workflow State** | [`backend/app/graph/state.py`](file:///d:/AI%20novel%20writer/backend/app/graph/state.py) | `NovelWorkflowState` TypedDict definition holding state context, plan, draft, edits, audit results, and logs. |
| **Graph Module Export** | [`backend/app/graph/__init__.py`](file:///d:/AI%20novel%20writer/backend/app/graph/__init__.py) | Exports compiled runnable graph `novel_workflow_app`. |
| **7 AI Agent Classes** | [`backend/app/agents/`](file:///d:/AI%20novel%20writer/backend/app/agents/) | Individual agent logic (`planner.py`, `retrieval.py`, `writer.py`, `editor.py`, `consistency.py`, `memory.py`, `revision.py`). |
| **Markdown System Prompts** | [`backend/app/prompts/`](file:///d:/AI%20novel%20writer/backend/app/prompts/) | Agent system instructions stored in Markdown files (`planner.md`, `writer.md`, etc.). |
| **API Integration** | [`backend/app/api/ai.py`](file:///d:/AI%20novel%20writer/backend/app/api/ai.py) | Exposes `POST /api/v1/ai/generate` which invokes `novel_workflow_app.ainvoke(...)`. |
| **Graph Tests** | [`backend/tests/test_graph.py`](file:///d:/AI%20novel%20writer/backend/tests/test_graph.py) | Automated test suite verifying LangGraph state transitions and node execution. |

---

## 🛠️ Step-by-Step Testing Plan

### Option 1: Run All Automated Test Suites (Recommended)

Run all 16 automated tests across the codebase with pytest (requires zero DB setup):

```powershell
cd "d:\AI novel writer\backend"
.\venv\Scripts\python.exe -m pytest tests/ -v
```

**Expected Result**: All 16 tests pass (`16 passed`).

---

### Option 2: Test via FastAPI Interactive Swagger UI (`/docs`)

1. **Start the FastAPI Backend Server**:
   ```powershell
   cd "d:\AI novel writer\backend"
   .\venv\Scripts\uvicorn app.main:app --reload --port 8000
   ```
   *(Note: The server will automatically create `ai_novel_writer.db` in your folder without needing PostgreSQL!)*

2. **Open Swagger UI in your browser**:
   Navigate to [http://localhost:8000/docs](http://localhost:8000/docs)

3. **Perform Manual Endpoint Testing**:
   - **Step 1 (Health Check)**: Click `GET /health` ➔ `Try it out` ➔ `Execute`. Verify response status is `200 OK` with `"status": "healthy"`.
   - **Step 2 (Register User)**: Click `POST /api/v1/auth/register` ➔ `Try it out` ➔ Provide email/password ➔ `Execute`.
   - **Step 3 (Login & Get Token)**: Click `POST /api/v1/auth/login` ➔ Provide credentials ➔ `Execute` ➔ Copy `access_token`.
   - **Step 4 (Authorize)**: Click the **Authorize** button at top right ➔ Paste token ➔ Click **Authorize**.
   - **Step 5 (Create Novel)**: Click `POST /api/v1/novels` ➔ Provide `title` and `genre` ➔ `Execute` ➔ Copy the returned `id`.
   - **Step 6 (Trigger AI LangGraph Workflow)**: Click `POST /api/v1/ai/generate` ➔ Provide `novel_id` and `user_instruction` ➔ `Execute`. Watch LangGraph generate prose via Gemini!
   - **Step 7 (Test SSE Streaming Rewrite)**: Click `POST /api/v1/ai/rewrite` ➔ Provide `chapter_id`, set `"stream": true` ➔ Observe real-time response stream!
   - **Step 8 (Test Vector Search)**: Click `POST /api/v1/search` ➔ Provide `novel_id` and search query ➔ `Execute`.

---

## 📋 Individual Test File Reference

| Test File | Command | What it Tests |
|---|---|---|
| `tests/test_e2e_system.py` | `.\venv\Scripts\python.exe -m pytest tests/test_e2e_system.py -s` | End-to-end full system flow (Health ➔ Auth ➔ CRUD ➔ LangGraph ➔ Streaming ➔ Vector Search) |
| `tests/test_ai.py` | `.\venv\Scripts\python.exe -m pytest tests/test_ai.py -s` | AI endpoints (`/generate`, `/rewrite`, `/revise-story`, `/chat`, `/search`) |
| `tests/test_gemini.py` | `.\venv\Scripts\python.exe -m pytest tests/test_gemini.py -s` | Live Google Gemini LLM API integration |
| `tests/test_graph.py` | `.\venv\Scripts\python.exe -m pytest tests/test_graph.py -s` | LangGraph agent state graph & node transitions |
| `tests/test_agents_db.py` | `.\venv\Scripts\python.exe -m pytest tests/test_agents_db.py -s` | Memory Agent, Consistency Agent, and Revision Agent DB updates |
| `tests/test_retrieval.py` | `.\venv\Scripts\python.exe -m pytest tests/test_retrieval.py -s` | Retrieval Agent, `pgvector` similarity search & `ContextPackage` assembly |
| `tests/test_crud.py` | `.\venv\Scripts\python.exe -m pytest tests/test_crud.py -s` | CRUD APIs across all 7 story entities with tenant isolation |
| `tests/test_auth.py` | `.\venv\Scripts\python.exe -m pytest tests/test_auth.py -s` | Password hashing, JWT auth tokens, user registration & login |
