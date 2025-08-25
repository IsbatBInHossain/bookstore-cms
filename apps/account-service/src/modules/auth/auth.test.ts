import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import type { Express } from 'express';
import { createServer } from '../../core/server.js';
import { prisma as testPrisma } from '../../test/setup.js';

// This helper will now clean our TEST database
import '../../test/utils.js';

let app: Express;

beforeAll(() => {
  // Inject the TEST prisma client into app instance
  app = createServer(testPrisma);
});

describe('Authentication API', () => {
  it('should register a new user successfully with valid data', async () => {
    // Arrange
    const newUser = {
      email: 'test.user@example.com',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
      firstName: 'Test',
      lastName: 'User',
    };

    // Act
    const response = await supertest(app)
      .post('/api/v1/auth/register')
      .send(newUser);

    // Assert: HTTP Response
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.email).toBe(newUser.email);
    expect(response.body.data).not.toHaveProperty('passwordHash');

    // Assert: Database State
    const dbUser = await testPrisma.user.findUnique({
      where: { email: newUser.email },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.email).toBe(newUser.email);
  });
});
