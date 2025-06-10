# API Endpoints

## Authentication Endpoints

### GET /api/auth/config
Returns Azure AD configuration for client-side MSAL setup.

**Response:**
```json
{
  "clientId": "string",
  "authority": "string", 
  "redirectUri": "string",
  "postLogoutRedirectUri": "string"
}
```

### GET /api/auth/validate
Validates current authentication session.

**Response:**
```json
{
  "isValid": boolean,
  "user": {
    "name": "string",
    "email": "string",
    "avatar": "string"
  }
}
```

## Chat Endpoints

### POST /api/chat
Sends a message to the AI chat service.

**Request:**
```json
{
  "messages": [
    {
      "role": "user" | "assistant",
      "content": "string"
    }
  ],
  "id": "string",
  "data": {}
}
```

**Response:**
Streaming response with chat completion and any generated artifacts.

## Health Check

### GET /api/health
Returns application health status.

**Response:**
```json
{
  "status": "ok" | "error",
  "timestamp": "string",
  "version": "string"
}
```

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "string",
  "message": "string", 
  "status": number
}
```

### Common Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
