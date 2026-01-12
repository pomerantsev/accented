import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const databaseUrl = process.env.NETLIFY_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('NETLIFY_DATABASE_URL environment variable is not set');
}

const client = postgres(databaseUrl);

export const db = drizzle(client, { schema });
