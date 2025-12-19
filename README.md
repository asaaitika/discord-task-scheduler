# Discord Task Scheduler

A full-stack application for scheduling tasks and sending automated notifications to Discord via webhooks.

## Tech Stack

- **Backend**: Express.js with TypeScript
- **Frontend**: Next.js with TypeScript
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
- **Task Scheduling**: node-cron

## Features

- Create, read, update, and delete scheduled tasks
- Automatic task execution based on scheduled time
- Discord webhook notifications when tasks are due
- PostgreSQL database for persistent storage
- RESTful API architecture
- Modern React frontend with Next.js

## Project Structure

```
discord-task-scheduler/
├── backend/                  # Express.js backend
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (Discord, Scheduler)
│   │   ├── types/           # TypeScript types
│   │   └── index.ts         # Entry point
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
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
└── README.md
```

## Prerequisites

- Node.js 20+ (for local development)
- Docker and Docker Compose (for containerized setup)
- Discord webhook URL (create one in your Discord server settings)

## Getting Started

### Option 1: Local Development

#### 1. Set up PostgreSQL

Start PostgreSQL using Docker:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This will start a PostgreSQL instance on port 5432.

#### 2. Set up Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend will run on http://localhost:3001

#### 3. Set up Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend will run on http://localhost:3000

### Option 2: Docker Compose (Full Stack)

Run the entire stack with Docker Compose:

```bash
# Copy environment file
cp .env.example .env

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

### Root `.env`

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=discord_scheduler
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

### Backend `.env`

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=discord_scheduler
```

### Frontend `.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## API Endpoints

### Tasks

- `POST /api/tasks` - Create a new task
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/active` - Get active (uncompleted) tasks
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Health Check

- `GET /health` - Server health check

## Creating a Task

Send a POST request to `/api/tasks` with the following body:

```json
{
  "title": "Daily Standup Reminder",
  "description": "Time for the daily standup meeting!",
  "scheduled_time": "2024-12-19T10:00:00",
  "discord_webhook_url": "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"
}
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
    scheduled_time TIMESTAMP NOT NULL,
    discord_webhook_url TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## How It Works

1. **Task Creation**: Users create tasks via the frontend or API with a scheduled time and Discord webhook URL
2. **Task Storage**: Tasks are stored in PostgreSQL
3. **Scheduler**: A cron job runs every minute checking for tasks that are due
4. **Notification**: When a task's scheduled time is reached, the Discord service sends a webhook notification
5. **Completion**: The task is marked as completed after the notification is sent

## Development

### Backend Development

```bash
cd backend
npm run dev        # Start development server
npm run build      # Build TypeScript
npm run typecheck  # Type checking
```

### Frontend Development

```bash
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
```

## Production Deployment

1. Update environment variables for production
2. Build and start with Docker Compose:

```bash
docker-compose up -d --build
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify the database name exists

### Port Conflicts

- Change ports in `.env` if default ports are already in use
- Update `docker-compose.yml` port mappings accordingly

### Discord Webhook Not Working

- Verify the webhook URL is correct
- Check that the webhook hasn't been deleted from Discord
- Ensure the bot has permissions to post in the channel

## License

MIT
