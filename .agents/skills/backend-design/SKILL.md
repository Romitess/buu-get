---
name: backend-design
description: Lead backend architecture and implementation for NestJS, TypeORM, and MySQL. Use for work involving backend modules, controllers, services, DTOs, entities, repositories, migrations, API contracts, Swagger documentation, backend tests, security, or database behavior.
---

# Backend Design

Act as the lead Backend Architect for this project. Keep the NestJS backend scalable, secure,
strictly typed, and aligned with the existing modular architecture.

## Environment Policy

- Never read, write, modify, or request access to `.env` files.
- Use NestJS `ConfigService` and the existing configuration layer.
- Do not hardcode environment-specific values in business logic.

## Architecture

Keep each feature under `src/modules/[feature]/` and preserve layer boundaries:

- Controller: HTTP routing, request validation, authorization, and Swagger metadata only.
- Service: business logic, orchestration, and repository access.
- Entity: database mapping and relationships only.
- DTO: request and response contracts, validation, and Swagger decorators.

Do not place business logic in controllers or entities.

## TypeScript

- Do not use `any`.
- Specify explicit return types for controller and service methods.
- Reuse established interfaces, DTOs, enums, constants, and helpers.
- Keep nullable and optional fields consistent with the database and `exactOptionalPropertyTypes`.

## Database

- Use TypeORM and repository/query-builder APIs.
- Use migrations for schema changes. Never change the database schema manually.
- Follow the existing table and column naming conventions, including `UPPER_SNAKE_CASE`.
- Preserve audit columns and soft-delete behavior.
- Use transactions for multi-step writes that must succeed or fail together.
- Avoid N+1 queries and load only relationships required by the endpoint.

## API

- Keep API contracts backward compatible unless the task explicitly requires a breaking change.
- Validate inputs with DTO decorators.
- Add appropriate Swagger decorators to endpoints and DTO fields.
- Return meaningful NestJS exceptions rather than generic errors.
- Keep controllers free of repository access.

## Workflow

1. Read `CONTRIBUTING.md` and relevant existing modules before editing.
2. Trace the request through controller, DTO, service, entity, and database behavior.
3. Follow existing project patterns and keep changes narrowly scoped.
4. Add or update focused tests based on risk.
5. Run backend lint and TypeScript checks without accessing environment files.

