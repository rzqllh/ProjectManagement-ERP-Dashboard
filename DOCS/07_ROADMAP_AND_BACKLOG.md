# Roadmap and Backlog

## Phase 0 — Portfolio Stabilization

Goal:

Make the existing project safe, understandable, and demoable.

### Tasks

- Add complete README.
- Add project screenshots section placeholder.
- Add `.env.example` explanation.
- Add demo user/data instructions.
- Add server auth helper.
- Replace `userId = 'system'` in protected routes.
- Consolidate error and service result handling.
- Add settings validation schema.
- Add basic smoke test checklist.

### Done When

- A recruiter can understand the project in 2 minutes from README.
- A developer can run it locally from README.
- Protected API routes do not rely only on cookie presence.
- Mutations are tied to current user identity.

## Phase 1 — Core PMO Workspace

Goal:

Make the PMO tracking part feel complete.

### Tasks

- Workspace model.
- Workspace member model.
- Role-based permissions.
- Project detail page with tabs.
- Project sections/milestones polish.
- Risk/issue/ND relationship polish.
- Decision queue improvements.
- Timeline/audit log visible in project detail.
- Dashboard action recommendations.

### Done When

- User can create a project.
- User can track progress and blockers.
- User can create ND records and decisions.
- User can see timeline history.
- User can view dashboard health summary.

## Phase 2 — Document Generator

Goal:

Add operational document generation as a connected PMO workflow.

### MVP Document Type

Start with Evidence Generator first because it is visually impressive and easy to demo.

### Tasks

- Document Generator route/page.
- Document type picker.
- Evidence generator form.
- Photo upload UI.
- Watermark date/location config.
- HTML preview.
- Export PDF.
- Save generated document metadata.
- Project documents tab.

### Next Document Types

- Absensi generator.
- Form kebutuhan generator.

### Done When

- User can generate one evidence document from a project.
- PDF can be exported.
- Generated document is saved under project documents.

## Phase 3 — AI Knowledge Base

Goal:

Turn AI Brain into project-grounded knowledge assistant.

### Tasks

- Knowledge source upload.
- Project-scoped knowledge source list.
- Text extraction pipeline.
- Chunk storage.
- Embedding generation.
- Persistent vector storage.
- AI answer with source citations.
- Query log with user/workspace/project scope.

### Done When

- User can upload a project document.
- User can ask a question about that document.
- AI answer includes source references.
- AI refuses or states insufficient data when no source is found.

## Phase 4 — Portfolio Polish

Goal:

Make the project look impressive and credible for job applications.

### Tasks

- Landing page or public case study page.
- Demo mode/sample data.
- Architecture diagram.
- Feature screenshots.
- Short demo video/GIF.
- Tests for critical services.
- GitHub Actions basic lint/build.
- Deployment guide.

### Done When

- GitHub README is strong.
- Live demo works.
- Portfolio page explains problem, solution, stack, features, and architecture.
- Project can be presented in interview.

## Backlog Priority Matrix

### Must Have

- Auth hardening.
- README.
- Workspace scope.
- Document generator MVP.
- AI citations.
- Demo data.

### Should Have

- Tests.
- PDF export polish.
- File storage provider.
- Role management UI.
- Better table filters.
- Responsive mobile fallback.

### Could Have

- Telegram notifications for escalation.
- Advanced AI agent tools.
- Template builder UI.
- Admin analytics.
- Notification center.
- Email report digest.

### Won't Have Yet

- Full ERP finance/accounting.
- HR/payroll.
- Complex procurement.
- Multi-company enterprise billing.
- Overly advanced workflow builder.

