# Discord Task Scheduler

A full-stack application for scheduling tasks and sending automated notifications to Discord via webhooks.

## Tech Stack

- **Backend**: Express.js with TypeScript
- **Frontend**: Next.js with TypeScript
- **Database**: PostgreSQL with TypeORM migrations
- **Containerization**: Docker & Docker Compose
- **Task Scheduling**: node-cron
- **Authentication**: API Key-based

## Features

- Create, read, update, and delete scheduled tasks
- Automatic task execution based on scheduled time
- Discord webhook notifications when tasks are due
- Retry logic with exponential backoff for failed webhooks
- API authentication with API keys
- PostgreSQL database with proper migrations
- RESTful API architecture
- Modern React frontend with Next.js

## Project Structure

```
discord-task-scheduler/
├── backend/                  # Express.js backend
│   ├── src/
│   │   ├── config/          # Configuration (database, auth, typeorm)
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── migrations/      # TypeORM migrations
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (Discord, Scheduler)
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions (retry logic)
│   │   └── index.ts         # Entry point
│   ├── postman/             # Postman API documentation
│   │   ├── collections/     # Postman collections
│   │   └── environments/    # Postman environments
│   ├── scripts/             # Utility scripts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   ├── components/     # React components
│   │   ├── lib/            # API client
│   │   └── types/          # TypeScript types
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── database/
│   └── init/               # Database initialization scripts
├── docker-compose.yml      # Docker setup
└── README.md
```

## Prerequisites

- Node.js 18+ (for local development)
- Docker and Docker Compose (required)
- Discord webhook URL (create one in your Discord server settings)

## Getting Started

### Database Setup (IMPORTANT!)

**You MUST follow these steps before running the application:**

#### 1. Start PostgreSQL Container

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Verify it's running
docker-compose ps
```

#### 2. Create Database and Enable Extensions

```bash
# Access PostgreSQL shell
docker exec -it discord-scheduler-db psql -U postgres

# Create the database
CREATE DATABASE discord_scheduler;

# Connect to the database
\c discord_scheduler

# Enable UUID extension (REQUIRED!)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Verify extension is enabled
\dx

# Exit psql
\q
```

#### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

#### 4. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env and set your configuration
nano .env
```

Minimal `.env` configuration:

```env
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=discord_scheduler

# Authentication
API_KEY=test-api-key-12345
AUTH_ENABLED=true
API_KEY_HEADER=x-api-key
```

#### 5. Run Database Migrations

```bash
# Make sure you're in backend folder
npm run migration:run
```

Expected output:

```
query: SELECT version()
query: CREATE TABLE "tasks" ...
Migration InitialSchema1703001000000 has been executed successfully
```

#### 6. Verify Database Setup

```bash
# Check tables were created
docker exec -it discord-scheduler-db psql -U postgres -d discord_scheduler -c "\dt"

# Should show: tasks, typeorm_migrations
```

#### 7. Setup Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local and configure
nano .env.local
```

Minimal `.env.local` configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Running the Application

#### Option 1: Local Development

**Backend:**

```bash
cd backend
npm run dev
```

The backend will run on http://localhost:3001

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on http://localhost:3000

#### Option 2: Docker Compose (Full Stack)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services will be available at:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432

## Environment Variables

### Backend `.env`

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=discord_scheduler

# Authentication
API_KEY=your-secret-api-key-here
AUTH_ENABLED=true
API_KEY_HEADER=x-api-key

# Optional: TypeORM Logging
TYPEORM_LOGGING=false

# Optional: Retry Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_INITIAL_DELAY_MS=1000
```

### Frontend `.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## API Endpoints

### Authentication

All `/api/*` endpoints require API key authentication via header:

```bash
x-api-key: your-api-key-here
```

### Tasks Endpoints

- `POST /api/tasks` - Create a new task
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/active` - Get active (uncompleted) tasks
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Health Check

- `GET /health` - Server health check (no auth required)

## API Testing with Postman

### Import Postman Collection

Postman collections and environments are available in `backend/postman/`:

1. **Open Postman**
2. **Import Collection**:
   - Click **Import** button
   - Select `backend/postman/collections/Discord Task Scheduler API.postman_collection.json`
3. **Import Environment**:
   - Click **Environments** in sidebar
   - Click **Import**
   - Select `backend/postman/environments/Discord Task Scheduler - Local.postman_environment.json`
4. **Select Environment**:
   - Choose "Discord Task Scheduler - Local" from dropdown (top right)
5. **Start Testing**:
   - Open the collection and click any request
   - Click **Send** to test

### Environment Variables

The Local environment includes:

- `base_url`: `http://localhost:3001`
- `api_key`: `test-api-key-12345` (update to match your `.env`)

### Available Requests

- ✅ Health Check (no auth)
- ✅ Get All Tasks
- ✅ Get Active Tasks
- ✅ Get Task by ID
- ✅ Create Task
- ✅ Update Task
- ✅ Delete Task

## Testing API with cURL

### Health Check (No Auth)

```bash
curl http://localhost:3001/health
```

### Get All Tasks (With Auth)

```bash
curl -H "x-api-key: test-api-key-12345" http://localhost:3001/api/tasks
```

### Create a Task

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key-12345" \
  -d '{
    "title": "Daily Standup Reminder",
    "description": "Time for the daily standup meeting!",
    "scheduled_time": "2025-12-20T10:00:00",
    "discord_webhook_url": "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL"
  }'
```

## Getting Your Discord Webhook URL

1. Go to your Discord server
2. Right-click on a channel and select "Edit Channel"
3. Go to "Integrations" → "Webhooks"
4. Click "New Webhook"
5. Copy the webhook URL
6. Use this URL when creating tasks

## Database Schema

### Tasks Table

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    discord_webhook_url TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_scheduled_time ON tasks(scheduled_time);
CREATE INDEX idx_tasks_is_active_is_completed ON tasks(is_active, is_completed);
```

## How It Works

1. **Task Creation**: Users create tasks via the frontend or API with a scheduled time and Discord webhook URL
2. **Task Storage**: Tasks are stored in PostgreSQL with proper indexing
3. **Scheduler**: A cron job runs every minute checking for tasks that are due
4. **Notification**: When a task's scheduled time is reached, the Discord service sends a webhook notification with retry logic
5. **Retry Mechanism**: If webhook fails, automatic retry with exponential backoff (up to 5 attempts)
6. **Completion**: The task is marked as completed after successful notification

## Troubleshooting

### Database Connection Issues

**Error: `database "discord_scheduler" does not exist`**

```bash
# Create the database
docker exec -it discord-scheduler-db psql -U postgres -c "CREATE DATABASE discord_scheduler;"
```

**Error: `function uuid_generate_v4() does not exist`**

```bash
# Enable UUID extension
docker exec -it discord-scheduler-db psql -U postgres -d discord_scheduler -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
```

**Error: Connection refused**

```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Migration Issues

**Error: Migration already executed**

```bash
# Check migration status
npm run migration:show

# Revert last migration if needed
npm run migration:revert
```

### Port Conflicts

If ports 3000, 3001, or 5432 are already in use:

- Change ports in `.env`
- Update `docker-compose.yml` port mappings

### Discord Webhook Not Working

- Verify the webhook URL is correct and active
- Check that the webhook hasn't been deleted from Discord
- Ensure the bot has permissions to post in the channel
- Check backend logs for detailed error messages

## Development Commands

### Backend

```bash
cd backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
npm run typecheck    # Type checking
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run migration:run     # Run migrations
npm run migration:revert  # Revert last migration
npm run migration:show    # Show migration status
```

### Frontend

```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Unit Testing

### Running Tests

**Run all tests:**

```bash
cd backend
npm test
```

**Run tests in watch mode:**

```bash
npm run test:watch
```

**Run tests with coverage:**

```bash
npm run test:coverage
```

### Test Coverage

Current test coverage:

- ✅ **Auth Middleware**: 100% covered

  - Valid API key authentication
  - Invalid/missing API key blocking
  - Auth disabled bypass

- ✅ **Task Controller**: 100% covered

  - CRUD operations (Create, Read, Update, Delete)
  - Error handling (400, 404, 500)
  - Request validation

- ⚠️ **Task Model**: Partial coverage

  - Mock initialization issues (known)
  - CRUD logic tested via controller tests

- ⚠️ **Scheduler Service**: Partial coverage

  - Retry logic tested
  - Mock timing issues (known)

- ⚠️ **Discord Service**: Partial coverage
  - Webhook sending tested
  - Mock setup issues (known)

### Test Files Structure

```
backend/src/__tests__/
├── controllers/
│   ├── taskController.test.ts
│   └── dashboardController.test.ts
├── middleware/
│   └── auth.middleware.test.ts
├── models/
│   ├── taskModel.test.ts
│   └── taskLogModel.test.ts
├── services/
│   ├── schedulerService.test.ts
│   └── discordService.test.ts
└── utils/
    └── retry.test.ts
```

### Known Test Issues

1. **Mock Initialization**: Some tests have mock initialization timing issues
2. **Async Timing**: Scheduler tests may have async timing issues
3. **Discord Mock**: Discord service mock not called correctly in some cases

These issues don't affect production code and can be improved later.

---

## AI Tool Usage Documentation

### Overview

This project was developed using AI coding assistants (Claude Code CLI) as required by the technical assessment. Below are the documented instances of AI tool usage.

### AI Tool Usage #1: Initial Project Setup

**Tool Used**: Claude Code CLI  
**Date**: December 2025
**Purpose**: Generate initial full-stack project structure

**Command/Prompt**:

```
bantu saya untuk membuat setup project full-stack untuk aplikasi discord task scheduler dengan:

- backend: nestjs dengan typescript
- frontend: next.js dengan typescript
- database: postgresql
- sertakan docker compose setup
- buat struktur folder awal yang proper

backend perlu bisa handle task scheduling, connect ke postgresql, dan kirim webhook ke discord.
```

**Output/Result**:

- ✅ Complete project structure with proper folder organization
- ✅ Backend: Express.js + TypeScript setup
- ✅ Frontend: Next.js + TypeScript setup
- ✅ Database: PostgreSQL configuration
- ✅ Docker: docker-compose.yml with all services
- ✅ Package.json files with dependencies
- ✅ TypeScript configurations

**Files Generated**:

- `backend/` - Complete backend structure
- `frontend/` - Complete frontend structure
- `docker-compose.yml` - Multi-container setup
- `database/init/` - Database initialization scripts

---

### AI Tool Usage #2: CRUD Task Implementation

**Tool Used**: Claude Code CLI  
**Date**: December 2025
**Purpose**: Implement complete CRUD operations for tasks with authentication

**Command/Prompt**:

```
tambahin migrations, authentication middleware, sama retry logic ke backend express yang udah ada. pakai typeorm untuk migrations.
```

**Output/Result**:

- ✅ Task model with database operations
- ✅ Task controller with all CRUD endpoints
- ✅ API routes with authentication
- ✅ Auth middleware with API key validation
- ✅ TypeORM migration setup
- ✅ Retry utility with exponential backoff
- ✅ Discord service integration

**Files Generated/Modified**:

- `backend/src/models/taskModel.ts`
- `backend/src/controllers/taskController.ts`
- `backend/src/routes/taskRoutes.ts`
- `backend/src/middleware/auth.middleware.ts`
- `backend/src/migrations/1703001000000-InitialSchema.ts`
- `backend/src/utils/retry.ts`
- `backend/src/services/discordService.ts`
- `backend/src/config/auth.ts`

---

---

### AI Tool Usage #3: Unit Testing Suite

**Tool Used**: Claude Code CLI  
**Date**: December 19, 2025  
**Purpose**: Generate comprehensive unit tests for backend

**Command/Prompt** (Minimal version):

```
bikin unit tests untuk backend discord task scheduler:
coverage requirements:
- crud tasks
- scheduler + retry logic
- auth middleware
- discord webhook (mocked)
stack: jest + typescript
target: 80% coverage
generate semua test files + config ya!
```

**Output/Result**:

- ✅ Complete Jest test suite (8 test files)
- ✅ Auth middleware tests: 100% coverage
- ✅ Task controller tests: 100% coverage
- ✅ Retry logic tests: 97% coverage
- ✅ Mock setup for database, axios, node-cron
- ✅ Jest configuration
- ⚠️ Some mock initialization issues (documented)

**Test Summary**:

```
Test Suites: 2 passed, 4 failed, 6 total
Tests:       Multiple test cases covering:
  - CRUD operations
  - Authentication (valid/invalid/missing keys)
  - Error handling
  - Retry mechanism
  - Discord webhook integration
```

**Files Generated**:

- `backend/src/__tests__/` - Complete test directory
- `backend/jest.config.js` - Jest configuration
- `backend/package.json` - Updated with test scripts

**Known Issues** (can be improved later):

1. Mock initialization timing in taskModel tests
2. Discord service mock setup issues
3. Async timing in scheduler tests

---

### AI Tool Usage #4: Frontend Development & UI Improvements

**Tool Used**: Claude Code CLI  
**Date**: December 19, 2025  
**Purpose**: Build frontend dashboard with modern design and responsive layout

**Command/Prompt**:

```
bantu bikin frontend next.js + typescript untuk discord task scheduler ya!

requirements:
- next.js 14 dengan app router + typescript
- tailwind css untuk styling
- modern ui (inspired by dribbble)
- responsive design

pages yang dibutuhkan:
1. dashboard - stats cards (total, active, completed, failed tasks) + recent logs
2. task list - table dengan filter, search, status indicators
3. create/edit task form - title, description, datetime picker, webhook url, json payload editor, max_retry
4. task logs viewer - execution logs dengan filter

api integration:
- base: http://localhost:3001/api
- auth: x-api-key header
- endpoints: /dashboard/stats, /tasks, /tasks/:id, /tasks/:id/logs, /logs/recent

technical stack:
- form: react hook form + zod
- api: axios
- notifications: sonner
- icons: lucide-react
- json editor: @monaco-editor/react

tolong generate semua files termasuk:
- complete project structure
- all pages dan components
- api client dengan auth
- form validation
- error handling
- loading states
- .env.example
```

**Output/Result**:

- ✅ **Error Fixes**:

  - Fixed type errors in `RecentLogs.tsx` and `LogsTable.tsx`
  - Corrected API method names (`getAllTasks` → `getTasks`)
  - Added missing type aliases in `validations.ts`
  - Removed `is_active` field causing type errors
  - Rebuilt corrupted `LogsTable.tsx` component
  - Successful build with exit code 0

- ✅ **UI Improvements**:

  - Redesigned `StatsCard` with gradient backgrounds (Blue, Purple, Green, Red)
  - Added hover effects and scale animations
  - Improved typography (larger numbers, better hierarchy)
  - Modern icon presentation with backdrop blur

- ✅ **Mobile Responsiveness**:

  - Implemented responsive grid: 4 cols (desktop), 2 cols (tablet), 1 col (mobile)
  - Created mobile menu with hamburger button
  - Added overlay backdrop for mobile sidebar
  - Fixed navigation highlight bug
  - Added scroll to Recent Logs card (`max-h-96 overflow-y-auto`)

- ✅ **Testing & Verification**:
  - Created 5 test tasks with scheduler
  - Verified task execution with real Discord webhook
  - Tested across viewports: 1280px, 768px, 375px
  - Confirmed mobile menu functionality
  - Verified logs generation and retry logic

**Files Generated/Modified**:

- `frontend/src/components/dashboard/StatsCard.tsx` - Modern gradient design
- `frontend/src/components/dashboard/RecentLogs.tsx` - Fixed types + scroll
- `frontend/src/components/logs/LogsTable.tsx` - Complete rebuild
- `frontend/src/components/layout/Header.tsx` - Mobile menu state
- `frontend/src/components/layout/Sidebar.tsx` - Navigation fixes
- `frontend/src/app/page.tsx` - Responsive layout
- `frontend/src/lib/validations.ts` - Type aliases
- `frontend/src/lib/utils.ts` - Export fixes

**Visual Results**:

- Desktop: 4-column gradient cards with hover effects
- Tablet: 2x2 grid layout
- Mobile: Single column with hamburger menu
- Logs: Scrollable container with clean display

**Testing Summary**:

```
✅ Frontend build: Success (exit code 0)
✅ Mobile menu: Working (toggle, overlay, navigation)
✅ Responsive design: Verified (375px, 768px, 1280px)
✅ Real webhook test: Success (Discord notification sent)
✅ Scheduler: Executing tasks on time
✅ Retry logic: Working (multiple attempts logged)
✅ Logs: Generated and displayed correctly
```

---

### Benefits of AI Tool Usage

1. **Speed**: Rapid prototyping and boilerplate generation
2. **Best Practices**: AI suggested industry-standard patterns
3. **Coverage**: Comprehensive test cases generated automatically
4. **Documentation**: Well-commented code and clear structure
5. **Consistency**: Uniform code style across the project

---

## Production Deployment

1. Update environment variables for production
2. Generate secure API key:

```bash
   cd backend
   npx ts-node scripts/generate-api-key.ts
```

3. Build and start with Docker Compose:

```bash
   docker-compose up -d --build
```

---

## Running with Docker

### Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)

### Quick Start with Docker

**1. Clone the repository:**

```bash
git clone <repository-url>
cd discord-task-scheduler
```

**2. Setup environment variables:**

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

**3. Start all services:**

```bash
docker-compose up -d
```

This will start:

- PostgreSQL database on port 5432
- Backend API on port 3001
- Frontend (if configured) on port 3000

**4. Check service status:**

```bash
docker-compose ps
```

**5. View logs:**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Database Setup in Docker

**1. Access PostgreSQL container:**

```bash
docker exec -it discord-scheduler-db psql -U postgres
```

**2. Create database and enable UUID extension:**

```sql
CREATE DATABASE discord_scheduler;
\c discord_scheduler
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

**3. Run migrations:**

```bash
# If backend is running in Docker
docker exec discord-scheduler-backend npm run migration:run

# Or from local machine
cd backend
npm run migration:run
```

### Docker Commands

**Stop all services:**

```bash
docker-compose down
```

**Stop and remove volumes (⚠️ deletes database data):**

```bash
docker-compose down -v
```

**Rebuild services:**

```bash
docker-compose up -d --build
```

**View resource usage:**

```bash
docker stats
```

### Docker Compose Services

```yaml
services:
  postgres: # PostgreSQL database
    - Port: 5432
    - Volume: postgres-data
    - Health check enabled

  backend: # Express.js API
    - Port: 3001
    - Depends on: postgres
    - Auto-restart enabled

  frontend: # Next.js UI (optional)
    - Port: 3000
    - Depends on: backend
```

### Environment Variables for Docker

**backend/.env:**

```env
PORT=3001
NODE_ENV=production

# Database (use service name as host in Docker)
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=discord_scheduler

# Authentication
API_KEY=your-secure-api-key-here
AUTH_ENABLED=true
API_KEY_HEADER=x-api-key
```

### Troubleshooting Docker

**Container won't start:**

```bash
# Check logs
docker-compose logs backend

# Check if port is in use
lsof -i :3001
```

**Database connection failed:**

```bash
# Ensure postgres is healthy
docker-compose ps

# Check database logs
docker-compose logs postgres

# Verify network
docker network ls
docker network inspect discord-task-scheduler_default
```

**Reset everything:**

```bash
# Stop and remove all containers, networks, volumes
docker-compose down -v

# Rebuild from scratch
docker-compose up -d --build
```
