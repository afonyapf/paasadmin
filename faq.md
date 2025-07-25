# Platform Administration System

## Overview

This is a full-stack web application for managing a multi-tenant workspace platform. The system provides administrators with tools to manage users, workspaces, tariff plans, templates, custom domains, and audit logs. The application follows a modern architecture with TypeScript throughout, React for the frontend, Express for the backend, and PostgreSQL for data storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and ES modules
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod for validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints under `/api` prefix
- **Session Management**: Express sessions with PostgreSQL session store
- **Authentication**: Session-based authentication with bcrypt for password hashing
- **Middleware**: Custom logging, authentication, and audit trail middleware

### Database Architecture
- **Database**: PostgreSQL with Neon serverless support
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: @neondatabase/serverless for edge-compatible connections

## Key Components

### Authentication System
- **Session-based Authentication**: Uses express-session with PostgreSQL store
- **Password Security**: bcrypt for hashing and validating passwords
- **Route Protection**: Middleware to protect API endpoints
- **Admin Management**: Separate admin accounts with role-based access

### Database Schema
The system manages several core entities:
- **Admins**: Platform administrators with username/password authentication
- **Users**: End users with OAuth support and status management
- **Workspaces**: User workspaces with ownership and template relationships
- **Tariffs**: Pricing plans with feature flags and usage limits
- **Templates**: Predefined workspace configurations
- **Custom Domains**: Domain management with SSL status tracking
- **Audit Logs**: Complete activity tracking for compliance
- **System Metrics**: Performance and usage statistics

### UI Components
- **Design System**: shadcn/ui with Radix UI primitives
- **Component Library**: Comprehensive set of reusable components
- **Theming**: CSS custom properties for light/dark theme support
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Data Flow

### Authentication Flow
1. Admin logs in through `/api/auth/login`
2. Session is created and stored in PostgreSQL
3. Client receives session cookie
4. Protected routes verify session via middleware
5. User context is managed through React Query

### CRUD Operations
1. Client makes API requests through React Query
2. Express routes handle validation and authorization
3. Drizzle ORM executes type-safe database operations
4. Audit logs are automatically created for all operations
5. Results are returned and cached by React Query

### Real-time Updates
- React Query handles automatic refetching
- Optimistic updates for better user experience
- Background refresh for dashboard statistics
- Error handling with toast notifications

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: bcryptjs for password hashing
- **Session Storage**: connect-pg-simple for PostgreSQL session store
- **Validation**: Zod for schema validation throughout the stack
- **Date Handling**: date-fns for date manipulation and formatting

### Development Dependencies
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Fast development server and build tool
- **ESBuild**: Fast bundling for production builds
- **Replit Integration**: Runtime error overlay and cartographer plugins

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: ESBuild bundles server code to `dist/index.js`
3. **Database Setup**: Drizzle Kit manages schema migrations
4. **Environment**: Production uses NODE_ENV=production

### Environment Configuration
- **Database URL**: PostgreSQL connection string
- **Session Secret**: Secure session signing key
- **Development Tools**: Replit-specific plugins for development

### Production Considerations
- **Static File Serving**: Express serves built frontend files
- **Session Persistence**: PostgreSQL-backed sessions for scalability
- **Error Handling**: Comprehensive error middleware
- **Logging**: Request logging with response time tracking

### Development Workflow
- **Hot Reloading**: Vite HMR for frontend, tsx watch for backend
- **Type Checking**: Incremental TypeScript compilation
- **Database Changes**: Drizzle Kit push for schema updates
- **Path Aliases**: Configured for clean imports across the codebase

The application is designed to be easily deployed on platforms like Replit, with proper environment variable configuration and database provisioning through Neon's serverless PostgreSQL.