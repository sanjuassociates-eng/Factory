# Steel Factory E2E Management System

Cloud-hosted, mobile-responsive web app for tracking daily steel production, buyer allocations, vehicle registration/dispatch, and audit logs.

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: NestJS + Prisma + PostgreSQL
- **Auth**: JWT with role-based access (Admin, Operator, Book Keeper, Buyer)

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
```

### 4. Setup database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Run development servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Seed Accounts

| Access | Email | Password | Permissions |
|--------|-------|----------|-------------|
| Admin | admin@factory.com | admin123 | Full access |
| Production Staff | production@factory.com | prod123 | Log Production |
| Dispatcher | dispatcher@factory.com | dispatch123 | Dispatch Vehicles, Manage Buyers |

## Project Structure

```
apps/
  api/     NestJS REST API
  web/     React frontend
packages/
  shared/  Shared TypeScript types
```

## Workflow

1. Production staff logs daily tonnage (increases stock)
2. Dispatcher creates a vehicle entry: selects buyer (searchable), adds multiple products with custom quantities
3. Dispatcher marks vehicle as picked up (stock dispatched)
4. Admin manages users, assigns granular permissions, manages products, views audit logs
5. All users land on `/home` which shows only actions available to them

See [plan.md](./plan.md) for full product specification.
