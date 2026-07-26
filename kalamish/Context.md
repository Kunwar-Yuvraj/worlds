# AI Novel Writing Platform - Backend System Design

## Project Overview

Build an AI-powered novel writing platform similar to VS Code for authors. The system should allow users to create, manage, edit, and generate long-form novels while maintaining consistency across hundreds of chapters.

The architecture should be AI-first and designed around multiple specialized agents coordinated using LangGraph.

---

# Tech Stack

Backend:

* FastAPI
* LangGraph
* PostgreSQL
* pgvector
* SQLAlchemy
* Redis (optional for MVP)
* Gemini 2.5 Flash (or OpenRouter)
* Gemini Embedding Model

Frontend:

* React
* Monaco Editor

---

# High Level Architecture

```text
React + Monaco

↓

FastAPI

↓

LangGraph

↓

Agents

↓

PostgreSQL + pgvector

↓

Gemini
```

FastAPI is responsible for:

* Authentication
* CRUD APIs
* Database interaction
* Calling LangGraph
* Streaming AI responses

LangGraph is responsible for orchestrating AI agents.

PostgreSQL is the source of truth.

pgvector stores embeddings for semantic retrieval.

---

# User Flow

## Authentication

User registers or logs in.

---

## Dashboard

User sees:

* List of Novels
* Create Novel

---

## Create Novel

User enters:

* Title
* Genre
* Language
* Tone
* Style
* POV
* Estimated Chapters

After clicking Create:

Planner Agent generates:

* Outline
* Characters
* Locations
* World Rules
* Timeline
* Plot Threads

Everything is stored in PostgreSQL.

No chapters are generated yet.

---

## Generate Chapter

User clicks:

Generate Chapter

FastAPI sends request to LangGraph.

Workflow:

Planner Agent

↓

Retrieval Agent

↓

Writer Agent

↓

Consistency Agent

↓

Editor Agent

↓

Memory Agent

↓

Return Chapter

The generated chapter is stored in PostgreSQL.

Embeddings are generated and stored in pgvector.

---

## Editing

User edits manually.

When Save is clicked:

Memory Agent extracts new facts.

Example:

Old:

John has blue eyes.

New:

John has green eyes.

Memory updates:

Character

↓

Eye Color = Green

Embeddings are regenerated.

Future generations use updated information.

---

## Story Revision

User requests:

"Change John from a police officer to a journalist."

Planner routes request to Revision Agent.

Revision Agent:

* Understands requested change
* Finds affected chapters
* Retrieves related entities
* Rewrites affected chapters
* Updates Memory
* Updates Timeline
* Updates Embeddings

---

## Search

User asks:

"Where did Sarah lie?"

Planner identifies it as retrieval.

Retrieval Agent performs semantic search.

Returns relevant chapters.

No writing agent is involved.

---

# AI Agents

## 1. Planner Agent

Responsibilities:

* Detect request type
* Route workflow
* Never generate text

Possible request types:

* Generate chapter
* Rewrite chapter
* Story revision
* Search
* Create novel

---

## 2. Retrieval Agent

Most important agent.

Responsibilities:

* Search PostgreSQL
* Search pgvector
* Rank results
* Remove duplicates
* Build Context Package

It never writes.

---

## 3. Writer Agent

Responsibilities:

* Generate chapters
* Generate scenes
* Continue stories
* Expand outlines
* Generate dialogue

Consumes Context Package.

---

## 4. Editor Agent

Responsibilities:

* Improve grammar
* Rewrite
* Change tone
* Improve pacing
* Shorten or expand text

---

## 5. Memory Agent

Responsibilities:

Extract facts from generated content.

Update:

* Characters
* Timeline
* Relationships
* Plot Threads
* World Rules

Generate embeddings.

Keep PostgreSQL and pgvector synchronized.

---

## 6. Consistency Agent

Responsibilities:

Detect:

* Timeline errors
* Character inconsistencies
* World rule violations
* Plot contradictions

Can reject or request rewrite.

---

## 7. Revision Agent

Handles story-wide modifications.

Exampl
Remove a character.

Change profession.

Change ending.

Update events across multiple chapters.

Works with dependency graph.

---

# Context Package

The Retrieval Agent should build a Context Package.

Every other agent consumes this package instead of querying the database.

Example:

```json
{
  "chapter": {},
  "characters": [],
  "timeline": [],
  "world_rules": [],
  "plot_threads": [],
  "locations": [],
  "relevant_scenes": [],
  "outline": {},
  "user_instruction": ""
}
```

This keeps all agents independent of the database.

---

# Core Database Entities

## User

* id
* name
* email
* password_hash
* created_at

---

## Novel

* id
* user_id
* title
* genre
* language
* style
* tone
* pov
* description
* status
* created_at

---

## Chapter

* id
* novel_id
* chapter_number
* title
* content
* summary
* word_count
* status
* created_at
* updated_at

---

## Character

* id
* novel_id
* name
* age
* occupation
* appearance
* personality
* goals
* backstory
* status
* metadata

---

## CharacterRelationship

* id
* character_one
* character_two
* relationship
* description

---

## Location

* id
* novel_id
* name
* description
* history
* geography
* rules

---

## TimelineEvent

Stores chronological history.

Example:

Day 15

Sarah loses arm.

Fields:

* id
* novel_id
* day
* chapter_id
* title
* description

Timeline stores what HAS happened.

---

## WorldRule

Stores laws of the fictional universe.

Examples:

Fire magic cannot heal.

Only royal blood controls dragons.

Fields:

* id
* novel_id
* category
* rule

These rules are enforced by the Consistency Agent.

---

## Outline

Stores planned future chapters.

Example:

Chapter 15

John discovers the hidden temple.

Fields:

* id
* novel_id
* chapter_number
* title
* summary
* status

Outline stores what SHOULD happen.

---

## PlotThread

Tracks unresolved story arcs.

Example:

Missing Prince

Introduced:

Chapter 4

Resolved:

Chapter 52

Fields:

* id
* novel_id
* title
* description
* introduced_chapter
* resolved_chapter
* status

---

## RevisionHistory

Stores every AI rewrite.

Fields:

* id
* chapter_id
* before
* after
* instruction
* created_at

---

## AgentMemory

Stores extracted facts.

Example:

John lost left arm.

Source:

Chapter 18

Fields:

* id
* novel_id
* fact
* source_chapter
* confidence
* embedding_id

---

## Embedding

Stores vector embeddings.

Fields:

* id
* entity_type
* entity_id
* text
* embedding

---

# API Design

Authentication

* POST /auth/register
* POST /auth/login
* GET /auth/me
* POST /auth/logout

Novels

* GET /novels
* POST /novels
* GET /novels/{id}
* PUT /novels/{id}
* DELETE /novels/{id}

Chapters

* GET /chapters/{id}
* POST /novels/{id}/chapters
* PUT /chapters/{id}
* DELETE /chapters/{id}

Characters

* GET /characters
* POST /characters
* PUT /characters/{id}
* DELETE /characters/{id}

Locations

* GET /locations
* POST /locations

Timeline

* GET /timeline
* POST /timeline

World Rules

* GET /world-rules
* POST /world-rules
* PUT /world-rules/{id}

Outline

* GET /outline
* PUT /outline

AI

* POST /ai/generate
* POST /ai/rewrite
* POST /ai/revise-story
* POST /search
* POST /chat

---

# Suggested Folder Structure

```text
app/

├── api/
│   ├── auth.py
│   ├── novels.py
│   ├── chapters.py
│   ├── ai.py
│   ├── search.py
│   ├── characters.py
│   ├── world.py
│   ├── timeline.py
│   └── revisions.py
│
├── agents/
│   ├── planner.py
│   ├── retrieval.py
│   ├── writer.py
│   ├── editor.py
│   ├── revision.py
│   ├── memory.py
│   └── consistency.py
│
├── prompts/
│   ├── planner.md
│   ├── retrieval.md
│   ├── writer.md
│   ├── editor.md
│   ├── revision.md
│   ├── memory.md
│   └── consistency.md
│
├── graph/
│   └── novel_graph.py
│
├── services/
│   ├── llm_service.py
│   ├── embedding_service.py
│   ├── vector_service.py
│   └── storage_service.py
│
├── database/
│   ├── models.py
│   ├── repositories.py
│   └── session.py
│
├── schemas/
│
├── utils/
│
└── main.py
```

---

# Design Principles

1. PostgreSQL is the single source of truth.
2. pgvector is used only for semantic retrieval.
3. Agents never access the database directly except through retrieval/services.
4. Retrieval Agent builds a Context Package consumed by all other agents.
5. Prompts are stored as Markdown files; agent logic is implemented in Python.
6. LangGraph orchestrates the workflow between agents.
7. The architecture should be modular so additional agents can be added without major refactoring.
