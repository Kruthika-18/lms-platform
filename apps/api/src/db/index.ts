import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Connection pool for queries
const queryClient = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

// Separate migration client (single connection)
export const migrationClient = postgres(connectionString, { max: 1 });

export const db = drizzle(queryClient, { schema, logger: process.env.NODE_ENV === 'development' });

export type DB = typeof db;
