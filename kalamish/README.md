# AI Novel Writing Platform - Backend System

An AI-powered novel writing backend system (similar to VS Code for authors) that facilitates creating, organizing, editing, and generating long-form novels while maintaining deep worldbuilding and narrative consistency across hundreds of chapters.

The system is AI-first, orchestrated via **LangGraph** using 7 specialized AI agents powered by **Google Gemini**, backed by **PostgreSQL** + **pgvector** (with transparent SQLite in-memory fallback for zero-setup local development and testing).

---

## 📖 User Story & Workflow

### 1. Author Onboarding & Auth
* **Story**: As an author, I want to create an account and log in securely so that my writing projects, outlines, and worldbuilding facts are saved privately.
* **Flow**: The author registers (`POST /auth/register`), logs in (`POST /auth/login`), and receives a JWT token to access subsequent endpoints.

### 2. Novel Planning
* **Story**: As an author, I want to start a new novel project by specifying basic creative constraints (genre, language, tone, POV, estimated chapters) and have an AI Planner generate the initial setup framework (outline, key characters, locations, timeline, world rules).
* **Flow**: The author calls `POST /novels` with constraints. The `Planner` agent automatically initiates the baseline creative metadata, which is saved as structured records.

### 3. Chapter Generation (AI LangGraph Orchestration)
* **Story**: As an author, I want to trigger chapter drafting by giving a simple user instruction, and have the system draft, verify, edit, and update the world memory automatically.
* **Flow**: The author calls `POST /ai/generate`. The system starts the LangGraph workflow:
  1. **Planner Agent**: Processes the user request and determines the node path.
  2. **Retrieval Agent**: Gathers context (outline, characters, world rules, previous scenes) and creates a unified `ContextPackage`.
  3. **Writer Agent**: Generates the initial draft scene or chapter.
  4. **Consistency Agent**: Inspects the draft for timeline conflicts or character contradictions against the database.
  5. **Editor Agent**: Refines grammar, style, pacing, and tone.
  6. **Memory Agent**: Extracts new facts (new character relationships, items, events) and updates the database, regenerating embeddings.

### 4. Interactive Co-Author Assistance
* **Story**: As an author, I want to brainstorm twists, ask questions about my world rules, or rewrite specific sections.
* **Flow**: The author uses `POST /ai/chat` for conversational brainstorming, `POST /ai/rewrite` to rewrite sections (with optional SSE streaming), or `POST /ai/revise-story` to make story-wide revisions across multiple chapters.

---

## ⚙️ How the System Works (Architecture)

```
                       React + Monaco Editor (Frontend)
                                      │
                                      ▼
                               FastAPI Backend
                                      │
           ┌──────────────────────────┴──────────────────────────┐
           ▼                                                     ▼
     REST API Layer                                     LangGraph Workflow
 (Auth, CRUD, SSE, Vector Search)                       (AI Orchestration)
           │                                                     │
           ▼                                                     ▼
     Service Layer                                           AI Agents
 (AuthService, ChapterService, ...)                   (Planner, Retrieval, ...)
           │                                                     │
           ▼                                                     ▼
    Repository Layer                                       Service Layer
 (NovelRepository, UserRepo, ...)                                │
           │                                                     ▼
           └──────────────────────────┬──────────────────────────┘
                                      ▼
                            PostgreSQL + pgvector
```

### Key Design Principles:
1. **Source of Truth**: PostgreSQL is the absolute source of truth.
2. **Semantic Retrieval**: pgvector is used strictly for semantic ranking/similarity queries, not primary keys.
3. **Layered Isolation**: Agents **never** access the database directly; they call the Service Layer, which invokes the Repository Layer.
4. **Context Package**: The `RetrievalAgent` is the sole compiler of the `ContextPackage` schema. Every downstream agent consumes this object.

---

## 📁 Directory Structure

```text
backend/
├── app/
│   ├── api/             # API Router endpoints
│   ├── agents/          # Agent logic classes
│   ├── prompts/         # Markdown system instruction prompts
│   ├── graph/           # LangGraph State & Workflow compiles
│   ├── config/          # Settings configurations
│   ├── database/        # Session handlers & SQLAlchemy models
│   ├── repositories/    # Database query layers
│   ├── services/        # Business logic layers
│   ├── schemas/         # Pydantic schemas (Request/Response)
│   ├── dependencies/    # FastAPI dependency injection (e.g., Auth)
│   ├── utils/           # Shared utility tools (e.g., Logging)
│   └── main.py          # FastAPI Main Entrypoint
├── alembic/             # Migration configurations
├── tests/               # Pytest integration/unit test suite
├── .env                 # Environment variables
├── requirements.txt     # Python packages
└── README.md            # This file
```

---

## 📡 API Endpoints

The API consists of **46 endpoints** grouped into modular routers:

### 1. System
* `GET /health` - Service health status.
* `GET /` - Welcome root endpoint.

### 2. Authentication (`/api/v1/auth`)
* `POST /auth/register` - Create user.
* `POST /auth/login` - Generate JWT access token.
* `GET /auth/me` - Get current authenticated user profile.
* `POST /auth/logout` - Log out session.

### 3. Novels (`/api/v1/novels`)
* `GET /novels` - List current user's novels.
* `POST /novels` - Create new novel project.
* `GET /novels/{id}` - Fetch novel details.
* `PUT /novels/{id}` - Update novel metadata.
* `DELETE /novels/{id}` - Delete novel.

### 4. Chapters (`/api/v1/chapters` & `/api/v1/novels/{id}/chapters`)
* `GET /novels/{id}/chapters` - List chapters of a novel.
* `POST /novels/{id}/chapters` - Add a new chapter.
* `GET /chapters/{id}` - Fetch chapter content.
* `PUT /chapters/{id}` - Update chapter content.
* `DELETE /chapters/{id}` - Delete chapter.

### 5. Story Entities (CRUD)
Provides resource management for novel context:
* **Characters** (`/api/v1/characters` & `/api/v1/novels/{id}/characters`)
* **Locations** (`/api/v1/locations` & `/api/v1/novels/{id}/locations`)
* **Timeline Events** (`/api/v1/timeline` & `/api/v1/novels/{id}/timeline`)
* **Outlines** (`/api/v1/outlines` & `/api/v1/novels/{id}/outlines`)
* **World Rules** (`/api/v1/world-rules` & `/api/v1/novels/{id}/world-rules`)

### 6. AI Engine (`/api/v1/ai`)
* `POST /ai/generate` - Trigger LangGraph multi-agent workflow for drafting.
* `POST /ai/rewrite` - Rewrite chapter prose (supports real-time SSE streaming via `stream: true`).
* `POST /ai/revise-story` - Execute story-wide revisions across multiple chapters.
* `POST /ai/chat` - Brainstorm with the conversational assistant.

### 7. Search (`/api/v1/search`)
* `POST /search` - Semantic pgvector similarity search across story events and chapter scenes.

---

## 🚀 Getting Started

### 1. Database Setup
The system can run on **PostgreSQL** or **SQLite (zero-setup fallback)**.
* Detailed Database setup (Docker / Windows native) is documented in: **[`POSTGRES_SETUP_GUIDE.md`](file:///d:/AI%20novel%20writer/POSTGRES_SETUP_GUIDE.md)**.

### 2. Quick Backend Startup

1. **Install Dependencies**:
   ```powershell
   cd backend
   pip install -r requirements.txt
   ```
2. **Apply Migrations**:
   ```powershell
   alembic upgrade head
   ```
3. **Start Server**:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```

### 3. Testing
* Running tests & utilizing Postman is documented in: **[`POSTMAN_TESTING_PLAN.md`](file:///d:/AI%20novel%20writer/POSTMAN_TESTING_PLAN.md)** and **[`TESTING_PLAN.md`](file:///d:/AI%20novel%20writer/TESTING_PLAN.md)**.
