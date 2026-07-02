# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BUU GET — an exam registration, payment, and certification platform for Burapha University. Monorepo with a **NestJS** backend and a **Quasar / Vue 3** frontend, backed by **MySQL** (TypeORM). Backend integrates with Burapha's Kong API gateway (token issuance, email, MinIO file storage) and a Moodle instance.

Much of the code and documentation (CONTRIBUTING.md, inline comments) is written in **Thai**. Preserve the existing language when editing comments/docs.

## Repository layout — read this first

The two apps live under `apps/`:

- `apps/backend` — NestJS service (`buu-get-back`)
- `apps/frontend` — Quasar SPA (`buu-get-front`)

Each app is **self-contained with its own `package.json` and lockfile**. Run all app-level commands from inside the app directory, not the repo root.

> ⚠️ The repo was recently restructured from root-level `backend/`/`frontend/` into `apps/`. Several root-level files still assume the **old** layout and are stale: the root `package.json` `workspaces` (`["frontend","backend"]`), `.husky/pre-commit` (which `cd`s into `frontend`/`backend`), and `scripts/deploy-k3s.sh`. Root scripts like `npm run dev:backend` will not resolve. Prefer running commands from within `apps/*`.

## Commands

Backend (`cd apps/backend`):

```bash
npm run start:dev          # watch-mode dev server (localhost, /api prefix)
npm run build              # nest build → dist/
npm run start:prod         # node dist/main
npm run lint               # eslint --fix on {src,test}
npm run format             # prettier
npm test                   # jest (all *.spec.ts under src/)
npm test -- users.service  # run a single test file by name pattern
npm run migration:generate -- src/database/migrations/<Name>
npm run migration:run
npm run migration:revert
npm run seed:demo          # ts-node demo seed
```

Frontend (`cd apps/frontend`):

```bash
npm run dev        # quasar dev server (hot reload)
npm run build      # quasar build → dist/spa
npm run lint       # eslint on src
npm run typecheck  # vue-tsc --noEmit
```

## Backend architecture

Modular, feature-per-directory under `src/modules/` (~35 modules). Each feature follows the same shape:

```
modules/<feature>/
├── dto/           # request/response DTOs + class-validator rules
├── entities/      # TypeORM entities (DB schema)
├── <feature>.controller.ts   # thin: validate input, call service
├── <feature>.service.ts      # all business logic + repository access
└── <feature>.module.ts
```

Layer discipline is enforced by convention (see CONTRIBUTING.md §4.2): controllers stay thin, services hold all business logic and are the only layer touching repositories, entities define schema only, DTOs define shape/validation only. **No `any`** — always type explicitly.

Key cross-cutting pieces:

- **Entry**: `src/main.ts` — global `api` prefix, global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted` + `transform`, so DTOs must whitelist every accepted field). Swagger UI at `/api/docs` **in development only**.
- **Config/env**: `src/config/env.validation.ts` (Joi schema, fails fast on boot), `src/config/buu-api-config.ts` (Kong gateway endpoints via `BUU_*` env vars). Access via `ConfigService.getOrThrow(...)`.
- **Auth**: JWT via `passport-jwt`. `JwtAuthGuard` (`common/guards/jwt-auth.guard.ts`) authenticates; `RolesGuard` + `@Roles(RoleEnum.X)` authorizes; `OptionalJwtAuthGuard` for mixed public/authed routes. `@Public()` (`decorators/public.decorator.ts`) and `@RequirePermissions()` (`decorators/permissions.decorator.ts`) also exist. Guards are applied per-controller with `@UseGuards(...)`, not globally.
- **External integrations**: `platform-gateway` module wraps the BUU Kong gateway (token/email/file). `moodle` + `moodle-sync-logs` handle Moodle sync (`@nestjs/schedule` cron jobs).

## Database & migrations

- MySQL via TypeORM. `synchronize: false` — **schema changes go through migrations only** (never edit DB directly, never rely on auto-sync).
- Two TypeORM configs must stay in sync when adding an entity:
  - `src/app.module.ts` uses `autoLoadEntities: true` and runs migrations on boot (`migrationsRun: true`, from `dist/database/migrations/*.js`).
  - `src/database/data-source.ts` (CLI datasource for `migration:*`) lists entities **explicitly** — add new entities to its `entities` array or migration generation will miss them.
- Timezone handling is deliberate: connection TZ is `+07:00` (Thailand wall-clock), but `DATE`-only columns use `extra: { dateStrings: ['DATE'] }` and are typed as `string` on entities to avoid off-by-one-day shifts on UTC servers. Keep pure-date columns as `string`, not `Date`.
- Tables use `UPPER_SNAKE_CASE`. Prefer including `created_at`/`updated_at`/`deleted_at` (soft delete).

## Frontend architecture

Quasar 2 + Vue 3 Composition API (`<script setup>`) + Pinia + Axios, TypeScript throughout. Under `apps/frontend/src/`: `boot/` (Axios, auth, i18n, notify, apexcharts init), `services/` (one file per backend domain — the Axios API layer), `composables/`, `stores/` (Pinia), `pages/`, `components/` (`base/` for shared primitives), `layouts/`, `i18n/`, `types/`.

- **API base URL** is resolved by `config/resolve-api-base-url.ts`: production defaults to `/api` (and overrides known DNS-less backend hosts); dev uses the `.env` value. Set `API_BASE_URL` in `.env.local` for local dev.
- **State decision** (CONTRIBUTING.md §4.3): create a Pinia store only for state shared across multiple non-parent/child components AND persisted across routes; otherwise use a composable with local `ref`/`reactive`, or call a service directly. API-calling composables must manage `isLoading` and `error`.
- **Images**: never build storage URLs by hand. Use `ImageUpload`/`ImageDisplay` base components → `services/image.service.ts` → platform-gateway. See `IMAGE_MANAGEMENT.md`.

## Conventions & git

- Files and folders: **kebab-case**. Classes/interfaces: PascalCase. Vars/functions: camelCase.
- **Conventional Commits** are enforced by commitlint (`type(scope): subject`, no trailing period, header ≤ 100 chars). `lint-staged` runs eslint+prettier on staged files pre-commit. Run `npm run lint` before committing; do not commit lint errors.
- Full team guidelines are in `CONTRIBUTING.md` (Thai). Additional `.cursor/rules/*.mdc` encode golden paths and backend/frontend/DB safety rules that mirror the above.
