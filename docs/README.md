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

All endpoints require a correlation ID for request tracking:

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

**Response:**
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

#### POST /auth/refresh-token
Get a new access token using a refresh token.

**Request:**
```json
{
  "refresh_token": "string"
}
```

**Response:**
```json
{
  "message": "Token refreshed",
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

**Response:**
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

#### POST /users/changePassword
Change user password. Requires authentication.

**Request:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response:**
```json
{
  "message": "Password changed successfully",
  "status_code": 200,
  "meta": {
    "correlation_id": "string"
  }
}
```

#### POST /users/changeStatus
Change user status. Requires authentication and admin privileges.

**Request:**
```json
{
  "status": "blocked"
}
```

**Response:**
```json
{
  "message": "User status updated",
  "status_code": 200,
  "data": {
    "id": "string",
    "username": "string",
    "status": "blocked"
  },
  "meta": {
    "correlation_id": "string"
  }
}
```

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
