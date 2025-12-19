import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/taskRoutes';
import schedulerService from './services/schedulerService';
import pool from './config/database';
import { retryWithExponentialBackoff } from './utils/retry';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', taskRoutes);

async function testDatabaseConnection(): Promise<void> {
  await retryWithExponentialBackoff(
    async () => {
      const result = await pool.query('SELECT NOW()');
      console.log('Database connection established at:', result.rows[0].now);
    },
    {
      maxRetries: 5,
      initialDelayMs: 2000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['ECONNREFUSED', 'ENOTFOUND'],
    }
  );
}

async function startServer() {
  try {
    // Test database connection with retry logic
    console.log('Connecting to database...');
    await testDatabaseConnection();
    console.log('Database connection successful');

    // Start the scheduler
    schedulerService.start();

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API endpoint: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Please check your database connection and try again');
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  schedulerService.stop();
  pool.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  schedulerService.stop();
  pool.end();
  process.exit(0);
});

startServer();
