# Auth Service API Documentation

This document provides comprehensive documentation for the Auth Service API endpoints.

## Base URL

All API endpoints are prefixed with: `http://localhost:3000/v1`

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
Authorization: Bearer <access_token>
```

A correlation ID can be included for request tracking (optional):

```
X-Correlation-Id: <uuid>
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

#### POST /auth/login
Authenticate a user and receive access and refresh tokens.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response:**
```json
{
  "message": "Login successful",
  "status_code": 200,
  "data": {
    "user_id": "string",
    "username": "string",
    "access_token": "string",
    "refresh_token": "string"
  },
  "meta": {
    "correlation_id": "string"
  }
}
```

**Error Responses:**
- 401: Invalid credentials
- 500: Internal server error during authentication

#### POST /auth/refresh-token
Get a new access token using a refresh token.

**Request:**
```json
{
  "refresh_token": "string"
}
```

**Success Response:**
```json
{
  "message": "Token refreshed successfully",
  "status_code": 200,
  "data": {
    "access_token": "string",
    "refresh_token": "string"
  },
  "meta": {
    "correlation_id": "string"
  }
}
```

**Error Responses:**
- 401: Invalid or expired refresh token
- 500: Error refreshing token

#### POST /auth/logout
Invalidate the current session.

**Request:**
```json
{
  "refresh_token": "string"
}
```

**Success Response:**
```json
{
  "message": "Logged out successfully",
  "status_code": 200,
  "meta": {
    "correlation_id": "string"
  }
}
```

**Error Responses:**
- 401: Invalid session
- 500: Error during logout

### User Management

#### POST /users/newUser
Register a new user.

**Request:**
```json
{
  "username": "newuser",
  "password": "Password123!"
}
```

**Success Response:**
```json
{
  "message": "User created successfully",
  "status_code": 201,
  "data": {
    "id": "string",
    "username": "string",
    "access_token": "string",
    "refresh_token": "string"
  },
  "meta": {
    "correlation_id": "string"
  }
}
```

**Error Responses:**
- 409: User with this email already exists
- 500: An unexpected error occurred

#### POST /users/changePassword
Change user password.

**Request:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Success Response:**
```json
{
  "message": "Password changed successfully",
  "status_code": 200,
  "meta": {
    "correlation_id": "string"
  }
}
```

**Error Responses:**
- 401: Current password is incorrect
- 500: Error changing password

#### POST /users/changeStatus
Change user status.

**Request:**
```json
{
  "status": "blocked"
}
```

**Success Response:**
```json
{
  "message": "User status updated successfully",
  "status_code": 200,
  "data": {
    "id": "string",
    "username": "string",
    "status": "string"
  },
  "meta": {
    "correlation_id": "string"
  }
}
```

**Error Responses:**
- 403: Insufficient permissions to change user status
- 404: User not found
- 500: Error updating user status

#### Get Current User Profile

```http
GET /v1/me
```

Retrieves the current user's profile information using their access token.

**Headers:**
- `Authorization`: Bearer token (required)
- `X-Correlation-Id`: Request correlation ID (optional)

**Response:**
```json
{
  "username": "john.doe",
  "created_at": "2024-01-28T21:18:43.225Z",
  "updated_at": "2024-01-28T21:18:43.225Z",
  "last_login": "2024-01-28T21:18:43.225Z"
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved user profile
- `401 Unauthorized`: Invalid or missing access token
- `404 Not Found`: User not found

### Role Management

#### POST /v1/roles
Create a new role.

**Request:**
```json
{
  "name": "editor",
  "description": "Content editor role"
}
```

**Success Response:**
```json
{
  "message": "Role created successfully",
  "status_code": 201,
  "data": {
    "id": "string",
    "name": "editor",
    "description": "Content editor role"
  },
  "meta": {
    "correlation_id": "string"
  }
}
```

**Error Responses:**
- 409: Role with this name already exists
- 500: Error creating role

#### GET /v1/roles
Get a list of all roles.

**Success Response:**
```json
{
  "message": "Success",
  "status_code": 200,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  ],
  "meta": {
    "correlation_id": "string",
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50,
      "items_per_page": 10
    }
  }
}
```

**Error Responses:**
- 500: Error retrieving roles

#### GET /v1/roles/:roleId
Get details of a specific role.

**Success Response:**
```json
{
  "message": "Success",
  "status_code": 200,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "permissions": [
      {
        "id": "string",
        "name": "string",
        "description": "string"
      }
    ]
  },
  "meta": {
    "correlation_id": "string"
  }
}
```

**Error Responses:**
- 404: Role not found
- 500: Error retrieving role

#### PUT /v1/roles/:roleId/permissions
Assign permissions to a role.

**Request:**
```json
{
  "permissionIds": ["permission-id-1", "permission-id-2"]
}
```

**Response:**
```json
{
  "message": "Permissions assigned successfully",
  "status_code": 200,
  "data": {
    "id": "string",
    "name": "editor",
    "description": "Content editor role",
    "permissions": [
      {
        "id": "permission-id-1",
        "name": "create:article",
        "description": "Can create articles"
      },
      {
        "id": "permission-id-2",
        "name": "edit:article",
        "description": "Can edit articles"
      }
    ]
  },
  "meta": {
    "correlation_id": "string"
  }
}
```

### Permission Management

#### POST /v1/permissions
Create a new permission.

**Request:**
```json
{
  "name": "create:article",
  "description": "Can create articles"
}
```

**Success Response:**
```json
{
  "message": "Permission created successfully",
  "status_code": 201,
  "data": {
    "id": "string",
    "name": "create:article",
    "description": "Can create articles"
  },
  "meta": {
    "correlation_id": "string"
  }
}
```

**Error Responses:**
- 409: Permission with this name already exists
- 500: Error creating permission

#### GET /v1/permissions
Get a list of all permissions.

**Success Response:**
```json
{
  "message": "Success",
  "status_code": 200,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  ],
  "meta": {
    "correlation_id": "string",
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50,
      "items_per_page": 10
    }
  }
}
```

**Error Responses:**
- 500: Error retrieving permissions

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
