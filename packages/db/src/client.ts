import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

const url = process.env['DATABASE_URL'];
if (!url) throw new Error('DATABASE_URL is not set');

// Connection pool — max 10 connections
const sql = postgres(url, { max: 10 });

export const db = drizzle(sql, { schema });

export type Database = typeof db;
