# Refactoring Strategy Brainstorm

## 1. API Response Decorator Improvements

### Current Issues:
- `@StandardApiResponses` name is not intuitive
- Still need to replace all `@ApiResponse` decorators across controllers

### Better Naming Options:
- `@ApiDocs` - Simple and clear
- `@SwaggerDocs` - Explicit about purpose
- `@ApiResponses` - Generic but clear
- `@EndpointDocs` - Descriptive
- `@ApiDocumentation` - Full descriptive name

**Recommendation**: `@ApiDocs` - Short, clear, and intuitive

### Implementation Strategy:
```typescript
// Instead of multiple @ApiResponse decorators
@ApiDocs({
  200: { description: 'Success', type: ResponseType },
  404: { description: 'Not found' },
  // Defaults for 400, 401, 403, 422, 500
})
```

## 2. Error Handling Strategy

### Current Problems:
- Try/catch blocks in every use case method
- Inconsistent error handling across the application
- Duplicate error handling logic

### Proposed Solution: Global Error Handling

#### Option A: Global Exception Filter
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Centralized error handling
    // Log errors
    // Transform to consistent error response
    // Handle different error types (ValidationError, NotFoundError, etc.)
  }
}
```

#### Option B: Use Case Wrapper
```typescript
export function UseCaseHandler<T extends (...args: any[]) => Promise<any>>(
  useCase: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await useCase(...args);
    } catch (error) {
      // Centralized error handling
      throw this.transformError(error);
    }
  }) as T;
}
```

#### Option C: Decorator Pattern
```typescript
@HandleErrors()
async createBooking(data: CreateBookingInput) {
  // No try/catch needed - handled by decorator
  return this.bookingRepository.create(data);
}
```

**Recommendation**: Combination of Global Exception Filter + Use Case Decorator

## 3. Validation Strategy

### Input Validation:
- **Controllers**: Validate request DTOs with Zod schemas
- **Use Cases**: Trust validated data from controllers
- **Repositories**: No input validation (trust use cases)

### Response Validation:
- **Repositories**: Return raw data
- **Use Cases**: Transform and validate with Zod schemas
- **Controllers**: Return validated responses

### Implementation:
```typescript
// Controller
@Post()
@ApiDocs({ 201: { description: 'Created', type: UserResponse } })
async createUser(@Body() data: CreateUserDto) {
  return this.userUseCase.createUser(data); // data already validated
}

// Use Case
async createUser(data: CreateUserDto) {
  const user = await this.userRepository.create(data);
  return UserResponseSchema.parse(user); // Validate response
}
```

## 4. Controller Responsibilities

### What Controllers SHOULD Do:
- Route HTTP requests to use cases
- Validate input DTOs
- Handle authentication/authorization
- Return HTTP responses
- Apply API documentation decorators

### What Controllers SHOULD NOT Do:
- Business logic
- Database operations
- Complex data transformations
- Error handling (beyond HTTP status codes)

### Ideal Controller Structure:
```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userUseCase: UserUseCase) {}

  @Post()
  @ApiDocs({ 201: { description: 'User created', type: UserResponse } })
  async createUser(@Body() data: CreateUserDto): Promise<UserResponse> {
    return this.userUseCase.createUser(data);
  }

  @Get(':id')
  @ApiDocs({ 200: { description: 'User found', type: UserResponse } })
  async getUser(@Param('id') id: string): Promise<UserResponse> {
    return this.userUseCase.getUser(id);
  }
}
```

## 5. Code Minimization Strategies

### Current Issues:
- Controllers have too much code
- Repetitive patterns across controllers
- Business logic mixed with HTTP handling

### Solutions:

#### A. Base Controller Class
```typescript
export abstract class BaseController<TUseCase> {
  constructor(protected readonly useCase: TUseCase) {}

  protected async handleRequest<R>(
    operation: () => Promise<R>,
    successStatus: number = 200
  ): Promise<R> {
    return operation();
  }
}
```

#### B. Generic CRUD Controller
```typescript
@Controller('users')
export class UserController extends BaseCrudController<UserUseCase, UserDto, UserResponse> {
  // Inherits standard CRUD operations
  // Only add custom endpoints
}
```

#### C. Use Case Composition
```typescript
// Instead of multiple use cases, compose them
export class UserService {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}
}
```

## 6. Serialization Strategy

### Current Issues:
- Inconsistent response formats
- Manual serialization in multiple places
- No clear DTO strategy

### Proposed Solution:

#### A. Response DTOs with Zod
```typescript
export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  createdAt: z.date(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
```

#### B. Serialization Middleware
```typescript
@UseInterceptors(ResponseSerializationInterceptor)
@Controller('users')
export class UserController {
  // Responses automatically serialized
}
```

#### C. Repository Response Mapping
```typescript
// Repository returns raw data
async findById(id: string): Promise<UserEntity> {
  return this.prisma.user.findUnique({ where: { id } });
}

// Use case transforms to DTO
async getUser(id: string): Promise<UserResponse> {
  const user = await this.userRepository.findById(id);
  return UserResponseSchema.parse(user);
}
```

## 7. Implementation Priority

### Phase 1: Foundation
1. Rename and improve `@StandardApiResponses` decorator
2. Implement global error handling
3. Create base controller class

### Phase 2: Validation & Serialization
1. Implement Zod validation strategy
2. Create response DTOs
3. Add serialization middleware

### Phase 3: Controller Refactoring
1. Refactor all controllers to use new patterns
2. Minimize controller code
3. Move business logic to use cases

### Phase 4: Advanced Features
1. Generic CRUD controllers
2. Advanced error handling
3. Performance optimizations

## 8. Benefits of This Approach

### Code Quality:
- **DRY**: Eliminate duplicate code
- **SOLID**: Clear separation of concerns
- **Maintainable**: Easy to modify and extend
- **Testable**: Clear boundaries for testing

### Developer Experience:
- **Consistent**: Standardized patterns
- **Fast**: Less boilerplate code
- **Clear**: Obvious where logic belongs
- **Safe**: Type-safe with Zod validation

### Performance:
- **Efficient**: Centralized error handling
- **Scalable**: Easy to add new endpoints
- **Optimized**: Minimal overhead

## 9. Migration Strategy

### Step 1: Create New Infrastructure
- New decorators
- Global error handling
- Base classes

### Step 2: Migrate One Controller at a Time
- Start with simplest controller
- Test thoroughly
- Document patterns

### Step 3: Apply to All Controllers
- Systematic migration
- Maintain backward compatibility
- Update documentation

### Step 4: Cleanup
- Remove old patterns
- Optimize performance
- Final testing

This approach will significantly improve code quality, maintainability, and developer experience while reducing the overall codebase size and complexity.
