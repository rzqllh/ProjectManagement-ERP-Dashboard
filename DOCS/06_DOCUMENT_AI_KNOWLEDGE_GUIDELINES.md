# Document Generator and AI Knowledge Base Guideline

## Strategic Goal

The project should not have separate random tools. Document generation and AI knowledge must connect to PMO project workflows.

Core concept:

```txt
Project
  -> tracking data
  -> ND/blockers/decisions
  -> generated documents
  -> uploaded knowledge sources
  -> AI summaries and recommendations
```

## Document Generator Module

### Supported Document Types

Start with three:

1. Absensi.
2. Evidence dokumentasi kegiatan.
3. Form kebutuhan.

Then expand to:

4. Progress report.
5. MoM/action item summary.
6. Risk/issue report.

## Data Model

### DocumentTemplate

```ts
export interface DocumentTemplate extends BaseEntity {
  workspace_id: string;
  name: string;
  type: DocumentType;
  version: number;
  description?: string;
  schema: Record<string, unknown>;
  layout_config: Record<string, unknown>;
  is_active: boolean;
  created_by: string;
}
```

### GeneratedDocument

```ts
export interface GeneratedDocument extends BaseEntity {
  workspace_id: string;
  project_id: string;
  template_id: string;
  type: DocumentType;
  title: string;
  payload: Record<string, unknown>;
  file_url?: string;
  preview_html?: string;
  generated_by: string;
  generated_at: string;
  status: 'draft' | 'generated' | 'archived';
}
```

### DocumentAsset

```ts
export interface DocumentAsset extends BaseEntity {
  workspace_id: string;
  project_id: string;
  generated_document_id?: string;
  file_name: string;
  file_type: string;
  file_url: string;
  size_bytes: number;
  uploaded_by: string;
}
```

## Absensi Generator

Required fields:

- Project.
- Activity name.
- Date.
- Location.
- Organization/unit.
- Participant list.
- Role/position.
- Signature placeholder.

Output:

- Preview table.
- Export PDF.
- Save as generated document.

## Evidence Generator

Required fields:

- Project.
- Activity name.
- Date.
- Location.
- Description.
- Photo uploads.
- Caption per photo.
- Watermark date/location.

Output:

- Grid layout preview.
- One or multiple pages.
- Export PDF.
- Save to project documents.

## Form Kebutuhan Generator

Required fields:

- Project.
- Request title.
- Requester.
- Need description.
- Scope.
- Priority.
- Target date.
- Required resources/items.
- Approval/signature fields.

Output:

- Structured form preview.
- Export PDF.
- Save to project documents.

## Preview Rendering Strategy

Recommended MVP:

- Render preview as HTML/CSS in app.
- Export using browser print or server-side PDF generation later.

More polished option:

- Use Puppeteer/Playwright server-side for consistent PDF.
- Or use React PDF if layout is document-like and not too CSS-heavy.

## Template Versioning

Do not overwrite old templates directly.

When template structure changes:

- Create new version.
- Keep old generated documents tied to old version.
- Mark latest template as active.

This makes the project feel enterprise-ready.

# AI Knowledge Base Module

## Required Pipeline

```txt
Upload document
  -> validate file
  -> store file
  -> extract text
  -> chunk text
  -> create embeddings
  -> store chunks
  -> semantic search
  -> AI answer with citations
```

## Data Model

### KnowledgeSource

```ts
export interface KnowledgeSource extends BaseEntity {
  workspace_id: string;
  project_id?: string;
  title: string;
  file_name: string;
  file_type: string;
  file_url?: string;
  source_type: 'upload' | 'generated_document' | 'manual_note';
  status: 'processing' | 'ready' | 'failed';
  uploaded_by: string;
}
```

### KnowledgeChunk

```ts
export interface KnowledgeChunk extends BaseEntity {
  workspace_id: string;
  project_id?: string;
  source_id: string;
  chunk_index: number;
  content: string;
  embedding_ref?: string;
  metadata: {
    page?: number;
    section?: string;
    heading?: string;
  };
}
```

## AI Answer Contract

Use structured output:

```ts
export interface AiAnswer {
  summary: string;
  risks_identified: string[];
  recommended_actions: string[];
  sources: Array<{
    source_id: string;
    title: string;
    excerpt: string;
    page?: number;
  }>;
  confidence_level: number;
}
```

## PMO Quick Prompts

Add these as UI shortcuts:

- Summarize this project status.
- What are the current blockers?
- What risks need escalation?
- Generate weekly PMO summary.
- Extract action items from latest MoM.
- Which decisions are overdue?
- Compare latest progress with previous report.
- Create next-step recommendation for PMO.

## AI Safety Rules

- If no source data is found, AI must say it does not have enough project data.
- If answering from uploaded documents, include source references.
- Do not claim generated recommendations are official decisions.
- Do not use AI as the source of truth for raw status; use database records.
- Log AI queries for auditability.

## MVP Recommendation

Build in this order:

1. Generated document metadata.
2. Evidence generator.
3. File upload for knowledge source.
4. Text extraction for plain text/PDF.
5. Simple search.
6. AI summary with citations.
7. Persistent vector storage.

