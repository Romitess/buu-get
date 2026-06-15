# BUU GET Front

Frontend for **BUU GET**, built with [Quasar](https://quasar.dev/), **Vue 3**, **TypeScript**, **Vite**, and **Pinia**. It talks to the backend via REST (Axios), with the base URL configured through environment variables.

## Tech stack

| Area        | Choice                          |
| ----------- | ------------------------------- |
| UI / app    | Quasar 2, Vue 3 Composition API |
| Build / dev | Vite (via `@quasar/app-vite`)   |
| State       | Pinia                           |
| HTTP        | Axios                           |
| Routing     | Vue Router                      |
| Language    | TypeScript                      |

## Requirements

- Node.js `>=22.12.0`
- npm `>=11.0.0`

## Setup

```bash
npm install
cp .env.example .env.local
```

`npm install` runs Quasar prepare and Husky (`prepare` / `postinstall` hooks) so the toolchain and Git hooks are ready after the first install.

Edit `.env.local` when the API is not on the default URL:

```bash
API_BASE_URL=http://localhost:3000
```

The Axios instance in `src/boot/axios.ts` should use this value (or the equivalent exposed by Quasar’s `env` configuration).

## Development

```bash
npm run dev
```

Runs the Quasar dev server with hot reload. Use the URL printed in the terminal (commonly `http://localhost:9000` or similar, depending on config).

## Build

```bash
npm run build
```

Produces a production build in `dist/` (exact output mode depends on Quasar / `quasar.config.ts`).

## Scripts

| Command          | Purpose                          |
| ---------------- | -------------------------------- |
| `npm run dev`    | Start Quasar dev server          |
| `npm run build`  | Production build                 |
| `npm run lint`   | ESLint on `src` TS/Vue/JS files  |
| `npm run format` | Prettier on supported file types |
| `npm run test`   | Placeholder (no tests yet)       |

## Code quality and Git hooks

This repo uses **Husky**, **lint-staged**, and **commitlint**. After `npm install`, commits trigger lint/format on staged `src` files.

Commit messages must follow **[Conventional Commits](https://www.conventionalcommits.org/)**:

```text
type(optional-scope): short description in imperative mood
```

Rules enforced here include: a non-empty **type** (e.g. `feat`, `fix`, `docs`, `chore`), subject **not** ending with a period, and **header length ≤ 100** characters.

Examples:

```bash
git commit -m "docs(readme): expand setup and project structure"
git commit -m "feat(auth): add login form"
```

For naming conventions, architecture notes, and full team guidelines (including backend), see **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

## Project structure

High-level layout under `src/`:

```text
src/
├── assets/       # Static assets (images, SVG, etc.)
├── boot/         # App bootstrapping (e.g. Axios, plugins)
├── components/   # Reusable UI (see base/ for shared primitives)
├── composables/  # Shared Composition API logic
├── css/          # Global styles / Quasar variable overrides
├── layouts/      # Shell layouts for routes
├── pages/        # Route-level views
├── router/       # Route config
├── stores/       # Pinia stores
├── types/        # Shared TypeScript types
└── utils/        # Small pure helpers
```

Quasar config and Vite-related options live in `quasar.config.ts` at the repo root.

## Troubleshooting

- **Commit rejected by commitlint** — Use `type: description` form, keep the first line short, and avoid a trailing `.` on the subject
- **Hooks not running** — Run `npm install` again so `husky` runs `prepare`, or check that `.husky/` scripts are executable in your environment

## License

See repository metadata for license information (if applicable).
