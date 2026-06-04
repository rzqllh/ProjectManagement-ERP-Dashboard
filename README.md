# OpsPilot — AI-Powered Project Control & Evidence Workspace

OpsPilot is a Personal PMO ERP Control Center, built as a highly structured, strict data-model application. It is designed to trace project dependencies, escalate risks intelligently, and maintain an immutable chain of operational evidence.

## Current State: Phase 0A Core Reliability Baseline

This repository has been locked down as a flagship portfolio project.

**What is currently implemented:**
- Next.js App Router foundation
- Firebase Firestore & Auth integration points
- Strict Zod data contracts for Projects, ND Records, and Decisions
- Service layer separating business logic from UI
- Timeline and Activity Tracking baseline

**What is NOT YET implemented (Do not assume these exist):**
- Real Auth / RBAC (currently mocked to 'system' user)
- Document Generation
- AI / RAG Integration
- Telegram Bot
- Advanced Graph Traversals

## Development Guidelines

All developers and agents MUST read the reference documents in `DOCS/` before making changes:
- `DEV_API_CONTRACT.md` - API standard format
- `DEV_COMPONENT_PATTERNS.md` - React and Tailwind patterns
- `DEV_ERROR_CONTRACT.md` - Single-source-of-truth ServiceResult and AppErrors
- `DEV_MOTION.md` - Animation rules
- `DEV_TOKENIZATION.md` - Design token usage
- `DEV_TRACKER.md` - Timeline taxonomy rules

## Running the Project

```bash
npm install
npm run dev
```

## License

MIT
