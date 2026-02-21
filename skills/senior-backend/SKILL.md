---
name: senior-backend
description: This skill should be used when the user asks to "design REST APIs", "optimize database queries", "implement authentication", "build microservices", "review backend code", "set up GraphQL", "handle database migrations", or "load test APIs". Use for Node.js/Express/Fastify development, PostgreSQL optimization, API security, and backend architecture patterns.
---

# Senior Backend Engineer

Backend development patterns, API design, database optimization, and security practices.

## Table of Contents

- [Quick Start](#quick-start)
- [Tools Overview](#tools-overview)
  - [API Scaffolder](#1-api-scaffolder)
  - [Database Migration Tool](#2-database-migration-tool)
  - [API Load Tester](#3-api-load-tester)
- [Backend Development Workflows](#backend-development-workflows)
  - [API Design Workflow](#api-design-workflow)
  - [Database Optimization Workflow](#database-optimization-workflow)
  - [Security Hardening Workflow](#security-hardening-workflow)
- [Reference Documentation](#reference-documentation)
- [Common Patterns Quick Reference](#common-patterns-quick-reference)

---

## Framework Selection (2025)

| Framework | When to use |
|-----------|-------------|
| **Hono** | Edge/serverless, cross-runtime (Cloudflare Workers, Bun, Node), new projects |
| **Fastify** | Node-only with rich plugin ecosystem (Mercurius/GraphQL, etc.) |
| **NestJS** | Enterprise, DI, strong opinionated structure, large teams |
| **Express** | Legacy maintenance only — do not start new projects |

### Hono — Modern Default

```typescript
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { serve } from '@hono/node-server';
import { z } from 'zod';

const app = new Hono();
app.use('*', logger());
app.use('/api/*', cors());

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

app.post('/api/users',
  zValidator('json', CreateUserSchema),
  async (c) => {
    const body = c.req.valid('json'); // fully typed, no cast needed
    const user = await db.insert(users).values(body).returning();
    return c.json(user[0], 201);
  }
);

app.onError((err, c) => c.json({ error: err.message }, 500));
serve({ fetch: app.fetch, port: 3000 });
```

### Drizzle ORM — SQL-level control with TypeScript safety

```typescript
// db/schema.ts
import { pgTable, text, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('users_email_idx').on(t.email),
]);

// db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
export const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema });

// For serverless (Neon HTTP driver — fastest for cold starts)
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
export const db = drizzle(neon(process.env.DATABASE_URL!), { schema });

// Queries
import { eq, desc } from 'drizzle-orm';
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { posts: { orderBy: desc(posts.createdAt) } },
});
const [newUser] = await db.insert(users).values({ email, name }).returning();
await db.transaction(async (tx) => { /* atomic operations */ });
```

```bash
# Migrations
npx drizzle-kit generate    # diff schema → SQL migration
npx drizzle-kit migrate     # apply migrations
npx drizzle-kit push        # push directly to dev DB (no migration file)
```

**Drizzle vs Prisma**: Drizzle is ~7KB vs Prisma's 2MB+ binary engine. No code generation step. 1:1 SQL mapping. Better serverless cold start performance. Prefer Drizzle for new projects; Prisma for teams that value the Prisma Studio and want a higher-level abstraction.

### better-auth — Modern Authentication

```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor } from 'better-auth/plugins';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true, requireEmailVerification: true },
  socialProviders: {
    github: { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! },
    google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! },
  },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  plugins: [twoFactor()],
});

// Mount in Hono
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

// Session middleware
const authMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  c.set('user', session.user);
  await next();
});
```

**Note**: Lucia auth was archived in late 2024. better-auth is its recommended successor.

### Node.js 22+ Features

```bash
# Load .env without dotenv package
node --env-file=.env server.js
```

```javascript
// Native fetch is global (stable in v22)
const data = await fetch('https://api.example.com').then(r => r.json());

// ESM equivalents of __dirname/__filename
import.meta.dirname   // equivalent of __dirname
import.meta.filename  // equivalent of __filename

// Built-in test runner (no external deps)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
```

---

## Quick Start

```bash
# Generate API routes from OpenAPI spec
python scripts/api_scaffolder.py openapi.yaml --framework express --output src/routes/

# Analyze database schema and generate migrations
python scripts/database_migration_tool.py --connection postgres://localhost/mydb --analyze

# Load test an API endpoint
python scripts/api_load_tester.py https://api.example.com/users --concurrency 50 --duration 30
```

---

## Tools Overview

### 1. API Scaffolder

Generates API route handlers, middleware, and OpenAPI specifications from schema definitions.

**Input:** OpenAPI spec (YAML/JSON) or database schema
**Output:** Route handlers, validation middleware, TypeScript types

**Usage:**
```bash
# Generate Express routes from OpenAPI spec
python scripts/api_scaffolder.py openapi.yaml --framework express --output src/routes/

# Output:
# Generated 12 route handlers in src/routes/
# - GET /users (listUsers)
# - POST /users (createUser)
# - GET /users/{id} (getUser)
# - PUT /users/{id} (updateUser)
# - DELETE /users/{id} (deleteUser)
# ...
# Created validation middleware: src/middleware/validators.ts
# Created TypeScript types: src/types/api.ts

# Generate from database schema
python scripts/api_scaffolder.py --from-db postgres://localhost/mydb --output src/routes/

# Generate OpenAPI spec from existing routes
python scripts/api_scaffolder.py src/routes/ --generate-spec --output openapi.yaml
```

**Supported Frameworks:**
- Express.js (`--framework express`)
- Fastify (`--framework fastify`)
- Koa (`--framework koa`)

---

### 2. Database Migration Tool

Analyzes database schemas, detects changes, and generates migration files with rollback support.

**Input:** Database connection string or schema files
**Output:** Migration files, schema diff report, optimization suggestions

**Usage:**
```bash
# Analyze current schema and suggest optimizations
python scripts/database_migration_tool.py --connection postgres://localhost/mydb --analyze

# Output:
# === Database Analysis Report ===
# Tables: 24
# Total rows: 1,247,832
#
# MISSING INDEXES (5 found):
#   orders.user_id - 847ms avg query time, ADD INDEX recommended
#   products.category_id - 234ms avg query time, ADD INDEX recommended
#
# N+1 QUERY RISKS (3 found):
#   users -> orders relationship (no eager loading)
#
# SUGGESTED MIGRATIONS:
#   1. Add index on orders(user_id)
#   2. Add index on products(category_id)
#   3. Add composite index on order_items(order_id, product_id)

# Generate migration from schema diff
python scripts/database_migration_tool.py --connection postgres://localhost/mydb \
  --compare schema/v2.sql --output migrations/

# Output:
# Generated migration: migrations/20240115_add_user_indexes.sql
# Generated rollback: migrations/20240115_add_user_indexes_rollback.sql

# Dry-run a migration
python scripts/database_migration_tool.py --connection postgres://localhost/mydb \
  --migrate migrations/20240115_add_user_indexes.sql --dry-run
```

---

### 3. API Load Tester

Performs HTTP load testing with configurable concurrency, measuring latency percentiles and throughput.

**Input:** API endpoint URL and test configuration
**Output:** Performance report with latency distribution, error rates, throughput metrics

**Usage:**
```bash
# Basic load test
python scripts/api_load_tester.py https://api.example.com/users --concurrency 50 --duration 30

# Output:
# === Load Test Results ===
# Target: https://api.example.com/users
# Duration: 30s | Concurrency: 50
#
# THROUGHPUT:
#   Total requests: 15,247
#   Requests/sec: 508.2
#   Successful: 15,102 (99.0%)
#   Failed: 145 (1.0%)
#
# LATENCY (ms):
#   Min: 12
#   Avg: 89
#   P50: 67
#   P95: 198
#   P99: 423
#   Max: 1,247
#
# ERRORS:
#   Connection timeout: 89
#   HTTP 503: 56
#
# RECOMMENDATION: P99 latency (423ms) exceeds 200ms target.
# Consider: connection pooling, query optimization, or horizontal scaling.

# Test with custom headers and body
python scripts/api_load_tester.py https://api.example.com/orders \
  --method POST \
  --header "Authorization: Bearer token123" \
  --body '{"product_id": 1, "quantity": 2}' \
  --concurrency 100 \
  --duration 60

# Compare two endpoints
python scripts/api_load_tester.py https://api.example.com/v1/users https://api.example.com/v2/users \
  --compare --concurrency 50 --duration 30
```

---

## Backend Development Workflows

### API Design Workflow

Use when designing a new API or refactoring existing endpoints.

**Step 1: Define resources and operations**
```yaml
# openapi.yaml
openapi: 3.0.3
info:
  title: User Service API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUser'
```

**Step 2: Generate route scaffolding**
```bash
python scripts/api_scaffolder.py openapi.yaml --framework express --output src/routes/
```

**Step 3: Implement business logic**
```typescript
// src/routes/users.ts (generated, then customized)
export const createUser = async (req: Request, res: Response) => {
  const { email, name } = req.body;

  // Add business logic
  const user = await userService.create({ email, name });

  res.status(201).json(user);
};
```

**Step 4: Add validation middleware**
```bash
# Validation is auto-generated from OpenAPI schema
# src/middleware/validators.ts includes:
# - Request body validation
# - Query parameter validation
# - Path parameter validation
```

**Step 5: Generate updated OpenAPI spec**
```bash
python scripts/api_scaffolder.py src/routes/ --generate-spec --output openapi.yaml
```

---

### Database Optimization Workflow

Use when queries are slow or database performance needs improvement.

**Step 1: Analyze current performance**
```bash
python scripts/database_migration_tool.py --connection $DATABASE_URL --analyze
```

**Step 2: Identify slow queries**
```sql
-- Check query execution plans
EXPLAIN ANALYZE SELECT * FROM orders
WHERE user_id = 123
ORDER BY created_at DESC
LIMIT 10;

-- Look for: Seq Scan (bad), Index Scan (good)
```

**Step 3: Generate index migrations**
```bash
python scripts/database_migration_tool.py --connection $DATABASE_URL \
  --suggest-indexes --output migrations/
```

**Step 4: Test migration (dry-run)**
```bash
python scripts/database_migration_tool.py --connection $DATABASE_URL \
  --migrate migrations/add_indexes.sql --dry-run
```

**Step 5: Apply and verify**
```bash
# Apply migration
python scripts/database_migration_tool.py --connection $DATABASE_URL \
  --migrate migrations/add_indexes.sql

# Verify improvement
python scripts/database_migration_tool.py --connection $DATABASE_URL --analyze
```

---

### Security Hardening Workflow

Use when preparing an API for production or after a security review.

**Step 1: Review authentication setup**
```typescript
// Verify JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,  // Must be from env, never hardcoded
  expiresIn: '1h',                 // Short-lived tokens
  algorithm: 'RS256'               // Prefer asymmetric
};
```

**Step 2: Add rate limiting**
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
```

**Step 3: Validate all inputs**
```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  age: z.number().int().positive().optional()
});

// Use in route handler
const data = CreateUserSchema.parse(req.body);
```

**Step 4: Load test with attack patterns**
```bash
# Test rate limiting
python scripts/api_load_tester.py https://api.example.com/login \
  --concurrency 200 --duration 10 --expect-rate-limit

# Test input validation
python scripts/api_load_tester.py https://api.example.com/users \
  --method POST \
  --body '{"email": "not-an-email"}' \
  --expect-status 400
```

**Step 5: Review security headers**
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

---

## Reference Documentation

| File | Contains | Use When |
|------|----------|----------|
| `references/api_design_patterns.md` | REST vs GraphQL, versioning, error handling, pagination | Designing new APIs |
| `references/database_optimization_guide.md` | Indexing strategies, query optimization, N+1 solutions | Fixing slow queries |
| `references/backend_security_practices.md` | OWASP Top 10, auth patterns, input validation | Security hardening |

---

## Common Patterns Quick Reference

### REST API Response Format
```json
{
  "data": { "id": 1, "name": "John" },
  "meta": { "requestId": "abc-123" }
}
```

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [{ "field": "email", "message": "must be valid email" }]
  },
  "meta": { "requestId": "abc-123" }
}
```

### HTTP Status Codes
| Code | Use Case |
|------|----------|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Validation error |
| 401 | Authentication required |
| 403 | Permission denied |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### Database Index Strategy
```sql
-- Single column (equality lookups)
CREATE INDEX idx_users_email ON users(email);

-- Composite (multi-column queries)
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Partial (filtered queries)
CREATE INDEX idx_orders_active ON orders(created_at) WHERE status = 'active';

-- Covering (avoid table lookup)
CREATE INDEX idx_users_email_name ON users(email) INCLUDE (name);
```

---

## Common Commands

```bash
# API Development
python scripts/api_scaffolder.py openapi.yaml --framework express
python scripts/api_scaffolder.py src/routes/ --generate-spec

# Database Operations
python scripts/database_migration_tool.py --connection $DATABASE_URL --analyze
python scripts/database_migration_tool.py --connection $DATABASE_URL --migrate file.sql

# Performance Testing
python scripts/api_load_tester.py https://api.example.com/endpoint --concurrency 50
python scripts/api_load_tester.py https://api.example.com/endpoint --compare baseline.json
```
