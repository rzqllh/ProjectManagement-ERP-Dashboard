# Architecture Guideline

## Target Architecture

```txt
src/
  app/
    (auth)/
    (dashboard)/
    api/
  components/
    ui/
    layout/
    dashboard/
    projects/
    nd/
    decisions/
    stakeholders/
    graph/
    documents/
    knowledge/
    ai/
  hooks/
  lib/
    auth/
    firebase/
    errors.ts
    api-response.ts
    service-result.ts
  repositories/
  services/
  types/
  schemas/
  data/
```

## Layer Responsibilities

### `app/`

Responsible for routing and page composition only.

Avoid:

- Heavy business logic.
- Large inline form logic.
- Raw Firestore access.
- Repeated fetch parsing.

### `components/`

Responsible for UI rendering and interaction.

Use feature folders:

```txt
components/projects/
components/documents/
components/knowledge/
components/ai/
```

### `hooks/`

Use for reusable client-side orchestration:

- `useProjects`.
- `useProjectDetail`.
- `useDocumentTemplates`.
- `useGeneratedDocuments`.
- `useKnowledgeSources`.
- `useAiAssistant`.

### `services/`

Business logic lives here.

Examples:

- Compute project progress.
- Generate default project sections.
- Create timeline events.
- Validate workflow transitions.
- Build AI context.
- Create document generation payload.

### `repositories/`

Persistence only.

Rules:

- No UI logic.
- No AI prompt logic.
- No business decision logic.
- Keep Firestore query details isolated here.

### `types/`

Shared domain types.

Examples:

- `Project`.
- `ProjectSection`.
- `DocumentTemplate`.
- `GeneratedDocument`.
- `KnowledgeSource`.
- `WorkspaceMember`.

### `schemas/`

Optional improvement: centralize Zod schemas here if validation files become too scattered.

## Recommended Refactors

### Refactor 1 — Auth helper

Create:

```txt
src/lib/auth/current-user.ts
src/types/auth.ts
```

Current user type:

```ts
export interface CurrentUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role: UserRole;
  workspaceId: string;
}
```

### Refactor 2 — One service result system

Keep one canonical `ServiceResult`:

```ts
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };
```

Remove duplicate error definitions outside `src/lib/errors.ts`.

### Refactor 3 — Workspace scope

Add `workspace_id` to core entities:

- Project.
- ProjectSection.
- NDRecord.
- Decision.
- Stakeholder.
- TimelineEvent.
- DocumentTemplate.
- GeneratedDocument.
- KnowledgeSource.
- AiQueryLog.

All repository methods should support workspace filtering.

### Refactor 4 — Typed API client

Create typed fetch helpers:

```txt
src/lib/api-client.ts
src/types/api.ts
```

API result:

```ts
export type ApiSuccess<T> = { success: true; data: T; meta?: Record<string, unknown> };
export type ApiFailure = { success: false; error: { code: string; message: string; details?: unknown } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
```

### Refactor 5 — Break large pages

For each large page:

```txt
app/(dashboard)/nd/page.tsx
```

Split into:

```txt
components/nd/NdPageHeader.tsx
components/nd/NdFilters.tsx
components/nd/NdTable.tsx
components/nd/NdCreateDialog.tsx
hooks/use-nd-list.ts
```

Do the same for:

- `AiBrainPanel`.
- `settings/page.tsx`.
- `login/page.tsx`.
- `graph/page.tsx`.

## Feature Module Standards

Each new module should include:

```txt
components/<feature>/
services/<feature>.service.ts
repositories/<feature>.repository.ts
types/<feature>.ts
services/<feature>.validation.ts
```

For example, document generator:

```txt
components/documents/
  DocumentGeneratorShell.tsx
  DocumentTypePicker.tsx
  AbsensiForm.tsx
  EvidenceForm.tsx
  FormKebutuhanForm.tsx
  DocumentPreview.tsx
  GeneratedDocumentList.tsx
services/document-generator.service.ts
services/document-generator.validation.ts
repositories/document-template.repository.ts
repositories/generated-document.repository.ts
types/document-generator.ts
```

## Data Integrity Rules

### Timeline events

Every important mutation should create a timeline event:

- Project created.
- Project status changed.
- Section status changed.
- ND created.
- ND escalated.
- Decision created/approved/rejected.
- Document generated.
- Knowledge source uploaded.
- AI summary generated.

### Soft delete

If using soft delete, all repository queries must consistently filter it.

### Dates

Use ISO strings consistently for stored timestamps.

### IDs

Avoid passing raw user-provided IDs to queries without auth/workspace checks.

## Firestore Considerations

Firestore is acceptable for this project, but document the tradeoffs.

Good fit:

- Flexible PMO records.
- Activity logs.
- Settings.
- Generated document metadata.

Needs care:

- Complex relational queries.
- Reporting dashboards.
- Graph dependencies.
- Vector search.

For vector search, use persistent storage instead of in-memory storage for portfolio polish.

Options:

- Firestore chunks + external embedding search service.
- Supabase pgvector.
- Pinecone/Upstash Vector.
- Postgres + pgvector if migrating data layer later.

