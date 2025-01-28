# API Standards and Guidelines

## Request Tracing

### Correlation ID
- Every request should include an optional `X-Correlation-Id` header
- If not provided, a UUID v4 will be automatically generated
- The correlation ID will be included in:
  - Response headers
  - Error responses
  - All log entries related to the request
  - Downstream service calls

### Error Responses
All error responses should follow this format:
```json
{
    "message": "Human readable error message",
    "error": "ErrorType",
    "statusCode": 400,
    "correlationId": "123e4567-e89b-12d3-a456-426614174000"
}
```

- No timestamps in error responses
- Always include the correlation ID
- Use descriptive error messages
- Use proper HTTP status codes
- Error types should match the exception class name

### Logging Standards
- Always include the correlation ID in log entries
- Use structured logging format
- Log at appropriate levels:
  - ERROR: For errors that need attention
  - WARN: For unusual but handled conditions
  - INFO: For normal operations
  - DEBUG: For detailed troubleshooting
- Include relevant context but avoid sensitive data

### API Documentation
- Document the `X-Correlation-Id` header in:
  - Swagger/OpenAPI specs
  - Postman collections
  - API documentation
- Include example error responses
- Show correlation ID usage in examples 