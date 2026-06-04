# AGENTS.md — Coding Agent Guideline for CANERIS PMO

Use this file as the main instruction file for Codex or any coding agent.

## Project Identity

This is a Next.js fullstack portfolio project named CANERIS PMO / ProjectPilot.

Product direction:

> AI-powered PMO workspace for project tracking, operational document generation, decision governance, dependency graphing, stakeholder management, and project knowledge retrieval.

Do not turn this project into a generic ERP, CRM, todo app, or chatbot wrapper.

## Non-Negotiable Rules

1. Do not remove existing features unless explicitly instructed.
2. Do not rewrite the whole project if a targeted refactor is enough.
3. Do not introduce a second UI system.
4. Do not bypass the existing service/repository structure.
5. Do not add fake features that only exist in UI without data flow.
6. Do not hardcode production secrets, API keys, tokens, or private credentials.
7. Do not use `any` unless absolutely necessary at external library boundaries.
8. Do not create duplicate utility/error/result patterns.
9. Do not ignore loading, empty, and error states.
10. Do not skip validation for API inputs.

## Architecture Rules

### App Router

- Use Next.js App Router conventions.
- Keep route handlers thin.
- Put business logic in `src/services`.
- Put persistence logic in `src/repositories`.
- Put shared types in `src/types`.
- Put validation schemas near services or in dedicated validation files.

### Route Handler Pattern

Every protected API route should follow this pattern:

```ts
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireCurrentUser(request);
    const body = await request.json();
    const input = schema.parse(body);
    const result = await service.action(input, currentUser);

    if (!result.success) throw result.error;
    return successResponse(result.data, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
```

### Authentication

Server-side auth is required for protected API routes.

Required helper:

```ts
requireCurrentUser(request: NextRequest): Promise<CurrentUser>
```

The helper should:

- Read the Firebase ID token from cookie/header.
- Verify it using Firebase Admin.
- Return `uid`, `email`, `displayName`, `role`, and `workspaceId` when available.
- Throw `UnauthorizedError` if invalid.

Do not trust cookie presence alone.

### Authorization / RBAC

Use clear roles:

```ts
type UserRole = 'owner' | 'admin' | 'pmo' | 'manager' | 'member' | 'viewer';
```

Minimum rules:

- Owner/Admin can manage workspace settings and users.
- PMO can manage projects, ND records, decisions, documents, and reports.
- Manager can update assigned project data.
- Member can update assigned tasks/sections.
- Viewer is read-only.

All records should be scoped by `workspace_id`.

### Data Modeling

Every core entity should include:

```ts
id: string;
workspace_id: string;
created_at: string;
updated_at: string;
created_by: string;
updated_by?: string;
soft_delete: boolean;
```

Core entities:

- Workspace.
- WorkspaceMember.
- Project.
- ProjectSection.
- Task / WorkItem.
- NDRecord.
- Decision.
- Stakeholder.
- TimelineEvent.
- DocumentTemplate.
- GeneratedDocument.
- KnowledgeSource.
- KnowledgeChunk.
- AiQueryLog.

### Validation

All write APIs must validate using Zod.

Examples:

- `createProjectSchema`.
- `updateProjectSchema`.
- `createDocumentTemplateSchema`.
- `generateEvidenceSchema`.
- `uploadKnowledgeSourceSchema`.
- `updateSettingsSchema`.

### Error Handling

Use a single error system.

Preferred source of truth:

- `src/lib/errors.ts` for `AppError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`.
- `src/lib/service-result.ts` should not define competing error classes.

API response format:

```ts
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

### UI Rules

- Keep the existing dark command-center style unless explicitly changed.
- Use existing shadcn-style components where possible.
- Keep radius, spacing, border, and glass style consistent.
- Every main page needs:
  - Page title.
  - Short description.
  - Primary action.
  - Search/filter if data-heavy.
  - Loading state.
  - Empty state.
  - Error state.

### Component Size Rules

Prefer splitting files over huge components.

Soft limits:

- Page component: under 250 lines.
- Form component: under 250 lines.
- Service file: under 350 lines.
- Utility file: under 250 lines.

If a file exceeds this, split into:

- `components/feature/...`
- `hooks/use-feature.ts`
- `lib/feature-utils.ts`
- `services/feature.service.ts`
- `repositories/feature.repository.ts`

### AI Feature Rules

AI must be grounded in project data or uploaded documents.

Do not produce unsupported claims. AI answers should include:

- Summary.
- Risks identified.
- Recommended actions.
- Source references when answering from documents.
- Confidence level.

For AI Knowledge Base:

- Store document metadata.
- Extract text.
- Chunk text.
- Generate embeddings.
- Store chunks persistently.
- Search by `workspace_id` and `project_id`.
- Return citations/source chunks.

### Document Generator Rules

Document generation must be connected to projects.

Supported document types:

- Absensi.
- Evidence dokumentasi kegiatan.
- Form kebutuhan.
- Progress report.
- MoM/action item report.

Required flow:

1. Select project.
2. Select document type/template.
3. Fill structured fields.
4. Upload/import supporting data if needed.
5. Preview document.
6. Export PDF.
7. Save generated document metadata to project.

### Testing Rules

Add tests progressively.

Minimum test coverage:

- Validation schemas.
- Service logic.
- Progress computation.
- Auth helper.
- Document generator data transformation.
- AI query response parsing.

### Commit / PR Rules

For each agent task:

- Make small changes.
- State changed files.
- Explain why the change was needed.
- Mention risk and manual test steps.
- Do not silently change unrelated files.

## Definition of Done

A task is done only when:

- TypeScript has no new errors.
- Existing routes still work.
- Input is validated.
- Empty/loading/error states exist if UI changed.
- New types are exported where needed.
- README or docs are updated when behavior changes.
- No sensitive credentials are added.

