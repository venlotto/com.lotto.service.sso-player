# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `com.lotto.service.sso-internal`, a NestJS-based SSO authentication service implementing cookie-based Single Sign-On with refresh token rotation for the plus.bingo domain. The service provides JWT authentication, role-based access control (RBAC), and dynamic permission management.

## Development Commands

### Setup & Database
```bash
npm install                           # Install dependencies
npx prisma migrate dev                # Run database migrations (development)
npx prisma migrate deploy             # Deploy migrations (production)
npm run push:db                       # Alias for prisma migrate deploy
```

### Running the Application
```bash
npm run start:dev                     # Start in watch mode (development)
npm run start                         # Start normally
npm run start:prod                    # Start in production mode
npm run start:debug                   # Start with debugger attached
```

### Testing
```bash
npm test                              # Run unit tests
npm run test:watch                    # Run tests in watch mode
npm run test:cov                      # Run tests with coverage
npm run test:e2e                      # Run end-to-end tests
npm run test:debug                    # Debug tests
```

### Linting & Formatting
```bash
npm run lint                          # Lint and auto-fix with ESLint
npm run lint:strict                   # Lint with zero warnings allowed
npm run lint:fix                      # Lint and format (ESLint + Prettier)
npm run lint:unused                   # Check for unused imports/vars
npm run lint:all                      # Full lint with all rules + format
npm run lint:fix-types                # Type check + lint + format
npm run format                        # Format with Prettier only
```

### Build
```bash
npm run build                         # Build the application
```

### Utility Scripts
```bash
npm run reset:admin                   # Reset admin password (generates secure password)
npm run create:testuser               # Create a test user
```

## Architecture

### Module Structure

The application follows a strict layered architecture:

**Core Module** (`src/core/`):
- Global exception filters (`http.exception.filters.ts`)
- Transform interceptors for standardized responses (`transform.interceptor.ts`)
- Guards for roles and permissions (`roles.guard.ts`)
- Custom decorators for metadata (`custom.decorator.ts`, `roles.decorator.ts`)

**Auth Module** (`src/modules/auth/`):
- Controllers: `auth.controller.ts` (login/logout/session/refresh), role management, permission management
- Services: `auth.service.ts` (core auth logic), `role.service.ts`, `permission.service.ts`, `refresh-token.service.ts`, `bootstrap.service.ts`
- Guards: `permission.guard.ts` (permission-based access), `session-cookie.guard.ts` (cookie-only authentication)
- Strategy: `jwt.strategy.ts` (JWT validation with optional cookie support)
- Repository: `refresh-token.repository.ts` implementing repository pattern

**User Module** (`src/modules/user/`):
- Controllers for user CRUD operations, role assignment, status management
- Service: `user.service.ts` (user business logic)
- Repository: `user.repository.prisma.ts` implementing repository pattern

**Prisma Module** (`src/modules/prisma/`):
- Database access layer with Prisma ORM

### Database Schema

Five core tables in PostgreSQL:
- `users`: User accounts with username, password hash, status, last_login
- `refresh_tokens`: Token storage with rotation metadata (family_id, rotated_at, replaced_by_token_id) for theft detection
- `roles`: Role definitions
- `permissions`: Permission definitions (format: `service:resource:action`)
- `users_roles`: Many-to-many user-role assignments
- `roles_permissions`: Many-to-many role-permission assignments

### SSO Implementation (Cookie-Based Authentication)

The service implements sophisticated token rotation security:

**Key Components:**
1. **Login Flow**: Issues `plus_session` HttpOnly cookie with refresh token + JWT access token
2. **Token Rotation**: Each refresh generates new token pair, old token immediately invalidated
3. **Family Tracking**: All rotated tokens share `family_id` to detect replay attacks
4. **Session Endpoint**: `/v1/auth/session` rotates tokens using cookie (browser-friendly)
5. **Redirect Support**: OAuth-style redirect with `redirect_uri` and `state` parameters
6. **Whitelist Validation**: Only whitelisted domains accepted for redirects (prevents open redirect)

**Security Features:**
- HttpOnly cookies prevent XSS access
- SameSite=Lax provides CSRF protection
- Domain-scoped cookie (`.plus.bingo`) enables cross-subdomain SSO
- Token family revocation if previously-rotated token reused (detects theft)
- Rate limiting on login endpoint (configurable)

**Critical Files:**
- `src/modules/auth/services/auth.service.ts`: Core auth logic including rotation
- `src/modules/auth/model/refresh-token.model.ts`: Token metadata model
- `src/modules/auth/guards/session-cookie.guard.ts`: Lightweight cookie guard for SSR
- `src/main.ts`: Cookie parser, trust proxy, CORS configuration
- `src/middleware/cors.middleware.ts`: CORS handling with origin validation

See `SSO_IMPLEMENTATION_NOTES.md` for detailed implementation notes and rollout status.

### Repository Pattern

The codebase uses repository pattern for data access:
- Repository interfaces define contracts (e.g., `IUserRepository`, `IRefreshTokenRepository`)
- Prisma implementations in `*.repository.ts` or `*.repository.prisma.ts`
- Services depend on repository interfaces, not concrete implementations
- Repositories return domain models, not raw Prisma types

### Response Format

All endpoints return standardized response structure:
```typescript
{
  message: string;           // Human-readable message
  error?: string;           // Error type (only for errors)
  status_code: number;      // HTTP status code
  data?: any;              // Response payload
  meta: {
    correlation_id: string;  // Request tracking ID
    pagination?: {          // For paginated responses
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    }
  }
}
```

### Middleware & Interceptors

**Middleware:**
- `CorrelationIdMiddleware`: Generates/extracts correlation IDs for request tracking
- `CorsMiddleware`: Handles CORS with wildcard subdomain support

**Interceptors:**
- `TransformInterceptor`: Wraps all responses in standard format with correlation ID

**Guards:**
- `ThrottlerGuard`: Global rate limiting (10 req/60s default)
- `PermissionGuard`: Permission-based authorization using `@RequirePermissions()` decorator
- `RolesGuard`: Role-based authorization using `@Roles()` decorator
- `SessionCookieGuard`: Cookie-only authentication for SSR use cases

## Coding Standards

### TypeScript Guidelines

- **Type Safety**: Strict typing required. Never use `any`. Use `unknown` for truly dynamic types.
- **Explicit Return Types**: All functions must declare return types (`@typescript-eslint/explicit-function-return-type`)
- **Exports**: One item per file, export classes/functions explicitly
- **Imports**: Remove unused imports (enforced by `unused-imports` plugin)

### Naming Conventions

- **Classes**: PascalCase
- **Variables/Functions**: camelCase
- **Files/Directories**: kebab-case
- **Environment Variables**: UPPERCASE
- **Endpoints**: camelCase for multi-word endpoints (e.g., `/changePassword`, `/newUser`)
- **API Versioning**: Prefix all routes with `/v1/`

### NestJS Patterns

- **Controllers**: Lean controllers delegating to service layer. One controller per domain.
- **Services**: All business logic lives in services. Keep framework-agnostic where possible.
- **DTOs**: Use `class-validator` for input validation in DTO classes
- **Module Organization**:
  - `controller/` folder for controllers
  - `services/` folder for business logic
  - `dto/` folder for request/response types
  - `model/` folder for domain models
  - `repository/` folder for data access
  - `guards/` folder for authorization
  - `decorators/` folder for custom decorators

### Function Design

- Short, single-purpose functions (<20 instructions)
- Boolean functions: prefix with `is`, `has`, `can`
- Void functions: prefix with action verbs (`execute`, `save`, `create`)
- Use early returns to reduce nesting
- RO-RO pattern: Receive Object, Return Object for complex functions

### Error Handling

- **400 Bad Request**: Invalid input, malformed requests
- **401 Unauthorized**: Missing/invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Business rule violations (duplicate entries, invalid states)

All errors include `correlation_id` for tracing.

### Testing

- **Unit Tests**: Follow Arrange-Act-Assert pattern
- **Test Naming**: Use descriptive variable names (`inputX`, `mockX`, `actualX`, `expectedX`)
- **Coverage**: Write tests for all public functions
- **Acceptance Tests**: Use Given-When-Then convention for E2E tests
- **Test Doubles**: Mock dependencies (except lightweight third-party libs)

## Environment Variables

Critical environment variables (see `.env.dist` for full list):

**Database:**
- `DATABASE_URL`: PostgreSQL connection string

**JWT:**
- `JWT_SECRET`: Secret for signing JWTs
- `JWT_EXPIRATION`: Access token TTL (default: 15m)
- `JWT_ISSUER`: Token issuer claim (e.g., https://auth.plus.bingo)
- `JWT_AUDIENCE`: Token audience claim (e.g., plus.bingo)

**SSO & Cookies:**
- `SESSION_COOKIE_NAME`: Cookie name (default: plus_session)
- `COOKIE_DOMAIN`: Domain for cookie (e.g., .plus.bingo)
- `COOKIE_SECURE`: true for HTTPS-only
- `COOKIE_SAMESITE`: lax (CSRF protection)
- `REFRESH_TOKEN_ROTATION_ENABLED`: true (enable rotation)
- `REFRESH_TOKEN_TTL_DAYS`: Refresh token lifetime (default: 30)

**Security:**
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `REDIRECT_WHITELIST`: Comma-separated list of allowed redirect URIs
- `THROTTLE_TTL_SECONDS`: Rate limit window (default: 60)
- `THROTTLE_LIMIT`: Max requests per window (default: 10)

## Permission Format

Permissions follow a structured format: `service:resource:action`

Example: `com.lotto.service.sso-internal:user:create`

This enables fine-grained access control. Use the `@RequirePermissions()` decorator on controllers to enforce.

## Bootstrap Process

On application startup, `BootstrapService` (in auth module):
1. Creates default admin user if not exists (with auto-generated secure password)
2. Creates basic roles and permissions
3. Assigns admin role to admin user

The admin password is auto-generated on first startup and logged to the console. Use `npm run reset:admin` to regenerate a new secure password if needed.

## Common Tasks

### Adding a New Endpoint with Permission Protection

1. Define permission in bootstrap or create via API
2. Add permission to role
3. Use `@RequirePermissions()` decorator on controller method:
   ```typescript
   @RequirePermissions('com.lotto.service.sso-internal:user:create')
   @Post('newUser')
   async createUser(@Body() dto: NewUserDto) { ... }
   ```

### Creating Database Migrations

```bash
npx prisma migrate dev --name descriptive_migration_name
```

### Debugging Refresh Token Issues

Check `refresh_tokens` table for:
- `rotated_at`: When token was rotated
- `replaced_by_token_id`: Points to new token in rotation chain
- `family_id`: All rotated tokens share same family_id
- `revoked_at`: Token manually revoked (logout or family revocation)

If a rotated token is reused, entire family is revoked (see `auth.service.ts` rotation logic).

## Important Notes

- The `/v1/auth/session` endpoint is excluded from rate limiting for seamless UX
- Keep access tokens short-lived (5-15m) since they can't be revoked
- Refresh tokens are long-lived (30 days) but can be revoked
- Token rotation is mandatory in production (`REFRESH_TOKEN_ROTATION_ENABLED=true`)
- CORS middleware supports wildcard subdomains (`https://*.plus.bingo`)
- Trust proxy must be enabled for accurate IP tracking behind load balancers
