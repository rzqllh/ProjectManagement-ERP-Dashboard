# Implementation Checklist

## Before Coding

- [ ] Read `02_AGENTS.md`.
- [ ] Confirm target phase.
- [ ] Confirm exact files to modify.
- [ ] Avoid broad rewrites.
- [ ] Avoid deleting current features.

## P0 Checklist

- [ ] Add README.
- [ ] Add server auth helper.
- [ ] Replace `userId = 'system'` in project routes.
- [ ] Replace `userId = 'system'` in ND routes.
- [ ] Replace `userId = 'system'` in decision routes.
- [ ] Replace `userId = 'system'` in stakeholder routes.
- [ ] Consolidate `ServiceResult` and error classes.
- [ ] Add `updateSettingsSchema`.
- [ ] Add manual test checklist.

## P1 Checklist

- [ ] Add workspace types.
- [ ] Add workspace member types.
- [ ] Add role/permission utilities.
- [ ] Add workspace scope to project queries.
- [ ] Add workspace scope to ND queries.
- [ ] Add workspace scope to decisions/stakeholders.
- [ ] Add project documents tab placeholder.

## Document Generator Checklist

- [ ] Add document generator types.
- [ ] Add generated document repository.
- [ ] Add generated document service.
- [ ] Add evidence generator validation schema.
- [ ] Add evidence generator UI.
- [ ] Add HTML preview.
- [ ] Add export/print flow.
- [ ] Save generated document metadata.
- [ ] Show generated documents in project detail.

## AI Knowledge Base Checklist

- [ ] Add knowledge source type.
- [ ] Add knowledge chunk type.
- [ ] Add upload UI.
- [ ] Add text extraction pipeline.
- [ ] Add chunking.
- [ ] Add embeddings.
- [ ] Add persistent storage.
- [ ] Add citation answer format.
- [ ] Add insufficient-data handling.

## Portfolio Checklist

- [ ] README has problem/solution/stack/features.
- [ ] README labels unfinished features honestly.
- [ ] Live demo works.
- [ ] Screenshots are added.
- [ ] Demo data exists.
- [ ] GitHub repo is clean.
- [ ] `.env.local` is not committed.
- [ ] Build passes.
- [ ] Lint passes.

