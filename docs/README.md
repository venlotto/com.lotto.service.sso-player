# Auth Service API Documentation

This document provides comprehensive documentation for the Auth Service API endpoints.

## Base URL

All API endpoints are prefixed with: `{{baseUrl}}/v1`

## Response Format

All API responses follow this standardized format:

```typescript
{
  message: string;          // Human-readable message
  error?: string;          // Error type (only present for errors)
  status_code: number;     // HTTP status code
  data?: any;             // Response payload (optional)
  meta: {
    correlation_id: string;  // Request correlation ID
    // Additional metadata depending on the endpoint
    pagination?: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
    // ... other metadata
  }
}
```

### Success Response Example
```json
{
  "message": "User profile retrieved",
  "status_code": 200,
  "data": {
    "id": "123",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "meta": {
    "correlation_id": "abc-123-def"
  }
}
```

### Error Response Example
```json
{
  "message": "User not found",
  "error": "NotFoundError",
  "status_code": 404,
  "meta": {
    "correlation_id": "abc-123-def"
  }
}
```

### Paginated Response Example
```json
{
  "message": "Users retrieved successfully",
  "status_code": 200,
  "data": [
    {
      "id": "123",
      "username": "user1"
    },
    {
      "id": "124",
      "username": "user2"
    }
  ],
  "meta": {
    "correlation_id": "abc-123-def",
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50,
      "items_per_page": 10
    }
  }
}
```

## Authentication

Most endpoints require authentication using a Bearer token. Include the token in the Authorization header:

```
Authorization: Bearer {{accessToken}}
```

A correlation ID can be included for request tracking (optional):

```
X-Correlation-Id: {{$guid}}
```

## Common Status Codes
- 200: OK - Request successful
- 201: Created - Resource created successfully
- 400: Bad Request - Invalid input
- 401: Unauthorized - Missing or invalid authentication
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource doesn't exist
- 409: Conflict - Business rule violation
- 500: Internal Server Error - Unexpected server error

## SSO Architecture

### Overview

The authentication service implements a cookie-based Single Sign-On (SSO) system with refresh token rotation for enhanced security. The system supports both traditional API token responses and modern cookie-based session management.

### Key Features

- **HttpOnly Cookies**: Session tokens stored in secure, HttpOnly cookies to prevent XSS attacks
- **Token Rotation**: Automatic refresh token rotation on each use to detect token theft
- **Family Tracking**: Token families enable detection of concurrent usage and replay attacks
- **Redirect Support**: OAuth-style redirect flow with state parameter for cross-domain SSO
- **Rate Limiting**: Configurable throttling on login and token endpoints

### Authentication Flows

#### 1. Cookie-Based SSO Flow

```
┌──────────┐                 ┌─────────────┐                ┌──────────────┐
│  Client  │                 │ Auth Service│                │   Database   │
└────┬─────┘                 └──────┬──────┘                └──────┬───────┘
     │                              │                               │
     │  POST /v1/auth/login         │                               │
     │  {username, password}        │                               │
     ├─────────────────────────────>│                               │
     │                              │                               │
     │                              │  Validate credentials         │
     │                              ├──────────────────────────────>│
     │                              │                               │
     │                              │  Generate token family        │
     │                              │  Create refresh token         │
     │                              │<──────────────────────────────┤
     │                              │                               │
     │  Set-Cookie: plus_session    │                               │
     │  {access_token, refresh_     │                               │
     │   token, session_family_id}  │                               │
     │<─────────────────────────────┤                               │
     │                              │                               │
```

#### 2. Token Rotation Flow

```
┌──────────┐                 ┌─────────────┐                ┌──────────────┐
│  Client  │                 │ Auth Service│                │   Database   │
└────┬─────┘                 └──────┬──────┘                └──────┬───────┘
     │                              │                               │
     │  POST /v1/auth/session       │                               │
     │  Cookie: plus_session=...    │                               │
     ├─────────────────────────────>│                               │
     │                              │                               │
     │                              │  Validate refresh token       │
     │                              ├──────────────────────────────>│
     │                              │                               │
     │                              │  Mark token as rotated        │
     │                              │  Generate new token (same     │
     │                              │  family_id)                   │
     │                              │  Delete old token             │
     │                              │<──────────────────────────────┤
     │                              │                               │
     │  Set-Cookie: plus_session    │                               │
     │  {new_access_token,          │                               │
     │   new_refresh_token}         │                               │
     │<─────────────────────────────┤                               │
     │                              │                               │
```

#### 3. Redirect Flow (Cross-Domain SSO)

```
┌──────────┐            ┌─────────────┐            ┌──────────────┐
│  App A   │            │ Auth Service│            │   App B      │
│(Frontend)│            │  (Backend)  │            │              │
└────┬─────┘            └──────┬──────┘            └──────┬───────┘
     │                         │                          │
     │  Redirect to login      │                          │
     │  ?redirect_uri=...      │                          │
     │  &state=...             │                          │
     ├────────────────────────>│                          │
     │                         │                          │
     │  Show login form        │                          │
     │<────────────────────────┤                          │
     │                         │                          │
     │  POST /v1/auth/login    │                          │
     │  {username, password,   │                          │
     │   redirect_uri, state}  │                          │
     ├────────────────────────>│                          │
     │                         │                          │
     │                         │  Validate redirect_uri   │
     │                         │  against whitelist       │
     │                         │                          │
     │  200 OK (JSON)          │                          │
     │  {redirect_uri,         │                          │
     │   session_family_id}    │                          │
     │  Set-Cookie:            │                          │
     │  plus_session=...       │                          │
     │<────────────────────────┤                          │
     │                         │                          │
     │  Frontend redirect      │                          │
     │  window.location.href   │                          │
     ├──────────────────────────────────────────────────>│
     │                         │                          │
     │                         │      Authenticated!      │
     │                         │      (has cookie)        │
     │<──────────────────────────────────────────────────┤
```

### Security Features

#### Token Rotation
- Each refresh token use generates a new token pair
- Old tokens are immediately invalidated
- `rotated_at` and `replaced_by_token_id` track the rotation chain
- Enables detection of stolen tokens through family tracking

#### Family Tracking
- All rotated tokens share the same `family_id`
- If a previously-rotated token is reused, the entire family is revoked
- Prevents token replay attacks

#### Cookie Security
- **HttpOnly**: Prevents JavaScript access to session tokens
- **Secure**: Only transmitted over HTTPS
- **SameSite=Lax**: CSRF protection while allowing top-level navigation
- **Domain scoped**: Cookie set for `.plus.bingo` domain

#### Redirect Whitelist
- Only whitelisted URIs accepted for post-login redirects
- Prevents open redirect vulnerabilities
- Configured via `REDIRECT_WHITELIST` environment variable

## Endpoints

### Authentication

#### Login
```http
POST /v1/auth/login
```

**Headers:**
- `Content-Type: application/json`
- `X-Correlation-Id: {{$guid}}` (optional)

**Request Body:**
```json
{
    "username": "string",
    "password": "string",
    "redirect_uri": "string (optional)",
    "state": "string (optional)"
}
```

**Response - Success (200 OK):**
```json
{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "john.doe",
    "user": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "username": "john.doe",
        "roles": ["admin"],
        "permissions": ["com.lotto.service.sso-internal:user:create"]
    },
    "session_family_id": "660e8400-e29b-41d4-a716-446655440000",
    "correlation_id": "abc-123-def",
    "redirect_uri": "https://app.plus.bingo/dashboard?state=abc123"
}
```

**Response Headers:**
```
Set-Cookie: plus_session=550e8400-e29b-41d4-a716-446655440000; Domain=.plus.bingo; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```

**Note on Tokens:**
- Access tokens and refresh tokens are **NOT** included in the login response body for security reasons
- The refresh token is securely stored in the HttpOnly `plus_session` cookie
- Use the `/v1/auth/session` endpoint to obtain access tokens for API calls

**Note on Redirects:**
- When `redirect_uri` is provided and validated, it's returned in the response body with the `state` parameter appended
- The frontend/client is responsible for performing the actual redirect using the validated `redirect_uri`
- The backend validates the `redirect_uri` against the whitelist but does not perform HTTP 302 redirects

**Description:**

Authenticates a user and establishes an SSO session. The endpoint supports both traditional API usage (JSON response) and OAuth-style redirect flow.

**Key Features:**
- Sets `plus_session` cookie (HttpOnly, Secure, SameSite=Lax) for the `.plus.bingo` domain
- Returns `session_family_id` for token rotation tracking
- Returns validated `redirect_uri` in response body (frontend performs actual redirect)
- Tokens are stored securely in cookies (not in response body)
- Supports optional redirect for cross-domain SSO
- Rate limited to prevent brute force attacks

**Parameters:**
- `username` (required): User's username
- `password` (required): User's password
- `redirect_uri` (optional): URL to redirect to after successful login (must be whitelisted)
- `state` (optional): Opaque value to maintain state between request and callback

#### Session Refresh
```http
POST /v1/auth/session
```

**Headers:**
- `Content-Type: application/json`
- `X-Correlation-Id: {{$guid}}` (optional)
- `Cookie: plus_session=...` (automatically sent by browser)

**Request Body:** Empty or `{}`

**Response - Success (200 OK):**
```json
{
    "user": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "username": "john.doe",
        "roles": ["admin"],
        "permissions": ["com.lotto.service.sso-internal:user:create"]
    },
    "username": "john.doe",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "660e8400-e29b-41d4-a716-446655440000",
    "refresh_token_expires_at": "2024-04-17T10:00:00Z",
    "session_family_id": "770e8400-e29b-41d4-a716-446655440000"
}
```

**Response Headers:**
```
Set-Cookie: plus_session=660e8400-e29b-41d4-a716-446655440000; Domain=.plus.bingo; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```

**Description:**

Refreshes the user's session using the HttpOnly `plus_session` cookie. This endpoint implements automatic token rotation for enhanced security.

**Token Rotation Behavior:**
1. Validates the current refresh token from cookie
2. Marks the old token as rotated with `rotated_at` timestamp
3. Generates new refresh token with same `family_id`
4. Links old token to new via `replaced_by_token_id`
5. Deletes the old token from database
6. Sets new token as `plus_session` cookie

**Security Notes:**
- If a previously-rotated token is reused, the entire token family is revoked (detects token theft)
- This endpoint is excluded from rate limiting for seamless UX
- Requires valid, non-expired refresh token in cookie

#### Logout
```http
POST /v1/auth/logout
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "refresh_token": "{{refreshToken}}"
}
```

**Description:** Invalidate the current session by revoking the refresh token

### User Management

#### Create New User
```http
POST /v1/users/newUser
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "username": "newuser",
    "password": "Password123!"
}
```

**Description:** Create a new user account

#### Change Password
```http
POST /v1/users/changePassword
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "current_password": "currentPass123!",
    "new_password": "newPass123!"
}
```

**Description:** Change user password

#### Change User Status
```http
POST /v1/users/changeStatus
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "BLOCKED"
}
```

**Response Example:**
```json
{
    "message": "User status updated successfully",
    "status_code": 200,
    "data": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "username": "john.doe",
        "status": "BLOCKED"
    },
    "meta": {
        "correlation_id": "9fb34360-5372-4b0d-b353-3b14f0b958e9"
    }
}
```

#### Assign Role to User
```http
POST /v1/users/assignRole
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "role_ids": [
        "456e7890-f12d-34e5-a678-901234567890",
        "789e0123-f45d-67e8-a901-234567890123"
    ]
}
```

**Response Example:**
```json
{
    "message": "Success",
    "status_code": 201,
    "meta": {
        "correlation_id": "123e4567-e89b-12d3-a456-426614174000"
    },
    "data": {
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "roles": [
            {
                "role_id": "456e7890-f12d-34e5-a678-901234567890",
                "name": "User Management"
            },
            {
                "role_id": "789e0123-f45d-67e8-a901-234567890123",
                "name": "Basic"
            }
        ]
    }
}
```

**Description:** Assign multiple roles to a user. Skips roles that are already assigned or not found.

#### Get Current User
```http
GET /v1/users/me
```

**Headers:**
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Response Example:**
```json
{
    "username": "john.doe",
    "created_at": "2024-01-28T21:18:43.225Z",
    "updated_at": "2024-01-28T21:18:43.225Z",
    "last_login": "2024-01-28T21:18:43.225Z"
}
```

#### List Users
```http
GET /v1/users
```

**Headers:**
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Query Parameters:**
- `page` (optional): Page number (1-based, default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response Example:**
```json
{
    "data": [
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "username": "john.doe",
            "status": "ACTIVE",
            "roles": ["admin", "user"],
            "permissions": ["com.lotto.service.sso-internal:user:create"],
            "last_login": "2024-03-20T10:00:00Z",
            "created_at": "2024-03-20T10:00:00Z",
            "updated_at": "2024-03-20T10:00:00Z"
        }
    ],
    "meta": {
        "currentPage": 1,
        "totalPages": 10,
        "totalItems": 100,
        "itemsPerPage": 50
    }
}
```

#### Remove Roles from User
```http
POST /v1/users/removeRoles
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "role_ids": [
        "456e7890-f12d-34e5-a678-901234567890",
        "789e0123-f45d-67e8-a901-234567890123"
    ]
}
```

**Response Example:**
```json
{
    "message": "Success",
    "status_code": 200,
    "meta": {
        "correlation_id": "123e4567-e89b-12d3-a456-426614174000"
    },
    "data": {
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "roles": [
            {
                "role_id": "456e7890-f12d-34e5-a678-901234567890",
                "name": "User Management"
            },
            {
                "role_id": "789e0123-f45d-67e8-a901-234567890123",
                "name": "Basic"
            }
        ]
    }
}
```

**Description:** Remove specified roles from a user. Returns the remaining roles after removal.

### Role Management

#### Create Role
```http
POST /v1/roles
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "name": "editor",
    "description": "Content editor role"
}
```

**Description:** Create a new role

#### Get All Roles
```http
GET /v1/roles
```

**Headers:**
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Response Example:**
```json
{
    "message": "Success",
    "status_code": 200,
    "meta": {
        "correlation_id": "123e4567-e89b-12d3-a456-426614174000"
    },
    "data": [
        {
            "id": "55a641f2-4bf6-4ce9-bea9-aba3949aae25",
            "name": "User Management",
            "description": "User and role management",
            "created_at": "2025-01-28T21:18:43.225Z",
            "updated_at": "2025-01-28T21:18:43.225Z",
            "permissions": [
                {
                    "permission_id": "caf3fc3f-17a7-41c2-97e4-a1800898afae",
                    "name": "com.lotto.service.sso-internal:user:create"
                }
            ]
        }
    ]
}
```

#### Get Role Details
```http
GET /v1/roles/:roleId
```

**Headers:**
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Path Parameters:**
- `roleId`: ID of the role to retrieve

**Response Example:**
```json
{
    "message": "Success",
    "status_code": 200,
    "meta": {
        "correlation_id": "123e4567-e89b-12d3-a456-426614174000"
    },
    "data": {
        "id": "55a641f2-4bf6-4ce9-bea9-aba3949aae25",
        "name": "User Management",
        "description": "User and role management",
        "created_at": "2025-01-28T21:18:43.225Z",
        "updated_at": "2025-01-28T21:18:43.225Z",
        "permissions": [
            {
                "permission_id": "caf3fc3f-17a7-41c2-97e4-a1800898afae",
                "name": "com.lotto.service.sso-internal:user:create"
            }
        ]
    }
}
```

#### Assign Permissions to Role
```http
POST /v1/roles/assignPermissions
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "role_id": "123e4567-e89b-12d3-a456-426614174000",
    "permission_ids": [
        "456e7890-f12d-34e5-a678-901234567890",
        "789e0123-f45d-67e8-a901-234567890123"
    ]
}
```

**Response Example:**
```json
{
    "role_id": "123e4567-e89b-12d3-a456-426614174000",
    "permission_ids": [
        "456e7890-f12d-34e5-a678-901234567890",
        "789e0123-f45d-67e8-a901-234567890123"
    ],
    "role": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "admin",
        "permissions": [
            {
                "permission_id": "456e7890-f12d-34e5-a678-901234567890",
                "name": "com.lotto.service.sso-internal:user:create"
            },
            {
                "permission_id": "789e0123-f45d-67e8-a901-234567890123",
                "name": "com.lotto.service.sso-internal:user:update"
            }
        ]
    }
}
```

**Description:** Assign multiple permissions to a role. Skips permissions that are already assigned to the role.

#### Remove Permissions from Role
```http
POST /v1/roles/removePermissions
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "role_id": "role-id-1",
    "permission_ids": ["permission-id-1", "permission-id-2"]
}
```

**Description:** Remove specified permissions from a role

#### Delete Role
```http
DELETE /v1/roles
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "role_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Description:** Delete a role. The role must not have any permissions assigned and must not be assigned to any users.

**Response:** 204 No Content

### Permission Management

#### Create Permission
```http
POST /v1/permissions
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "name": "create:article",
    "description": "Can create articles"
}
```

**Description:** Create a new permission

#### Get All Permissions
```http
GET /v1/permissions
```

**Headers:**
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Description:** Get list of all permissions

#### Delete Permission
```http
DELETE /v1/permissions
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "permission_id": "permission-id-1"
}
```

**Description:** Delete a permission that is not assigned to any role

## Development

### Environment Variables

The service requires the following environment variables:

```env
# Server
PORT=3000
NODE_ENV=development
APP_NAME=com.lotto.service.sso-internal

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=5m
JWT_ISSUER=https://auth.plus.bingo
JWT_AUDIENCE=plus.bingo

# Refresh Token Configuration
REFRESH_TOKEN_ROTATION_ENABLED=true              # Enable token rotation
REFRESH_TOKEN_TTL_DAYS=30                        # 30 days

# Cookie Configuration (SSO)
SESSION_COOKIE_NAME=plus_session
COOKIE_DOMAIN=.plus.bingo                        # Shared across subdomains
COOKIE_SECURE=true                               # HTTPS only
COOKIE_SAMESITE=lax                              # CSRF protection
COOKIE_PATH=/

# SSO Redirect Configuration
REDIRECT_WHITELIST=https://plus.bingo,https://app.plus.bingo,https://admin.plus.bingo
ALLOWED_ORIGINS=https://plus.bingo,https://auth.plus.bingo,https://*.plus.bingo

# Rate Limiting
THROTTLE_TTL_SECONDS=60
THROTTLE_LIMIT=10                                # Max 10 requests per minute

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123!
```

**Configuration Notes:**

- `JWT_EXPIRATION`: Keep access tokens short-lived (5m recommended) since they can't be revoked
- `REFRESH_TOKEN_TTL_DAYS`: Longer duration for refresh tokens (30 days typical)
- `REFRESH_TOKEN_ROTATION_ENABLED`: Always enable in production for security
- `COOKIE_DOMAIN`: Use leading dot (`.plus.bingo`) to share across subdomains
- `COOKIE_SECURE`: Must be `true` in production (requires HTTPS)
- `REDIRECT_WHITELIST`: Comma-separated list of allowed redirect URIs
- `THROTTLE_LIMIT`: Adjust based on expected login patterns

### Running the Service

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npx prisma migrate dev
```

3. Start the service:
```bash
npm run start:dev
```

### Testing

Run the test suite:
```bash
npm test
```

Run e2e tests:
```bash
npm run test:e2e
``` 
