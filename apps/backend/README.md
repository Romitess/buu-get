# BUU GET Backend

REST API for **BUU GET**, built with **NestJS 11**, **TypeORM**, and **MySQL**. It exposes JSON endpoints under a global `/api` prefix, validates configuration with **Joi**, and documents the HTTP surface with **Swagger** in development.

## Tech stack

| Area        | Choice                                      |
| ----------- | ------------------------------------------- |
| Runtime     | Node.js                                     |
| Framework   | NestJS (Express platform)                   |
| Database    | MySQL (via `mysql2`)                        |
| ORM         | TypeORM (`synchronize: false`, migrations) |
| Validation  | `class-validator` / `class-transformer`     |
| Config      | `@nestjs/config` + Joi (`src/config/env.validation.ts`) |
| API docs    | Swagger (`@nestjs/swagger`), dev only        |

## Requirements

- **Node.js** 22 or newer  
- **npm** 11 or newer  
- **MySQL** 8 or newer (local or remote instance)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

   This runs the `prepare` script so **Husky** Git hooks are installed.

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` for your machine. All variables are validated at startup (see table below).

   Create an empty database that matches `DATABASE_NAME` before running migrations.

3. **Apply database schema**

   ```bash
   npm run migration:run
   ```

4. **Start the API**

   ```bash
   npm run start:dev
   ```

   The server listens on the port from `PORT` (default **3000**).

### Environment variables

| Variable            | Description                                      |
| ------------------- | ------------------------------------------------ |
| `NODE_ENV`          | `development`, `test`, or `production` (default `development`) |
| `PORT`              | HTTP port (default `3000`)                       |
| `DATABASE_HOST`     | MySQL host                                       |
| `DATABASE_PORT`     | MySQL port (default `3306`)                      |
| `DATABASE_USER`     | MySQL user                                       |
| `DATABASE_PASSWORD` | MySQL password (may be empty string)             |
| `DATABASE_NAME`     | MySQL database name                              |
| `JWT_SECRET`        | Secret for signing JWTs — **minimum 16 characters** |
| `GRAYLOG_HOST`      | Optional. Existing Graylog host. Empty/unset disables shipping |
| `GRAYLOG_PORT`      | GELF port (default `12201`) — must match the Graylog Input |
| `GRAYLOG_FACILITY`  | GELF facility / app tag (default `buu-get`)      |
| `GRAYLOG_PROTOCOL`  | `tcp` (default), `udp`, or `http` — **must match** Input (GELF TCP + null delimiter, UDP, or HTTP) |

> **Note:** `JWT_SECRET` in `.env.example` is a placeholder. Use a long random value in real deployments; short values are rejected by config validation.
>
> **Graylog:** When enabled, the backend ships Nest server logs, HTTP access, and sanitized audit events (manual `grayLog` fields + `_facility`). MySQL `SYS_T_AUDIT_LOGS` remains the in-app audit source. Default protocol is **TCP** (null-delimited GELF), matching the university Graylog input used by other BUU apps. If messages never appear, confirm System → Inputs is **GELF TCP** with **Null frame delimiter**, then search for `facility:buuget` or `"Graylog sink ready"`. Use `GRAYLOG_DEBUG=true` or `GRAYLOG_PROTOCOL=http` when diagnosing connect failures.

## API and documentation

- **Global prefix:** `/api` (see `src/main.ts`).  
- **Example:** `GET http://localhost:3000/api/...`  
- **Swagger UI:** only when `NODE_ENV=development`, at **`/api/docs`**.  
- **Validation:** global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform` enabled.

## Database management

Schema changes are done **only through TypeORM migrations**. `synchronize` is **off** in both the CLI data source and the Nest `TypeOrmModule` configuration — do not alter production schema by hand in a SQL client.

| Task | Command |
| ---- | ------- |
| Generate a migration from entity changes | `npm run migration:generate -- src/database/migrations/DescribeYourChange` |
| Run pending migrations | `npm run migration:run` |
| Revert the last migration | `npm run migration:revert` |

- **CLI config:** `src/database/data-source.ts` (used by `npm run typeorm` / migration scripts).  
- **Perf indexes (reconcile + Moodle pending):** migration `1789780343260-AddPerfIndexesForReconcileAndMoodle` creates `IDX_TSR_REF12`, `IDX_BR_REF12`, and `IDX_ERM_MOODLE_PENDING`. Apply with `npm run migration:run` on every environment before relying on bank verify / Moodle enrol worker performance. Prefer a low-traffic window on large tables. Verify with `SHOW INDEX FROM FIN_T_TRANSACTIONS_REFS` / `FIN_T_BANK_RECONCILES` / `EXAM_T_ENROLLMENTS`.  
- **Runtime migrations** in the compiled app are loaded from `dist/database/migrations/*.js` (`app.module.ts`).  
- After adding a new entity, register it in `data-source.ts` **`entities`** if the migration CLI must see it.

## Project structure

```text
src/
├── config/           # Environment validation (Joi)
├── database/
│   ├── data-source.ts    # TypeORM DataSource for CLI migrations
│   └── migrations/       # Versioned migration files
├── modules/            # Feature modules (e.g. auth, users)
│   ├── auth/
│   └── users/
├── app.module.ts
└── main.ts
```

Naming conventions, broader architecture notes, and cross-repo guidelines live in **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

## Quality checks

Run these locally before opening a PR or pushing:

```bash
npm run lint      # ESLint on src/ and test/
npm run format    # Prettier (src and test TypeScript)
npm run build     # Nest compile to dist/
npm run test      # Jest unit tests
npm run test:cov  # Jest with coverage (optional)
```

**Git hooks:** **lint-staged** runs ESLint + Prettier on staged `src/**/*.ts` before commit. **commitlint** enforces **Conventional Commits** on the commit message header (type, short subject, header length ≤ 100 characters, no trailing period on the subject).

Examples:

```bash
git commit -m "docs(readme): add backend setup and database section"
git commit -m "feat(auth): add login endpoint"
```

## Scripts reference

| Script | Purpose |
| ------ | ------- |
| `start` | Start once (no watch) |
| `start:dev` | Dev server with watch |
| `start:debug` | Dev with debugger |
| `start:prod` | Run `node dist/main` after build |
| `build` | Compile TypeScript |
| `lint` | ESLint with `--fix` |
| `format` | Prettier write |
| `test` / `test:watch` / `test:cov` | Jest |

## License

See `package.json` (`license` field) for this package’s license.
