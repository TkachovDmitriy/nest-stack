# Simple API Responses Decorator Guide

This guide shows how to use the simplified `StandardApiResponses` decorator that applies default standard status codes automatically with optional customization.

## Import

```typescript
import { StandardApiResponses } from '@infrastructure/common/decorators/api-responses.decorator';
```

## Basic Usage

### Default Standard Responses (No Configuration)
```typescript
@StandardApiResponses()
```
This automatically applies:
- **200**: Operation completed successfully
- **400**: Bad request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Resource not found
- **409**: Resource already exists
- **422**: Validation failed
- **500**: Internal server error

### Customize Specific Responses
```typescript
@StandardApiResponses({
  200: {
    description: 'User retrieved successfully',
    type: UserResponse,
  },
  404: {
    description: 'User not found',
  },
})
```

### Custom Schema Response
```typescript
@StandardApiResponses({
  200: {
    description: 'Operation completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'object' },
      },
    },
  },
  400: {
    description: 'Invalid input data',
  },
})
```

## Controller Examples

### Simple CRUD Endpoint
```typescript
@Get(':id')
@ApiOperation({ summary: 'Get user by ID' })
@StandardApiResponses({
  200: {
    description: 'User retrieved successfully',
    type: UserResponse,
  },
  404: {
    description: 'User not found',
  },
})
async getUser(@Param('id') id: string): Promise<UserResponse> {
  // Implementation
}
```

### Create Endpoint
```typescript
@Post()
@ApiOperation({ summary: 'Create new user' })
@StandardApiResponses({
  201: {
    description: 'User created successfully',
    type: UserResponse,
  },
  400: {
    description: 'Invalid user data',
  },
  409: {
    description: 'User already exists',
  },
})
async createUser(@Body() data: CreateUserRequest): Promise<UserResponse> {
  // Implementation
}
```

### Update Endpoint
```typescript
@Put(':id')
@ApiOperation({ summary: 'Update user' })
@StandardApiResponses({
  200: {
    description: 'User updated successfully',
    type: UserResponse,
  },
  404: {
    description: 'User not found',
  },
  403: {
    description: 'Forbidden - can only modify own user',
  },
})
async updateUser(
  @Param('id') id: string,
  @Body() data: UpdateUserRequest,
): Promise<UserResponse> {
  // Implementation
}
```

### Delete Endpoint
```typescript
@Delete(':id')
@ApiOperation({ summary: 'Delete user' })
@StandardApiResponses({
  200: {
    description: 'User deleted successfully',
  },
  404: {
    description: 'User not found',
  },
  403: {
    description: 'Forbidden - can only delete own user',
  },
})
async deleteUser(@Param('id') id: string): Promise<void> {
  // Implementation
}
```

### Custom Response with Schema
```typescript
@Post(':id/activate')
@ApiOperation({ summary: 'Activate user account' })
@StandardApiResponses({
  200: {
    description: 'User activated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        activatedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
  404: {
    description: 'User not found',
  },
  403: {
    description: 'Forbidden - can only activate own account',
  },
})
async activateUser(@Param('id') id: string): Promise<{
  success: boolean;
  message: string;
  activatedAt: string;
}> {
  // Implementation
}
```

### Minimal Configuration (Only Override What You Need)
```typescript
@Get()
@ApiOperation({ summary: 'Get all users' })
@StandardApiResponses({
  200: {
    description: 'Users retrieved successfully',
    type: UserListResponse,
  },
  // All other status codes (400, 401, 403, 404, 409, 422, 500) 
  // will use default descriptions automatically
})
async getUsers(@Query() query: PaginationQuery): Promise<UserListResponse> {
  // Implementation
}
```

## Benefits

1. **Single Decorator**: One decorator instead of multiple `@ApiResponse` decorators
2. **Default Standards**: Automatically applies common status codes with sensible defaults
3. **Customizable**: Override only what you need to customize
4. **DRY**: Eliminates repetitive decorator code
5. **Consistent**: Standardized response patterns across all controllers
6. **Type Safe**: Full TypeScript support
7. **Clean**: Much cleaner and more readable code

## Migration Example

### Before (Repetitive)
```typescript
@ApiResponse({
  status: 200,
  description: 'User retrieved successfully',
  type: UserResponse,
})
@ApiResponse({
  status: 404,
  description: 'User not found',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
@ApiResponse({
  status: 403,
  description: 'Forbidden',
})
@ApiResponse({
  status: 400,
  description: 'Bad request',
})
```

### After (Clean & Simple)
```typescript
@StandardApiResponses({
  200: {
    description: 'User retrieved successfully',
    type: UserResponse,
  },
  404: {
    description: 'User not found',
  },
  // 401, 403, 400, 409, 422, 500 use default descriptions automatically
})
```

This approach gives you the best of both worlds: **default standards** with **optional customization** when needed!
