# PMO ERP Project — Static Review

Reviewed source: `PMO-ERP-Project.zip`

## Review Scope

This review is based on static inspection only. I did not run `npm install`, `next build`, or connect to Firebase/Gemini/Telegram credentials, so runtime behavior still needs local verification.

## Current Project Snapshot

Detected stack and structure:

- Next.js App Router project.
- TypeScript with `strict: true` in `tsconfig.json`.
- Firebase client auth and Firebase Admin/Firestore backend access.
- Tailwind CSS v4 style setup with shadcn-style components.
- Modules already present:
  - Auth/login.
  - Dashboard.
  - Projects.
  - ND records.
  - Decisions.
  - Stakeholders.
  - Graph/dependency visualization.
  - AI Brain.
  - Telegram integration.
  - Settings.
- Approximate codebase metrics from static scan:
  - 155 TypeScript/TSX/CSS files.
  - Around 16k non-empty LOC.
  - 32 API route files.
  - 55 client components.
  - Around 170 `any` usages.
  - 7 TODO/FIXME markers.

## Strong Points

### 1. The product idea is portfolio-worthy

The project already has a serious domain: PMO/ERP control center. This is stronger than generic portfolio projects like todo apps, e-commerce clones, or simple CRUD dashboards.

The best positioning is:

> AI-powered PMO Workspace for project tracking, operational document generation, decision tracking, stakeholder management, dependency graphing, and project knowledge retrieval.

### 2. Existing modules are already close to a flagship product

The presence of Projects, ND Records, Decisions, Stakeholders, Graph, AI Brain, Telegram, and Settings gives this project a believable enterprise/workflow feel.

### 3. Service/repository separation already exists

The project has `repositories/` and `services/`, which is a good foundation for maintainability. This is better than putting all business logic directly inside route handlers.

### 4. Zod validation exists in several modules

Validation files exist for projects, decisions, ND records, and stakeholders. This is useful for both runtime safety and portfolio credibility.

### 5. Timeline/activity concepts are already present

Timeline/event logging exists in service logic. This is a strong fullstack signal because PMO systems need auditability.

### 6. Graph and AI features create differentiation

The graph module and AI Brain give the project a more advanced product story. This can become a standout portfolio differentiator if stabilized and documented.

## Critical Issues

### 1. Auth is not fully enforced server-side

Current state:

- Middleware checks only whether a `session` cookie exists.
- Many API actions still use `userId = 'system'`.
- I did not see a consistent server-side verification flow using Firebase Admin token verification inside protected API handlers.

Risk:

- A fake cookie could potentially pass middleware checks if API routes rely only on cookie presence.
- Audit logs and timeline events are not tied to real users.
- RBAC cannot be trusted yet.

Required fix:

Create a server auth helper:

```ts
getCurrentUser(request): Promise<{ uid: string; email: string; role: UserRole; workspaceId: string }>
```

Then require it in all mutating API routes.

### 2. RBAC and workspace/multi-tenancy are missing or not obvious

For a portfolio-level PMO app, every record should belong to a workspace or organization.

Minimum required entities:

- Workspace.
- WorkspaceMember.
- UserRole.
- Project.
- ProjectMember or project assignment.

Without this, the product feels like a personal dashboard rather than a real fullstack platform.

### 3. Document generator is not implemented yet

The project currently has ND records and project tracking, but no strong evidence of the planned document generator module:

- Absensi generator.
- Evidence generator.
- Form kebutuhan generator.
- Template storage.
- PDF export.
- Generated document history.

This should become Phase 2.

### 4. AI Knowledge Base is promising but not production-ready yet

The project includes AI services and a simple in-memory vector store. For portfolio positioning, the AI module should become document/project-based RAG:

- Upload document.
- Extract text.
- Chunk text.
- Generate embeddings.
- Store embeddings persistently.
- Search by project/workspace scope.
- Return cited sources.

Current in-memory vector storage is fine for prototyping, but it should be documented as temporary or replaced with persistent vector storage.

### 5. Type safety needs tightening

Static scan found around 170 `any` usages. Some are acceptable in library boundaries, but many should be replaced with typed DTOs, API response types, form types, and component props.

Priority areas:

- API route request/response contracts.
- Dashboard fetch results.
- AI response parsing.
- Graph node/edge payloads.
- Form submit handlers.

### 6. Error/service result definitions are inconsistent

There are multiple service result/error patterns:

- `src/services/base.service.ts` uses `AppError`.
- `src/lib/service-result.ts` defines another `ServiceResult` and error classes.
- `src/lib/errors.ts` defines `AppError`, `ValidationError`, `NotFoundError`, etc.

This should be consolidated into one source of truth.

### 7. Large components and services need splitting

Large files detected:

- `src/services/nd.service.ts` around 678 lines.
- `src/app/(dashboard)/nd/page.tsx` around 667 lines.
- `src/components/ai/AiBrainPanel.tsx` around 659 lines.
- `src/app/(dashboard)/settings/page.tsx` around 594 lines.
- `src/app/(auth)/login/page.tsx` around 543 lines.

These are not automatically wrong, but they make maintenance, testing, and AI-agent editing risky.

### 8. Settings API accepts broad patch body

`PATCH /api/settings` appears to cast request body directly to `Partial<SystemSettings>` without visible schema validation.

Required fix:

Add `updateSettingsSchema` and validate the body before persistence.

### 9. Testing and documentation are missing

No README was detected in the ZIP root. I also did not see test setup.

For portfolio readiness, this is a major gap. A good README can make the same codebase look 2x more professional.

## Recommended Portfolio Score

Current static score: **72 / 100**

Breakdown:

- Product idea: 90/100
- Existing feature breadth: 82/100
- Architecture direction: 75/100
- Security/auth maturity: 45/100
- Type safety: 60/100
- UI consistency: 70/100
- Portfolio documentation: 25/100
- AI readiness: 60/100

## Priority Fix Order

### P0 — Must fix before portfolio/demo

1. Add README.
2. Add server-side auth verification helper.
3. Replace `userId = 'system'` in protected mutating routes.
4. Add workspace ownership/scope to core records.
5. Consolidate error/service result types.
6. Add basic seed/demo data.
7. Add `.env.example` explanation.

### P1 — Strong fullstack upgrade

1. Add document generator module.
2. Add generated document history per project.
3. Add PDF export.
4. Add upload storage strategy.
5. Add project-level AI knowledge sources.
6. Add persistent vector storage or clearly documented prototype fallback.

### P2 — Polish

1. Split large components.
2. Reduce `any` usage.
3. Add loading/empty/error states consistently.
4. Add dashboard demo script.
5. Add screenshots/GIF/video.
6. Add tests for services and API handlers.

## Best Final Positioning

Use this project as one flagship portfolio project, not three separate projects.

Recommended product name:

> ProjectPilot / CANERIS PMO

Recommended tagline:

> An AI-powered PMO workspace for project tracking, operational document automation, decision governance, dependency mapping, and project knowledge retrieval.

