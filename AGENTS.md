# Repository Guidelines

## Project Structure & Module Organization
NestJS code lives in `src/` with feature modules under `src/modules/<feature>/` (controllers, services, dto, guards, repository). Cross-cutting utilities sit in `src/core/`, `src/common/`, `src/middleware/`, `src/pipes/`, `src/utils/`, and scripts in `src/scripts/`. Prisma schema and migrations are in `prisma/`. Docs, including API examples, are stored in `docs/` (e.g., `docs/postman/collection.json`). Keep test specs alongside implementation in `src/**/*.spec.ts`.

## Build, Test, and Development Commands
Install dependencies with `npm install`. Start the API locally via `npm run start:dev`; production builds use `npm run start:prod`. Compile TypeScript with `npm run build`. Run the full lint+format suite using `npm run lint:all`, or apply quick fixes with `npm run lint:fix`. Execute unit tests through `npm test`; enable watch mode with `npm run test:watch`; gather coverage via `npm run test:cov`. Apply Prisma migrations locally with `npx prisma migrate dev` and deploy schema changes using `npm run push:db`.

## Coding Style & Naming Conventions
All code is TypeScript (ES2020+). Follow Prettier formatting and ESLint rules—no implicit `any`, explicit return types, ordered imports. File names use kebab-case; DTOs end in `.dto.ts`, services in `.service.ts`, controllers in `.controller.ts`. Classes and enums use PascalCase; functions, variables, and properties use camelCase.

## Testing Guidelines
Jest drives testing. Co-locate specs as `*.spec.ts` under `src/`, mirroring module structure. Aim to cover controllers, services, and guards, capturing happy paths and edge cases. Before opening a PR, run `npm run test:cov` and ensure coverage does not regress.

## Commit & Pull Request Guidelines
Commits should be single-purpose with short, imperative summaries (e.g., `fix permissions`). Pull requests must describe the change, link issues, and provide how-to-test steps; include API payload examples when endpoints shift. Update `docs/postman/collection.json` after modifying routes. Verify `npm run lint:all`, `npm test`, and pending migrations locally before requesting review.

## Security & Configuration Tips
Duplicate `.env.dist` to `.env` and populate secrets; never commit `.env`. Required env vars include `DATABASE_URL`, `JWT_SECRET`, `ACCESS_TOKEN_EXPIRES`, `REFRESH_TOKEN_EXPIRES`, and `APP_PORT`. After editing `schema.prisma`, regenerate and validate Prisma migrations before merging.
