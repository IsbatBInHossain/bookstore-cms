import { beforeAll, afterAll } from 'vitest';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { PrismaClient } from '../generated/prisma/index.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

let container: StartedPostgreSqlContainer;
export let prisma: PrismaClient;

beforeAll(async () => {
  console.log('Setting up test environment...');

  // 1. Start container
  container = await new PostgreSqlContainer('postgres:16-alpine').start();

  // 2. Build DATABASE_URL
  process.env.DATABASE_URL = container.getConnectionUri();

  // 3. Apply migrations
  console.log('Applying migrations...');
  await execAsync('pnpm prisma migrate deploy', {
    env: { ...process.env }, // forward env so DATABASE_URL is available
  });

  // 4. Seed database
  console.log('Seeding database...');
  await execAsync('pnpm prisma db seed', {
    env: { ...process.env },
  });

  // 5. Init Prisma client (after schema is in place)
  prisma = new PrismaClient();

  console.log('Test environment ready.');
});

afterAll(async () => {
  console.log('Tearing down test environment...');

  await prisma?.$disconnect();
  await container?.stop();

  console.log('Test environment torn down.');
});
