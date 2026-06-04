# Codex Follow-up Prompts

Use these prompts one by one. Do not ask the coding agent to do everything in one shot.

## Prompt 1 — Static Audit Only

```txt
Read this repository and AGENTS.md first. Do not modify code yet.

I need a static audit of the current CANERIS PMO project as a fullstack portfolio app.

Focus on:
1. Current architecture.
2. Auth and API protection.
3. Data model gaps.
4. Feature gaps for PMO tracking, document generation, and AI knowledge base.
5. Files that are too large or risky to edit.
6. Missing documentation.
7. Priority refactor plan.

Return the result as a markdown report with:
- Strengths.
- Critical issues.
- P0/P1/P2 task list.
- Suggested file changes, but no code changes yet.
```

## Prompt 2 — Add README

```txt
Read AGENTS.md and the current repository.

Create a professional README.md for this project as a portfolio flagship project.

Position the app as:
CANERIS PMO — AI-powered PMO workspace for project tracking, document automation, decision governance, dependency graphing, stakeholder management, and project knowledge retrieval.

Include:
- Problem statement.
- Solution.
- Feature list.
- Tech stack.
- Architecture overview.
- Local setup.
- Environment variables explanation.
- Demo flow.
- Roadmap.
- Security/auth note.
- Screenshots placeholders.

Do not claim features are complete if they are only planned. Clearly label planned features.
```

## Prompt 3 — Consolidate Errors and ServiceResult

```txt
Read AGENTS.md first.

Refactor the project to use one canonical error and service result system.

Requirements:
1. Keep `src/lib/errors.ts` as the source of truth for AppError classes.
2. Keep one `ServiceResult<T>` type shaped as:
   - `{ success: true; data: T }`
   - `{ success: false; error: AppError }`
3. Remove or update duplicate/conflicting error definitions in `src/lib/service-result.ts`.
4. Update imports across services as needed.
5. Do not change business behavior.
6. Do not rewrite unrelated files.

After changes, list all changed files and any remaining risk.
```

## Prompt 4 — Server Auth Helper

```txt
Read AGENTS.md first.

Implement a server-side Firebase auth helper for protected API routes.

Create:
- `src/types/auth.ts`
- `src/lib/auth/current-user.ts`
- `src/lib/auth/permissions.ts` if needed

Requirements:
1. Read Firebase ID token from the `session` cookie or Authorization Bearer header.
2. Verify token using Firebase Admin.
3. Return a typed `CurrentUser` with at least `uid`, `email`, and `displayName`.
4. Add placeholder/default workspace and role resolution if workspace membership is not implemented yet, but mark it clearly as temporary.
5. Throw `UnauthorizedError` for invalid/missing token.
6. Do not break existing login flow.
7. Add comments explaining the migration path toward workspace/RBAC.
```

## Prompt 5 — Replace `userId = 'system'` in Project Routes

```txt
Read AGENTS.md first.

Update only the project API routes first to use the new server auth helper.

Target files:
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/projects/[id]/sections/[sectionId]/route.ts`

Requirements:
1. Require current user for POST/PATCH/DELETE.
2. Use `currentUser.uid` instead of `userId = 'system'`.
3. Preserve existing response format.
4. Keep route handlers thin.
5. Do not refactor unrelated modules.

After changes, report changed files and manual test steps.
```

## Prompt 6 — Settings Validation

```txt
Read AGENTS.md first.

Harden the settings API.

Requirements:
1. Add a Zod schema for updating settings.
2. Validate PATCH `/api/settings` request body before saving.
3. Restrict unknown fields if appropriate.
4. Keep existing settings behavior compatible.
5. Return existing API error format on validation failure.
6. Do not rewrite the settings UI unless needed.
```

## Prompt 7 — Workspace Data Model Plan

```txt
Read AGENTS.md first. Do not code yet.

Design a workspace/multi-tenancy migration plan for this Firestore project.

Include:
- New types needed.
- Collections/subcollections recommendation.
- Fields to add to existing entities.
- Repository method changes.
- Auth/RBAC flow.
- Migration strategy for existing data.
- P0 implementation order.

Return only markdown.
```

## Prompt 8 — Evidence Document Generator MVP

```txt
Read AGENTS.md first.

Implement the MVP Evidence Document Generator connected to projects.

Requirements:
1. Add types for GeneratedDocument and DocumentAsset if missing.
2. Add validation schema for evidence document input.
3. Add service/repository layer for generated documents.
4. Add page under dashboard for document generator.
5. Allow user to select project, activity title, date, location, description, and upload/select photo placeholders if actual storage is not ready.
6. Render an HTML preview with watermark date/location at bottom corner of each evidence photo block.
7. Add save generated document metadata to Firestore.
8. Export PDF can be MVP via browser print if server PDF is not ready, but document this limitation.
9. Add empty/loading/error states.
10. Do not remove existing features.
```

## Prompt 9 — Project Documents Tab

```txt
Read AGENTS.md first.

Add a Documents tab/section to project detail page.

Requirements:
1. Show generated documents associated with the project.
2. Show document type, title, generated date, generated by, and status.
3. Add action to open/preview document if data exists.
4. Add CTA to create a new document for this project.
5. Use existing UI style and loading/empty/error states.
6. Keep implementation scoped.
```

## Prompt 10 — AI Knowledge Source Plan

```txt
Read AGENTS.md first. Do not code yet.

Design the AI Knowledge Base implementation plan.

Current project has AI Brain and a simple vector store. I want to evolve it into project-scoped document-grounded RAG.

Include:
- Required data models.
- Upload flow.
- Text extraction strategy.
- Chunking strategy.
- Embedding storage options.
- Firestore vs pgvector tradeoff.
- API endpoints.
- UI pages/components.
- Source citation answer format.
- Security constraints.
- MVP implementation order.
```

## Prompt 11 — Split Large Components

```txt
Read AGENTS.md first.

Refactor one large file only: choose `src/components/ai/AiBrainPanel.tsx`.

Goal:
Reduce file size and improve maintainability without changing visible behavior.

Requirements:
1. Extract small presentational components.
2. Extract reusable hooks if needed.
3. Preserve current API calls and response handling.
4. Keep styling consistent.
5. Do not change AI service logic.
6. Report changed files and behavior equivalence notes.
```

## Prompt 12 — Portfolio Demo Mode

```txt
Read AGENTS.md first.

Add a safe demo mode plan or implementation for portfolio review.

Requirements:
1. Demo should not require private production credentials.
2. Demo data should show projects, ND records, decisions, stakeholders, graph, and AI sample outputs.
3. Do not expose secrets.
4. If implementation is too broad, produce a staged plan first.
5. Add README instructions for demo mode.
```

