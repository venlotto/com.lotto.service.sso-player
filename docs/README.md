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

## Endpoints

### Authentication

#### Login
```http
POST /v1/auth/login
```

**Headers:**
- `Content-Type: application/json`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "username": "{{username}}",
    "password": "{{password}}"
}
```

**Description:** Authenticate user and get access token

#### Refresh Token
```http
POST /v1/auth/refreshToken
```

**Headers:**
- `Content-Type: application/json`
- `X-Correlation-Id: {{$guid}}`

**Request Body:**
```json
{
    "refresh_token": "{{refreshToken}}"
}
```

**Description:** Get new access token using refresh token

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
    "user_id": "user-id-1",
    "role_ids": ["role-id-1", "role-id-2"]
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
            "permissions": ["com.lotto.service.auth-internal:user:create"],
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
    "role_ids": ["role-id-1", "role-id-2"]
}
```

**Response Example:**
```json
{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "roles": [
        {
            "role_id": "456e7890-f12d-34e5-a678-901234567890",
            "name": "admin"
        }
    ]
}
```

**Description:** Remove specified roles from a user

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
                    "name": "com.lotto.service.auth-internal:user:create"
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
                "name": "com.lotto.service.auth-internal:user:create"
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
                "name": "com.lotto.service.auth-internal:user:create"
            },
            {
                "permission_id": "789e0123-f45d-67e8-a901-234567890123",
                "name": "com.lotto.service.auth-internal:user:update"
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

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=1h
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRATION=7d

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123!
```

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
