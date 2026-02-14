# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

eemee is a semantic search app for storing and searching phrases with AI-powered embeddings. Rust/Axum backend + Preact/TypeScript frontend, PostgreSQL with pgvector for vector similarity search.

## Commands

### Backend (from `backend/`)
```bash
cargo run                    # Start backend server (port 16789)
cargo test                   # Run all tests
cargo test test_name         # Run a single test
cargo build                  # Build debug
```

### Frontend (from `frontend/`)
```bash
npm run dev                  # Dev server with HMR (proxies /api to localhost:16789)
npm run build                # Type-check (tsc -b) + production build
npm run test                 # Vitest in watch mode
npm run test:run             # Vitest single run
```

### Infrastructure
```bash
docker compose up db         # Start PostgreSQL 17 + pgvector (port 5432)
```

## Architecture

**Monorepo**: `backend/` (Rust) and `frontend/` (Preact/TS) as sibling directories.

### Request Flow
1. Frontend Vite dev server proxies `/api/*` to `http://localhost:16789`
2. Backend applies session middleware globally, then auth middleware on `/api/*`
3. Auth middleware skips `/api/auth/*` paths (login, callback, logout, me)
4. All other `/api/*` routes require a valid session
5. In production, backend serves frontend static files via `ServeDir` fallback

### Backend (`backend/src/`)
- **`main.rs`** — App bootstrap: DB pool, session store, OAuth client, router assembly
- **`state.rs`** — `AppState` holding pool, embedder (trait object `Arc<dyn Embedder>`), OAuth client, allowed emails
- **`error.rs`** — `AppError` enum (thiserror) implementing `IntoResponse`; returns `{"error": "..."}` JSON
- **`auth/`** — Google OAuth handlers + `require_auth` middleware. Email allowlist via `ALLOWED_EMAILS` env var
- **`routes/`** — `phrases` (CRUD), `search` (semantic + text), `export` (JSON/CSV)
- **`services/db.rs`** — All SQLx queries
- **`services/embedding.rs`** — `Embedder` trait + `EmbeddingService` (OpenAI text-embedding-3-large, 3072 dims)

### Frontend (`frontend/src/`)
- **`App.tsx`** — Router setup, auth check via `/api/auth/me`
- **`api.ts`** — Fetch wrapper for all backend calls
- **`pages/`** — Home, SearchResults, PhraseDetail, PhraseForm, Login
- **`components/`** — Layout, SearchBox, PhraseCard, TagInput

### Database
- Single `phrases` table with `meaning_embedding vector(3072)` column
- Semantic search uses pgvector `<=>` cosine distance operator
- Migrations run automatically on startup via `sqlx::migrate!()`

## Required Environment Variables

`DATABASE_URL`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAILS` (comma-separated). Optional: `PORT` (default 16789), `OAUTH_REDIRECT_URL`, `STATIC_DIR`, `SESSION_SECRET`.

## Key Constraints

- **Rust edition 2024** — requires Rust 1.85+; Docker must use `rust:1.85-slim` or later
- **oauth2 v5** — no `async_http_client`; pass `&reqwest::Client::new()` to `request_async()`
- **tower-sessions v0.14 + tower-sessions-sqlx-store v0.15** — both depend on `tower-sessions-core` 0.14; do not upgrade tower-sessions to v0.15 (core mismatch)
- **preact-router** — all routed page components must include `path?: string` in their Props interface
- **sqlx::migrate!()** macro reads migrations at compile time relative to `CARGO_MANIFEST_DIR`
