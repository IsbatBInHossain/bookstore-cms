import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import type { Express } from 'express';
import { createServer } from '../../core/server.js';
import { prisma as testPrisma } from '../../test/setup.js';

// This helper will now clean our TEST database
import '../../test/utils.js';
import { hashPassword } from '../../shared/utils/password.js';

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

  it('should fail to register if email is already taken', async () => {
    // Arrange: Create a user in the database FIRST to set up the conflict.
    const customerRole = await testPrisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    });
    await testPrisma.user.create({
      data: {
        email: 'existing.user@example.com',
        passwordHash: await hashPassword('somepassword'),
        roleId: customerRole!.id,
      },
    });

    const duplicateUserPayload = {
      email: 'existing.user@example.com', // This email now exists
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
      firstName: 'Another',
      lastName: 'User',
    };

    // Act
    const response = await supertest(app)
      .post('/api/v1/auth/register')
      .send(duplicateUserPayload);

    // Assert: HTTP Response
    expect(response.status).toBe(409);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toContain(
      'A user with this email already exists'
    );
  });

  it('should fail with a validation error for mismatched passwords', async () => {
    // Arrange
    const mismatchedUserPayload = {
      email: 'existing.user@example.com',
      password: 'StrongPassword123!',
      confirmPassword: 'WrongPassword123!',
      firstName: 'Another',
      lastName: 'User',
    };

    // Act
    const response = await supertest(app)
      .post('/api/v1/auth/register')
      .send(mismatchedUserPayload);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toContain('Validation failed');
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0]).toMatchObject({
      field: 'body.confirmPassword',
      message: 'Passwords do not match',
    });
  });
});
