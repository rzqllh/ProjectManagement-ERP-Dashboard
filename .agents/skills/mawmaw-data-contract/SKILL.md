---
name: mawmaw-data-contract
description: Project-specific database and schema rules for Mawmaw project (Prisma).
---

# Mawmaw Data Contract

- Prisma `db.project` is the single source of truth for both the Admin CMS and the public live site.
- Do NOT modify the Prisma schema, server actions, or authentication flows without explicit user approval.
- Before redesigning or touching the CMS, always inspect the existing CRUD actions, database schema, and how data maps to the public cards and detail pages.
- Do NOT invent or implement a draft/publish/revision workflow if the corresponding fields do not exist in the schema yet. 
