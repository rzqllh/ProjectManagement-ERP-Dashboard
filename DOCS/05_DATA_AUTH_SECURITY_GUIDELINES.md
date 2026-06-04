# Data, Auth, and Security Guideline

## Current Concern

The current project uses Firebase Auth on the client and a `session` cookie, but many API routes still use `userId = 'system'` and middleware checks cookie presence rather than fully enforcing verified server identity.

For portfolio readiness, server-side auth must be made explicit and reliable.

## Required Auth Flow

### Client

- User signs in with Firebase Auth.
- Client obtains Firebase ID token.
- Token is stored in secure cookie or passed via authorization header.

### Server

- API route reads token.
- Firebase Admin verifies token.
- Server resolves workspace membership and role.
- API handler passes `currentUser` to service.

## Recommended Types

```ts
export type UserRole = 'owner' | 'admin' | 'pmo' | 'manager' | 'member' | 'viewer';

export interface CurrentUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role: UserRole;
  workspaceId: string;
}
```

## Required Helpers

Create:

```txt
src/lib/auth/current-user.ts
src/lib/auth/permissions.ts
src/types/auth.ts
```

### `requireCurrentUser`

Responsibilities:

- Read token from cookie/header.
- Verify token with Firebase Admin.
- Fetch workspace member record.
- Return `CurrentUser`.
- Throw `UnauthorizedError` if token invalid.
- Throw `ForbiddenError` if no workspace membership.

### `requirePermission`

Example:

```ts
requirePermission(currentUser, 'project:update');
```

## Permission Matrix

```txt
owner   -> all permissions
admin   -> manage users, settings, projects, docs, AI
pmo     -> manage projects, ND, decisions, documents, reports, AI
manager -> manage assigned projects and decisions
member  -> update assigned work/items only
viewer  -> read-only
```

## Workspace Scope

All data queries must be scoped by `workspace_id`.

Bad:

```ts
projectRepo.findAll()
```

Better:

```ts
projectRepo.findAllByWorkspace(currentUser.workspaceId)
```

Bad:

```ts
projectRepo.findById(id)
```

Better:

```ts
projectRepo.findByIdForWorkspace(id, currentUser.workspaceId)
```

## Audit Fields

Every core entity should include:

```ts
created_by: string;
updated_by?: string;
workspace_id: string;
```

Timeline event should include:

```ts
actor_id: string;
actor_type: 'user' | 'system';
workspace_id: string;
```

## API Security Checklist

For every API route:

- Is it public or protected?
- If protected, does it verify Firebase ID token server-side?
- Does it check workspace scope?
- Does it check role/permission?
- Does it validate request body with Zod?
- Does it avoid leaking internal errors?
- Does it avoid returning deleted records?
- Does it avoid cross-workspace access?

## Settings Security

Settings endpoints should be admin-only.

Rules:

- `GET /api/settings` requires authenticated user.
- `PATCH /api/settings` requires admin/owner.
- Body must be validated with `updateSettingsSchema`.
- Sensitive settings must not be returned to clients unless safe.

## AI Security

AI queries must be scoped.

Rules:

- AI cannot search across workspaces.
- AI cannot answer from documents the user cannot access.
- AI query logs must store user/workspace/project scope.
- Prompts should not include secrets or credentials.
- Uploaded documents should be checked for size/type.

## File Upload Security

For document generator and knowledge base:

- Validate MIME type.
- Validate file size.
- Store files in workspace/project folders.
- Never trust filename.
- Sanitize extracted text before prompt usage.
- Store generated documents with metadata.

## Environment Variable Rules

`.env.example` should document every required variable.

Do not commit `.env.local`.

Sensitive values:

- Firebase private key.
- Gemini API key.
- Telegram bot token.
- Storage credentials.

## Portfolio Note

In README, explicitly mention:

> Server-side Firebase token verification and workspace-scoped authorization are part of the production-hardening roadmap or implemented security layer.

If not implemented yet, be honest and label it as pending.

