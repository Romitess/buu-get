# Codex Project Instructions

These instructions apply to all work inside this repository.

## Required Reading

Before analyzing, editing, reviewing, or testing code:

1. Read `CONTRIBUTING.md` completely.
2. Determine whether the task is frontend, backend, or full-stack.
3. Read the required Skill files completely before starting implementation.

Do this automatically. The user does not need to mention a Skill.

## Frontend Tasks

For work involving `frontend/`, Vue, Quasar, Pinia, browser UI, frontend services, or frontend
tests, read:

```text
.agents/skills/frontend-design/SKILL.md
```

Apply this Skill only to frontend code and behavior.

## Backend Tasks

For work involving `backend/`, NestJS, TypeORM, MySQL, controllers, services, DTOs, entities,
repositories, migrations, APIs, Swagger, or backend tests, read:

```text
.agents/skills/backend-design/SKILL.md
```

Apply this Skill only to backend code and behavior.

## Full-Stack Tasks

For tasks involving both `frontend/` and `backend/`, read and apply both Skill files within their
respective code boundaries.

## General Rules

- Follow `CONTRIBUTING.md` as the single source of truth for project structure, coding standards,
  naming, testing, linting, database practices, and Git workflow.
- Never read, write, modify, or request access to `.env` files.
- Inspect existing code and follow established project patterns before introducing new patterns.
- Keep changes scoped to the request and preserve unrelated user changes.
- Validate affected code with the repository's existing lint, type-check, and test commands.
