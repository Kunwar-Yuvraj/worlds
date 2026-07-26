# AI Novel Writing Platform - Frontend System Design

## Overview

This document defines the frontend architecture for the AI Novel Writing Platform. It is intended to be used as the implementation guide for Antigravity.

The frontend should **not** be built page-by-page. It should be built using a **feature-based architecture**, matching the modular backend.

---

# Recommended Tech Stack

- React 19
- Vite
- Typescript (MVP)
- React Router v7
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Monaco Editor
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide Icons
- Axios
- Server-Sent Events (SSE)
- dnd-kit
- react-markdown

---

# Feature-first Architecture

Instead of:

```text
pages/
components/
```

Use:

```text
features/
├── auth/
├── dashboard/
├── novels/
├── chapters/
├── editor/
├── ai/
├── characters/
├── locations/
├── timeline/
├── outline/
├── world-rules/
└── search/
```

---

# Iterative Milestones

## 1. Project Setup
- React + Vite
- Tailwind
- shadcn/ui
- ESLint
- Prettier
- Axios
- React Router
- TanStack Query
- Zustand

## 2. Authentication
- Login
- Register
- JWT
- Protected Routes

Endpoints:
- POST /auth/login
- POST /auth/register
- GET /auth/me

## 3. Dashboard
- Novel cards
- Create/Edit/Delete Novel

## 4. Workspace
VS Code style layout:
- Sidebar
- Monaco Editor
- AI Panel
- Status Bar

## 5. Sidebar
- Chapters
- Characters
- Locations
- Timeline
- Outline
- World Rules

## 6. Monaco Editor
- Autosave
- Word Count
- Undo/Redo
- Find/Replace
- Fullscreen

## 7. AI Panel
Tabs:
- Generate
- Rewrite
- Chat
- Revision
- Search

Endpoints:
- POST /ai/generate
- POST /ai/rewrite
- POST /ai/chat
- POST /ai/revise-story
- POST /search

## 8. Characters
CRUD + Relationships

## 9. Locations
CRUD + Visualization

## 10. Timeline
Vertical timeline + Drag & Drop

## 11. Outline
Chapter planning board

## 12. World Rules
Grouped by category

## 13. Streaming
Display AI output token-by-token using SSE.

## 14. Global Search
Semantic search across all entities.

## 15. Polish
Animations, Skeletons, Notifications, Keyboard shortcuts, Responsive UI.

---

# Folder Structure

```text
src/
├── app/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── novels/
│   ├── chapters/
│   ├── editor/
│   ├── ai/
│   ├── characters/
│   ├── locations/
│   ├── timeline/
│   ├── outline/
│   ├── world-rules/
│   └── search/
├── components/
├── services/
├── store/
├── hooks/
├── utils/
├── styles/
├── assets/
├── App.jsx
└── main.jsx
```

---

# Workspace Layout

```text
┌────────────────────────────────────────────────────────────────────┐
│ Top Bar                                                            │
├──────────────┬──────────────────────────────┬───────────────────────┤
│ Sidebar      │ Monaco Editor                │ AI Assistant          │
│ Chapters     │                              │ Generate              │
│ Characters   │                              │ Rewrite               │
│ Timeline     │                              │ Chat                  │
│ Locations    │                              │ Search                │
│ Outline      │                              │ Revision              │
│ World Rules  │                              │                       │
├──────────────┴──────────────────────────────┴───────────────────────┤
│ Status Bar                                                         │
└────────────────────────────────────────────────────────────────────┘
```

---

# Recommended Backend Addition

Add:

```text
GET /api/v1/workspace/{novel_id}
```

Return:
- Novel
- Chapters
- Characters
- Locations
- Timeline
- Outline
- World Rules

This minimizes network requests and speeds up workspace initialization.

---

# Rules for Antigravity

1. Build one milestone at a time.
2. Stop after each milestone for review.
3. Do not generate the entire frontend at once.
4. Use reusable components.
5. Keep logic feature-based.
6. Match existing backend APIs.
7. Follow the VS Code-inspired UI consistently.
