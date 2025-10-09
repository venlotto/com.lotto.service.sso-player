# SSO (Single Sign-On) Documentation

## Overview

This service (`com.lotto.service.sso-internal`) implements a secure, cookie-based Single Sign-On (SSO) system with automatic token rotation for the plus.bingo domain. The architecture supports cross-subdomain authentication using HttpOnly cookies and implements sophisticated security measures including token family tracking and replay attack detection.

## Architecture

### Core Components

1. **Backend Service (NestJS)**: `com.lotto.service.sso-internal`
   - Handles authentication, authorization, and token management
   - Implements token rotation and family tracking
   - Validates redirect URIs against whitelist
   - Issues JWT access tokens and refresh tokens

2. **Frontend Service (SvelteKit)**: `com.lotto.web.sso-internal`
   - Provides login UI with redirect_uri support
   - Forwards cookies between backend and client
   - Handles client-side redirects after successful authentication
   - Manages session refresh via API endpoint

3. **Protected Applications**
   - Any application in the plus.bingo ecosystem
   - Receives session cookie via redirect
   - Uses `/v1/auth/session` endpoint to obtain access tokens
   - Makes authenticated API calls using JWT access tokens

### Authentication Flow

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│  Protected  │         │     SSO     │         │   Backend    │
│     App     │         │  (Frontend) │         │   Service    │
└──────┬──────┘         └──────┬──────┘         └──────┬───────┘
       │                       │                        │
       │  1. Needs auth        │                        │
       │  redirect to SSO      │                        │
       ├──────────────────────>│                        │
       │  ?redirect_uri=...    │                        │
       │                       │                        │
       │  2. Show login form   │                        │
       │<──────────────────────┤                        │
       │                       │                        │
       │  3. POST credentials  │                        │
       │                       ├───────────────────────>│
       │                       │  {username, password,  │
       │                       │   redirect_uri}        │
       │                       │                        │
       │                       │  4. Validate & issue   │
       │                       │     refresh token      │
       │                       │<───────────────────────┤
       │                       │  Set-Cookie:           │
       │                       │  plus_session=...      │
       │                       │                        │
       │  5. Frontend redirect │                        │
       │<──────────────────────┤                        │
       │  (has cookie now)     │                        │
       │                       │                        │
       │  6. Call /session     │                        │
       ├───────────────────────┼───────────────────────>│
       │  Cookie: plus_session │                        │
       │                       │                        │
       │  7. Receive tokens    │                        │
       │<──────────────────────┼────────────────────────┤
       │  {access_token,       │                        │
       │   refresh_token}      │                        │
       │                       │                        │
       │  8. Use access_token  │                        │
       │     for API calls     │                        │
       ├────────────────────────────────────────────────>│
       │  Authorization:       │                        │
       │  Bearer <token>       │                        │
```

## Token Management

### Token Types

#### Refresh Token
- **Storage**: HttpOnly cookie named `plus_session`
- **Lifetime**: 30 days (configurable via `REFRESH_TOKEN_TTL_DAYS`)
- **Purpose**: Long-lived token for obtaining new access tokens
- **Rotation**: Automatically rotated on every use when `REFRESH_TOKEN_ROTATION_ENABLED=true`
- **Format**: UUID v4

#### Access Token
- **Storage**: Never stored; returned in API responses for immediate use
- **Lifetime**: 5 minutes (configurable via `JWT_EXPIRATION`)
- **Purpose**: Short-lived JWT for authenticating API requests
- **Format**: JWT with `sub`, `username`, `roles`, and `permissions` claims

### Token Rotation

When token rotation is enabled (recommended for production):

1. User calls `/v1/auth/session` with refresh token in cookie
2. Backend validates the refresh token
3. Backend marks old token as "rotated" with `rotated_at` timestamp
4. Backend generates new refresh token with **same** `family_id`
5. Old token is linked to new token via `replaced_by_token_id`
6. Old token is deleted from database
7. New token is set as `plus_session` cookie
8. Both access_token and refresh_token returned in response body

**Security Feature**: If a previously-rotated token is reused (indicating theft), the entire token family is immediately revoked.

### Token Families

All tokens derived from the same initial login share a `family_id`. This enables:
- Tracking token rotation chains
- Detecting replay attacks
- Revoking all related tokens if theft is detected

## Endpoint Contracts

### POST /v1/auth/login

**Request:**
```json
{
  "username": "string",
  "password": "string",
  "redirect_uri": "string (optional, must be whitelisted)",
  "state": "string (optional)"
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "username": "string",
  "user": {
    "id": "uuid",
    "username": "string",
    "roles": ["string"],
    "permissions": ["string"]
  },
  "session_family_id": "uuid",
  "correlation_id": "uuid",
  "redirect_uri": "string (if provided)"
}
```

**Cookies Set:**
- `plus_session`: Refresh token (HttpOnly, Secure, SameSite=Lax, Domain=.plus.bingo)

**Notes:**
- Access/refresh tokens are **NOT** in response body (security)
- Redirect responsibility delegated to frontend
- Backend validates redirect_uri and returns it with state appended

### POST /v1/auth/session

**Request:**
- Cookie: `plus_session` (required)
- Body: `{}` (empty) or `{"refresh_token": "string"}` (optional fallback)

**Response:**
```json
{
  "user_id": "uuid",
  "username": "string",
  "user": {
    "id": "uuid",
    "username": "string",
    "roles": ["string"],
    "permissions": ["string"]
  },
  "access_token": "jwt-string",
  "refresh_token": "uuid",
  "session_family_id": "uuid",
  "correlation_id": "uuid"
}
```

**Cookies Set:**
- `plus_session`: New rotated refresh token

**Notes:**
- This endpoint rotates the refresh token
- Returns both access_token (for API calls) and refresh_token (for development/cross-port scenarios)
- Excluded from rate limiting for seamless UX

### POST /v1/auth/logout

**Request:**
- Header: `Authorization: Bearer <access_token>`
- Body: `{"refresh_token": "uuid (optional)"}`

**Response:**
- 204 No Content

**Cookies Cleared:**
- `plus_session`

**Notes:**
- Revokes refresh token from database
- Clears session cookie
- Access token cannot be revoked (expires naturally after 5 minutes)

## Security Features

### Cookie Security

```javascript
{
  httpOnly: true,           // Prevents JavaScript access (XSS protection)
  secure: true,             // HTTPS only (production)
  sameSite: 'lax',          // CSRF protection + allows top-level navigation
  domain: '.plus.bingo',    // Shared across all *.plus.bingo subdomains
  path: '/',                // Available on all paths
  maxAge: 2592000           // 30 days in seconds
}
```

### Redirect Whitelist

Only URLs in `REDIRECT_WHITELIST` environment variable are accepted for post-login redirects. This prevents open redirect vulnerabilities.

**Example:**
```env
REDIRECT_WHITELIST=https://plus.bingo,https://app.plus.bingo,http://localhost:5173,http://localhost:5174
```

**Validation Rules:**
- Must be absolute URL with protocol
- Must match whitelist entry exactly or start with whitelisted prefix
- State parameter automatically appended if provided

### Rate Limiting

- **Global**: 10 requests per 60 seconds (configurable)
- **Login endpoint**: Stricter limit to prevent brute force (5 requests per 60 seconds)
- **Session endpoint**: Excluded from rate limiting

### Base64 Parameter Encoding

Both `redirect_uri` and `state` parameters support base64 encoding. The backend automatically detects and decodes base64 values using smart validation:

- Checks if length is multiple of 4
- Validates character set
- Ensures decoded result is valid (no control characters)
- Falls back to treating as plain text if not valid base64

**Example:**
```
?redirect_uri=aHR0cDovL2xvY2FsaG9zdDo1MTc0Lw==&state=YWJjMTIz
```

## Configuration

### Required Environment Variables

#### Backend (com.lotto.service.sso-internal)

```env
# Server
APP_NAME=com.lotto.service.sso-internal
APP_PORT=3001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/auth"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="5m"
JWT_ISSUER="https://auth.plus.bingo"
JWT_AUDIENCE="plus.bingo"

# Refresh Tokens
REFRESH_TOKEN_TTL_DAYS=30
REFRESH_TOKEN_ROTATION_ENABLED=true

# Cookies
SESSION_COOKIE_NAME=plus_session
COOKIE_DOMAIN=.plus.bingo
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
COOKIE_PATH=/
COOKIE_SECRET="cookie-signing-secret"

# CORS
ALLOWED_ORIGINS=https://plus.bingo,https://auth.plus.bingo,https://*.plus.bingo

# Redirect Whitelist
REDIRECT_WHITELIST=https://plus.bingo,https://app.plus.bingo

# Rate Limiting
THROTTLE_TTL_SECONDS=60
THROTTLE_LIMIT=10
```

#### Frontend (com.lotto.web.sso-internal)

```env
# Public
PUBLIC_AUTH_BASE_URL=http://localhost:3001
PUBLIC_APP_NAME="Bingo Mania Plus Flash"

# Private
AUTH_API_BASE_URL=http://localhost:3001
COOKIE_DOMAIN=
```

## Development vs Production

### Development (localhost)

- `COOKIE_SECURE=false` (HTTP allowed)
- `COOKIE_DOMAIN=` (empty, no domain sharing)
- `REDIRECT_WHITELIST` includes http://localhost:* entries
- Tokens returned in response body to support cross-port development

### Production

- `COOKIE_SECURE=true` (HTTPS required)
- `COOKIE_DOMAIN=.plus.bingo` (domain-wide cookies)
- `REDIRECT_WHITELIST` only includes HTTPS URLs
- `REFRESH_TOKEN_ROTATION_ENABLED=true` (mandatory)

## Common Integration Patterns

### Pattern 1: Server-Side Rendering (SSR)

```typescript
// +page.server.ts
export async function load({ cookies, fetch }) {
  const authService = new AuthService({
    baseUrl: config.authApiBaseUrl,
    cookies,
    fetch
  });

  try {
    const session = await authService.refreshSession();
    return {
      user: session.user,
      accessToken: session.access_token
    };
  } catch (err) {
    // Redirect to login
    throw redirect(302, '/login?redirect_uri=' + base64(currentUrl));
  }
}
```

### Pattern 2: API Client

```typescript
// Protected app making API calls
const response = await fetch(`${API_BASE_URL}/api/resource`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

### Pattern 3: Cross-Port Development (localhost)

When developing with multiple ports (e.g., SSO on 5173, protected app on 5175):

1. SameSite=Lax blocks cross-port cookie sharing
2. Use refresh_token from `/session` response body
3. Store in sessionStorage (temporary, per-tab)
4. Use for subsequent session refreshes

## Troubleshooting

### Issue: Cookies not shared between subdomains

**Cause**: `COOKIE_DOMAIN` not set correctly
**Solution**: Set `COOKIE_DOMAIN=.plus.bingo` (with leading dot)

### Issue: Cookies not working on localhost

**Cause**: Different ports on localhost are different origins
**Solution**: Use tokens from response body instead of cookies for cross-port scenarios

### Issue: "redirect_uri is not allowed" error

**Cause**: URL not in whitelist or whitelist misconfigured
**Solution**:
1. Verify REDIRECT_WHITELIST has no leading spaces
2. Ensure URL matches exactly (including trailing slash behavior)
3. Restart backend after .env changes

### Issue: Refresh token expired/invalid

**Cause**: Token rotated multiple times or expired
**Solution**:
1. Check refresh token lifetime (30 days default)
2. Verify `REFRESH_TOKEN_ROTATION_ENABLED` setting
3. User must re-login if token family is revoked

## Maintenance

### Rotating Secrets

When rotating JWT_SECRET or COOKIE_SECRET:

1. All existing tokens become invalid
2. Users must re-authenticate
3. Plan rotation during low-traffic periods
4. Consider gradual rollout with dual-secret support

### Database Cleanup

Old refresh tokens are automatically deleted on rotation. For manual cleanup:

```sql
DELETE FROM refresh_tokens
WHERE rotated_at IS NOT NULL
AND rotated_at < NOW() - INTERVAL '7 days';
```

### Monitoring

Key metrics to track:
- Token rotation rate
- Failed login attempts (rate limit hits)
- Token family revocations (indicates theft attempts)
- Average token lifetime before rotation

## API Client Libraries

### SvelteKit Auth Service

Location: `com.lotto.web.sso-internal/src/lib/server/services/auth.service.ts`

**Usage:**
```typescript
import { AuthService } from '$lib/server/services/auth.service';

const authService = new AuthService({
  baseUrl: config.authApiBaseUrl,
  cookies,
  fetch
});

// Login
const result = await authService.login({
  username: 'user',
  password: 'pass',
  redirect_uri: 'https://app.plus.bingo'
});

// Refresh session
const session = await authService.refreshSession();

// Logout
await authService.logout();
```

## Future Enhancements

- [ ] Support for refresh token reuse grace period
- [ ] Admin dashboard for token family inspection
- [ ] Metrics/telemetry for security events
- [ ] Support for OAuth2/OIDC external providers
- [ ] Multi-factor authentication (MFA)
- [ ] Device fingerprinting for additional security

## References

- [Backend API Documentation](docs/README.md)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [RFC 6749 - OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [IETF Token Rotation Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
