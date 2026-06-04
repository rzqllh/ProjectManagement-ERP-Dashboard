# Product Positioning Guideline

## Final Product Direction

This project should be positioned as a serious fullstack SaaS-style platform:

> AI-powered PMO Workspace for project tracking, document automation, decision governance, dependency graphing, stakeholder management, and project knowledge retrieval.

Avoid positioning it as only:

- ERP dashboard.
- Admin panel.
- AI chatbot.
- Firebase CRUD app.
- Internal tracker.

The strongest story is that the product digitizes real PMO workflows end-to-end.

## Core Product Pillars

### 1. Project Control Center

Purpose:

- Track projects.
- Track sections/milestones.
- See project health.
- Detect blockers.
- Monitor escalation.

Portfolio value:

- CRUD.
- Dashboard analytics.
- Status computation.
- Timeline/audit log.
- Business logic.

### 2. Operational Document Automation

Purpose:

- Generate reusable PMO documents from project data.
- Reduce manual formatting work.
- Attach generated files to the right project.

Target document types:

- Absensi.
- Evidence/dokumentasi kegiatan.
- Form kebutuhan.
- Progress report.
- MoM/action item report.

Portfolio value:

- Complex form UX.
- Preview rendering.
- PDF generation.
- File upload.
- Template versioning.
- Data import/export.

### 3. AI Project Knowledge Base

Purpose:

- Let users ask questions about uploaded project documents.
- Summarize progress, decisions, risks, blockers, and action items.
- Provide source-grounded answers.

Portfolio value:

- AI integration.
- RAG pipeline.
- Embeddings.
- Document ingestion.
- Citation/source mapping.
- Secure scoped retrieval.

### 4. Decision & Stakeholder Governance

Purpose:

- Track decisions.
- Track PICs/stakeholders.
- Measure decision velocity.
- Keep project history explainable.

Portfolio value:

- Relational thinking even with Firestore.
- Domain modeling.
- Auditability.
- Workflow design.

### 5. Dependency & Blocker Graph

Purpose:

- Show how ND records, projects, decisions, and blockers relate.
- Identify upstream/downstream impact.

Portfolio value:

- Graph UI.
- Data visualization.
- Non-trivial interactions.
- Advanced frontend engineering.

## Recommended Navigation Structure

```txt
Dashboard
Projects
  - Overview
  - Sections / Milestones
  - Tasks / Work Items
  - Risks & Issues
  - Decisions
  - Documents
  - Knowledge Base
ND Records
Decisions
Stakeholders
Graph
Document Generator
AI Assistant
Settings
```

## Recommended Portfolio Case Study Structure

Use this structure on GitHub README and portfolio page:

```md
# CANERIS PMO / ProjectPilot

## Problem
PMO teams often track progress, risks, evidence, and documents across separate spreadsheets, chats, and manual reports.

## Solution
An AI-powered PMO workspace that combines project tracking, decision governance, document generation, dependency mapping, and document-grounded AI assistance.

## My Role
Fullstack developer responsible for product architecture, frontend implementation, backend API, data modeling, AI workflow, and deployment.

## Tech Stack
Next.js, TypeScript, Firebase Auth, Firestore, Firebase Admin, Tailwind CSS, shadcn/ui, Gemini/LangChain, Telegram Bot integration.

## Core Features
- Authenticated workspace dashboard.
- Project and ND record tracking.
- Decision and stakeholder management.
- Dependency graph and blocker tracing.
- AI assistant for PMO insights.
- Planned document generator for absensi, evidence, and form kebutuhan.

## Architecture Highlights
- App Router route handlers.
- Service/repository layer.
- Zod validation.
- Firestore-backed data access.
- Timeline/audit event logging.
- AI service layer with tool-based query handling.

## Demo Flow
1. Login.
2. Open dashboard.
3. Create project.
4. Add/update project section.
5. Add ND/blocker.
6. Connect dependencies in graph.
7. Ask AI Assistant for status/risk summary.
8. Generate document/report.
```

## Branding Recommendation

Keep `CANERIS` if you want it tied to your assistant ecosystem.

Use a more recruiter-readable product subtitle:

> CANERIS PMO — AI-powered project operations workspace.

Avoid only saying `CANERIS ERP`, because ERP is broad and can create expectations for finance, procurement, inventory, HR, etc.

Better variants:

- CANERIS PMO.
- CANERIS ProjectOps.
- ProjectPilot.
- OpsPilot PMO.

## MVP Definition for Portfolio

A portfolio-ready MVP does not need every planned feature, but it must feel complete.

Minimum demo-ready scope:

- Auth.
- Project CRUD.
- ND/issue/blocker tracking.
- Decisions.
- Stakeholders.
- Dashboard metrics.
- Dependency graph.
- AI Assistant status query.
- One working document generator.
- README + screenshots + demo account instructions.

