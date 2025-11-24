# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
- **Development mode**: `pnpm start:dev` - Runs with hot-reload using `tsx` and `--watch`
- **Production mode**: Set `NODE_ENV="production"` in `.env`, then run `pnpm build && pnpm start:prod`
- **Build**: `pnpm build` - Compiles TypeScript and bundles with `tsup`

### Code Quality
- **Lint and format**: `pnpm check` - Runs Biome to check and fix code formatting issues
- **Testing**: No test runner is currently configured in the scripts (Vitest is available but no script defined)

### Environment Setup
- Copy `.env.template` to `.env` before running the application
- All environment variables are validated using Zod schemas in `src/common/utils/envConfig.ts`

## Architecture Overview

### Layered Architecture Pattern

This codebase follows a clear separation of concerns with the following layers:

```
Router → Controller → Service → Repository
```

- **Router** (`*Router.ts`): Defines HTTP routes, OpenAPI documentation, and request validation schemas
- **Controller** (`*Controller.ts`): Handles HTTP request/response, extracts parameters, invokes services
- **Service** (`*Service.ts`): Contains business logic, error handling, returns `ServiceResponse` objects
- **Repository** (`*Repository.ts`): Data access layer (currently in-memory, designed for database integration)
- **Model** (`*Model.ts`): Zod schemas for validation and TypeScript type definitions

### ServiceResponse Pattern

All service methods return a `ServiceResponse<T>` object with:
- `success`: boolean indicating operation success
- `message`: human-readable message
- `responseObject`: the data (typed as `T`)
- `statusCode`: HTTP status code

This standardizes API responses across the application. Example:
```typescript
return ServiceResponse.success<User>('User found', user);
return ServiceResponse.failure('User not found', null, StatusCodes.NOT_FOUND);
```

### OpenAPI/Swagger Integration

API documentation is automatically generated using `@asteasolutions/zod-to-openapi`:
- Each router exports a registry (e.g., `userRegistry`)
- Routes are registered with their Zod validation schemas
- All registries are combined in `src/api-docs/openAPIDocumentGenerator.ts`
- Access Swagger UI at `/swagger` when running the server

### Path Aliases

The project uses TypeScript path aliases configured in `tsconfig.json`:
- `@/*` maps to `./src/*`
- Always use these aliases for imports (e.g., `import { env } from '@/common/utils/envConfig'`)

### Middleware Stack

Middleware is applied in `src/server.ts` in this order:
1. `express.json()` and `express.urlencoded()` - Body parsing
2. `cors()` - CORS with credentials support
3. `helmet()` - Security headers
4. `rateLimiter` - Rate limiting (configurable via env vars)
5. `requestLogger` - Pino HTTP logger
6. Route handlers
7. `errorHandler()` - Global error handling

## Adding New Features

### Creating a New API Endpoint

When adding a new API resource (e.g., "product"), create the following in `src/api/product/`:

1. **Model** (`productModel.ts`):
   - Define Zod schema with OpenAPI extensions
   - Export TypeScript type using `z.infer`
   - Create input validation schemas for endpoints

2. **Repository** (`productRepository.ts`):
   - Create class with async methods for data operations
   - Export singleton instance if stateless

3. **Service** (`productService.ts`):
   - Create class with business logic methods
   - Always return `ServiceResponse<T>` objects
   - Handle errors with try-catch and return failure responses
   - Use `logger.error()` for error logging

4. **Controller** (`productController.ts`):
   - Create class with `RequestHandler` methods
   - Extract params/body from `req`
   - Call service methods
   - Send response with `res.status(serviceResponse.statusCode).send(serviceResponse)`

5. **Router** (`productRouter.ts`):
   - Create `OpenAPIRegistry` instance
   - Register schemas and paths with OpenAPI metadata
   - Define Express routes with validation middleware
   - Export both router and registry

6. **Integration**:
   - Import and mount router in `src/server.ts`
   - Add registry to `src/api-docs/openAPIDocumentGenerator.ts`

### Request Validation

Use `validateRequest(schema)` middleware from `@/common/utils/httpHandlers`:
```typescript
router.post('/', validateRequest(CreateProductSchema), controller.createProduct);
```

Define validation schemas in the model file:
```typescript
export const CreateProductSchema = z.object({
  body: z.object({ name: z.string(), price: z.number() })
});
```

## Code Style

### Formatting (Biome)
- Indent: 2 spaces
- Line width: 100 characters
- Quotes: Single quotes for JS/TS, double for JSX
- Semicolons: Always
- Trailing commas: Always
- Arrow parentheses: Always

### File Organization
- Group files by feature/domain in `src/api/`
- Test files go in `__tests__` subdirectories (co-located with source)
- Common utilities and middleware in `src/common/`

## Technology Stack

- **Runtime**: Node.js with native TypeScript support via `tsx`
- **Framework**: Express 5.x
- **Validation**: Zod (also used for TypeScript types)
- **Logging**: Pino + pino-http
- **Security**: Helmet, CORS, express-rate-limit
- **API Docs**: Swagger UI with automatic OpenAPI spec generation
- **Build**: tsup (esbuild-based bundler)
- **Package Manager**: pnpm

## Docker Deployment

Multi-stage Dockerfile provided:
- Build stage: Installs all deps and compiles
- Production stage: Alpine-based, runs as non-root user, exposes port 8080
- Build: `docker build -t app .`
- Run: `docker run -p 8080:8080 app`
