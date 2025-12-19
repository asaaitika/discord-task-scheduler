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
    "scheduled_time": "2024-12-20T10:00:00",
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

## License

MIT

---

## AI Tool Usage Documentation

This project was developed with assistance from AI coding tools as part of the technical assessment requirements.

### AI Tool Usage Instance #1: Initial Project Setup
**Tool Used**: Claude Code CLI  
**Purpose**: Generate initial full-stack project structure  
**Command**: "Bantu saya setup project full-stack untuk aplikasi Discord task scheduler dengan Express.js TypeScript backend, Next.js TypeScript frontend, PostgreSQL database, dan Docker Compose setup"  
**Result**: Generated complete project structure with proper folder organization, package.json files, and Docker configuration

### AI Tool Usage Instance #2: Database Migrations & Authentication
**Tool Used**: Claude Code CLI  
**Purpose**: Add TypeORM migrations, API authentication, and retry logic  
**Command**: "Tambahin migrations, authentication middleware, sama retry logic ke backend Express yang udah ada. Pakai TypeORM untuk migrations."  
**Result**: Generated migration files, authentication middleware, and retry utility with exponential backoff

**Files Generated/Modified**:
- `backend/src/config/typeorm.config.ts`
- `backend/src/middleware/auth.middleware.ts`
- `backend/src/migrations/1703001000000-InitialSchema.ts`
- `backend/src/utils/retry.ts`
- `backend/scripts/generate-api-key.ts`
- `backend/src/config/auth.ts`

---

**Need help?** Check the troubleshooting section or review the backend logs for detailed error messages.