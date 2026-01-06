# Replit.md

## Overview

A task management application with worker assignment capabilities. The system allows users to create, edit, and delete workers and tasks, with the ability to assign tasks to specific workers. The UI is inspired by the Things app design aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build Tool**: Vite for frontend, esbuild for server bundling
- **Development**: Hot module replacement via Vite dev server

### Data Layer
- **ORM**: Drizzle ORM
- **Database**: MySQL (configured via mysql2 driver)
- **Schema Validation**: Zod with drizzle-zod integration
- **Schema Location**: `shared/schema.ts` contains table definitions

### API Design
- **Pattern**: REST API with typed route definitions
- **Route Definitions**: Centralized in `shared/routes.ts` with Zod schemas for input/output validation
- **Endpoints**: CRUD operations for workers (`/api/workers`) and tasks (`/api/tasks`)

### Project Structure
```
├── client/           # Frontend React application
│   └── src/
│       ├── components/   # React components including shadcn/ui
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utility functions
│       └── pages/        # Page components
├── server/           # Express backend
│   ├── db.ts         # Database connection
│   ├── routes.ts     # API route handlers
│   └── storage.ts    # Data access layer
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle table definitions
│   └── routes.ts     # API route type definitions
└── migrations/       # Database migrations
```

### Key Design Decisions

1. **Shared Schema**: Database schema and API types are defined in `shared/` directory, enabling type safety across client and server boundaries.

2. **Storage Abstraction**: The `IStorage` interface in `server/storage.ts` abstracts database operations, making it easier to swap implementations.

3. **Component Library**: Uses shadcn/ui components which are copied into the project (not installed as dependencies), allowing full customization.

4. **Path Aliases**: TypeScript path aliases (`@/`, `@shared/`) simplify imports across the codebase.

## External Dependencies

### Database
- **MySQL**: Primary database, connected via mysql2 driver
- **Environment Variables Required**:
  - `MYSQL_HOST`
  - `MYSQL_USER`
  - `MYSQL_PASSWORD`
  - `MYSQL_DATABASE`

Note: The `drizzle.config.ts` references PostgreSQL with `DATABASE_URL`, but the actual implementation in `server/db.ts` uses MySQL. This discrepancy should be resolved based on the intended database.

### Third-Party Services
- **Supabase**: Client library installed (`@supabase/supabase-js`) but not actively configured
- **Google Fonts**: Custom fonts loaded via CDN (DM Sans, Fira Code, Geist Mono, Architects Daughter)

### Build & Development
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Server-side bundling for production
- **Drizzle Kit**: Database migration tooling (`db:push` command)