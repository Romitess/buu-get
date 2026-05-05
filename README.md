# BUU GET Front

Frontend application for BUU GET, built with Quasar Framework, Vue 3, TypeScript, and Pinia.

## Requirements

- Node.js `>=22.12.0`
- npm `>=11.0.0`

## Setup

```bash
npm install
cp .env.example .env.local
```

Update `.env.local` when the backend API URL is different from the default:

```bash
API_BASE_URL=http://localhost:3000
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Code Quality

```bash
npm run lint
npm run format
```

This project uses Husky, lint-staged, and commitlint. After `npm install`, Git hooks are prepared automatically.

Commit messages must follow Conventional Commits, for example:

```bash
git commit -m "feat(frontend): initialize quasar app"
```

## Project Structure

- `src/boot` - client-side initialization such as Axios
- `src/components` - reusable UI components
- `src/composables` - shared Composition API logic
- `src/layouts` - page layout templates
- `src/pages` - route pages
- `src/router` - route definitions
- `src/stores` - Pinia stores for shared or persisted state
- `src/types` - TypeScript interfaces and types
- `src/utils` - helper functions
