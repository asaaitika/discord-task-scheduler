import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'discord_scheduler',

  // CRITICAL: Empty entities array - we're not using TypeORM for queries
  entities: [],

  // Only migrations are active
  migrations: ['src/migrations/*.ts'],

  // Migration table configuration
  migrationsTableName: 'typeorm_migrations',

  // Logging for debugging
  logging: process.env.NODE_ENV === 'development',

  // Don't auto-sync schemas (we control this via migrations)
  synchronize: false,
});
