# CANERIS PMO

AI-powered PMO workspace for project tracking, document automation, decision governance, dependency graphing, stakeholder management, and project knowledge retrieval.

> Status: active portfolio project. Some modules are implemented, while document generation and project-grounded AI knowledge base should be clearly labeled as in-progress until completed.

## Problem

PMO teams often manage projects through disconnected spreadsheets, chat threads, manual reports, scattered evidence photos, and separate decision logs. This makes it hard to see current project health, identify blockers, generate operational documents, and reuse project knowledge.

## Solution

CANERIS PMO brings project operations into one workspace:

- Track project progress and sections.
- Manage ND records, issues, risks, and blockers.
- Track decisions and stakeholders.
- Visualize dependencies through graph views.
- Generate operational documents such as evidence reports, attendance sheets, and form kebutuhan.
- Use AI to summarize project status and retrieve knowledge from project records/documents.

## Core Features

### Implemented / Existing

- Firebase-based authentication.
- Dashboard module.
- Project tracking module.
- ND records module.
- Decision management module.
- Stakeholder management module.
- Dependency graph module.
- AI Brain module.
- Telegram settings/integration module.
- Service/repository architecture.
- Zod validation in several feature modules.

### In Progress / Planned

- Server-side auth hardening and RBAC.
- Workspace/multi-tenancy model.
- Document generator for absensi, evidence, and form kebutuhan.
- Project documents tab.
- Project-grounded AI Knowledge Base with uploaded document citations.
- Persistent vector storage.
- Portfolio demo mode and seed data.

## Tech Stack

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn-style UI components.
- Firebase Auth.
- Firebase Admin / Firestore.
- Zod.
- LangChain / Gemini integration.
- Telegram Bot integration.

## Architecture Overview

```txt
src/
  app/                # App Router pages and API routes
  components/         # UI and feature components
  lib/                # shared helpers, Firebase, errors, API response
  repositories/       # Firestore persistence layer
  services/           # business logic layer
  types/              # domain types
```

Recommended request flow:

```txt
Page / Component
  -> API Route Handler
  -> Validation Schema
  -> Auth Helper
  -> Service
  -> Repository
  -> Firestore
```

## Local Setup

```bash
npm install
npm run dev
```

Create `.env.local` based on `.env.example`.

Required environment groups:

- Firebase client config.
- Firebase Admin credentials.
- Gemini API key.
- Telegram bot token, if using Telegram features.

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

GEMINI_API_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_WHITELIST_IDS=
```

## Demo Flow

1. Login.
2. Open Dashboard.
3. Create or inspect a project.
4. Update project section status.
5. Add or inspect ND records.
6. Review decisions and stakeholders.
7. Open Graph to inspect dependencies/blockers.
8. Ask AI Brain for project status or risk summary.
9. Generate an evidence/attendance document when the document generator module is completed.

## Security Notes

Current hardening priorities:

- Verify Firebase ID token server-side in protected API routes.
- Replace temporary `system` actor usage with real user identity.
- Add workspace-scoped authorization.
- Add role-based permissions.
- Validate all settings and document-generation inputs.

## Roadmap

### Phase 0 — Stabilization

- README.
- Server auth helper.
- Error/result consolidation.
- Settings validation.
- Demo data.

### Phase 1 — PMO Workspace

- Workspace model.
- RBAC.
- Project detail tabs.
- Timeline polish.

### Phase 2 — Document Generator

- Evidence generator.
- Absensi generator.
- Form kebutuhan generator.
- PDF export.

### Phase 3 — AI Knowledge Base

- Upload project documents.
- Extract and chunk text.
- Generate embeddings.
- Store/search chunks persistently.
- Answer with citations.

### Phase 4 — Portfolio Polish

- Screenshots.
- Demo video.
- Architecture diagram.
- Tests.
- Deployment guide.

