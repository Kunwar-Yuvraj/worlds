# PostgreSQL & Backend Setup Guide

This guide provides step-by-step instructions to install **PostgreSQL** with the **`pgvector`** vector search extension, configure the backend environment, run database migrations, and launch the **AI Novel Writing Platform** backend perfectly.

---

## 📌 Prerequisites Overview

| Component | Minimum Version | Notes |
|---|---|---|
| **PostgreSQL** | 15+ (16 recommended) | Required for relational persistence & pgvector |
| **pgvector** | 0.5.0+ | Vector extension for 768-dimensional embeddings |
| **Python** | 3.10 - 3.12 | Virtualenv existing at `backend/venv` |

---

## ⚡ Option 1: Quick Setup with Docker (Recommended)

Docker is the fastest way to get PostgreSQL and `pgvector` up and running on Windows without manual binary installation.

### Step 1: Run PostgreSQL + pgvector Container

Open PowerShell or Command Prompt and execute:

```powershell
docker run -d `
  --name ai_novel_postgres `
  -e POSTGRES_DB=ai_novel_writer `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -p 5432:5432 `
  pgvector/pgvector:pg16
```

### Step 2: (Optional) Docker Compose

Alternatively, create a `docker-compose.yml` in the root directory:

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: ai_novel_postgres
    restart: always
    environment:
      POSTGRES_DB: ai_novel_writer
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start container:
```powershell
docker compose up -d
```

---

## 💻 Option 2: Native Windows Installation

If you prefer installing PostgreSQL directly on Windows without Docker:

### Step 1: Install PostgreSQL 16

1. Download the installer from EDB: [PostgreSQL Downloads for Windows](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
2. Run the installer (e.g., `postgresql-16.x-windows-x64.exe`).
3. Set superuser (`postgres`) password to `postgres` (or your chosen password).
4. Keep the default port `5432`.
5. Complete installation and launch **pgAdmin 4** or **SQL Shell (psql)**.

### Step 2: Install pgvector Extension on Windows

`pgvector` must be added to your PostgreSQL installation:

#### Method A: Pre-compiled Binaries (Easiest)
1. Download pre-built `pgvector` Windows DLL binaries from [pgvector GitHub releases](https://github.com/pgvector/pgvector/releases).
2. Copy `vector.dll` into your PostgreSQL lib directory:
   `C:\Program Files\PostgreSQL\16\lib\`
3. Copy `vector.control` and `vector--*.sql` into your PostgreSQL extension directory:
   `C:\Program Files\PostgreSQL\16\share\extension\`

#### Method B: Building with C Compiler / MSVC
Open Developer Command Prompt for Visual Studio:
```cmd
set "PGROOT=C:\Program Files\PostgreSQL\16"
cd \path\to\pgvector
nmake /F Makefile.win
nmake /F Makefile.win install
```

### Step 3: Create Database & Enable Extension

Open **psql** or **pgAdmin 4 Query Tool** and execute:

```sql
-- Create the database
CREATE DATABASE ai_novel_writer;

-- Connect to the database
\c ai_novel_writer;

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## ⚙️ 3. Configure Backend Environment (`backend/.env`)

Open [`backend/.env`](file:///d:/AI%20novel%20writer/backend/.env) and update the database configuration settings:

```env
# Application Configuration
PROJECT_NAME="AI Novel Writing Platform"
VERSION="1.0.0"
API_V1_STR="/api/v1"
LOG_LEVEL="INFO"

# Database Configuration (PostgreSQL + pgvector enabled)
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/ai_novel_writer"
SYNC_DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/ai_novel_writer"

# (Comment out SQLite local dev fallback)
# DATABASE_URL="sqlite+aiosqlite:///./ai_novel_writer.db"

# JWT Authentication Configuration
JWT_SECRET="dev_secret_key_change_in_production_environment_12345"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# LLM & Embedding Settings
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
LLM_MODEL="gemini-flash-latest"
EMBEDDING_MODEL="text-embedding-004"
```

> **Note**: Adjust `postgres:postgres` if your database user or password differs.

---

## 🗄️ 4. Run Database Migrations (Alembic)

Now apply the database migrations to create all 13 core entities, foreign key relationships, indexes, and vector columns.

Open PowerShell in `d:\AI novel writer\backend`:

```powershell
cd "d:\AI novel writer\backend"

# Apply all Alembic database migrations
.\venv\Scripts\alembic.exe upgrade head
```

**Expected Migration Output**:
```text
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 0001_initial_schema, Create initial schema with all 13 database entities and pgvector support
```

---

## 🚀 5. Run & Verify the Backend

### Step 1: Launch FastAPI Server

```powershell
cd "d:\AI novel writer\backend"
.\venv\Scripts\uvicorn app.main:app --reload --port 8000
```

### Step 2: Open Interactive Documentation
Open your browser and navigate to:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### Step 3: Run Full Automated Test Suite

Verify that all 16 integration tests pass against your live PostgreSQL database:

```powershell
cd "d:\AI novel writer\backend"
.\venv\Scripts\python.exe -m pytest tests/ -v
```

---

## 🛠️ 6. Troubleshooting Common Issues

### Issue 1: `ERROR: extension "vector" is not available`
- **Cause**: `pgvector` binaries are missing from PostgreSQL installation.
- **Fix**: Use Docker (`pgvector/pgvector:pg16`) or follow Step 2 under Option 2 to copy `vector.dll` and `vector.control` to PostgreSQL's `lib/` and `share/extension/` folders.

### Issue 2: `Connection refused (127.0.0.1:5432)`
- **Cause**: PostgreSQL service is not running.
- **Fix**: Start service via Windows Services (`services.msc` ➔ `postgresql-x64-16` ➔ Start) or start your Docker container (`docker start ai_novel_postgres`).

### Issue 3: `password authentication failed for user "postgres"`
- **Cause**: Database password in `DATABASE_URL` doesn't match your setup.
- **Fix**: Update password in [`backend/.env`](file:///d:/AI%20novel%20writer/backend/.env):
  `DATABASE_URL="postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/ai_novel_writer"`

---

## 📑 Summary Checklist

- [ ] PostgreSQL 15+ installed & running on port `5432`
- [ ] Database `ai_novel_writer` created
- [ ] Extension `vector` enabled (`CREATE EXTENSION IF NOT EXISTS vector;`)
- [ ] Updated `backend/.env` with PostgreSQL connection string
- [ ] Ran `alembic upgrade head` successfully
- [ ] Launched server with `uvicorn app.main:app --reload`
- [ ] All 16 pytest tests passing (`pytest tests/ -v`)
