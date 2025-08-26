import { beforeAll, afterAll } from 'vitest';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { PrismaClient } from '../generated/prisma/client.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { seedDatabase } from '../../src/shared/utils/seed.js';

const execAsync = promisify(exec);

let container: StartedPostgreSqlContainer;
export let prisma: PrismaClient;

beforeAll(async () => {
  console.log('Setting up test environment...');
  process.env.NODE_ENV = 'test';

  container = await new PostgreSqlContainer('postgres:17-alpine')
    .withExposedPorts({ container: 5432, host: 15433 })
    .start();

  process.env.DATABASE_URL = container.getConnectionUri();

  try {
    // Apply migrations
    console.log('Applying migrations...');
    await execAsync('pnpm prisma migrate deploy', { env: { ...process.env } });
  } catch (error) {
    console.error('Failed to generate or apply migrations:', error);
    // Force exit if migrations fail, because tests are guaranteed to be invalid.
    process.exit(1);
  }

  // Instantiate prisma client
  prisma = new PrismaClient();

  console.log('Seeding database via direct function call...');
  await seedDatabase(prisma);

  console.log('Test environment ready.');
});

afterAll(async () => {
  console.log('Tearing down test environment...');
  await prisma?.$disconnect();
  await container?.stop();
  console.log('Test environment torn down.');
});
