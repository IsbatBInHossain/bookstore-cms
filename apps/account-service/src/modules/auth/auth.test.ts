import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import type { Express } from 'express';
import { createServer } from '../../core/server.js';
import { prisma as testPrisma } from '../../test/setup.js';

// Helper for cleaning DB between tests
import '../../test/utils.js';
import { hashPassword } from '../../shared/utils/password.js';
import { createTestUser } from '../../test/helpers.js';
import { RoleName } from '../../generated/prisma/index.js';

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
    // Arrange: Create a user in the database to set up the conflict.
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
      email: 'validation.test@example.com',
      password: 'StrongPassword123!',
      confirmPassword: 'WrongPassword123!',
      firstName: 'Validation',
      lastName: 'Test',
    };

    // Act
    const response = await supertest(app)
      .post('/api/v1/auth/register')
      .send(mismatchedUserPayload);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toContain('Validation failed');
  });

  it('should log in a registered user successfully and return tokens', async () => {
    // Arrange: Create a user with profile in the database first
    const userOptions = {
      email: 'login.test@example.com',
      password: 'testpassword',
      roleName: RoleName.CUSTOMER,
      profile: {
        firstName: 'Login',
        lastName: 'Test',
      },
    };

    await createTestUser(userOptions, testPrisma);

    const userDataPayload = {
      email: userOptions.email,
      password: userOptions.password,
    };

    // Act
    const response = await supertest(app)
      .post('/api/v1/auth/login')
      .send(userDataPayload);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Logged in Successfully');
    expect(response.body.data).toMatchObject({
      user: {
        id: expect.any(String),
        email: userOptions.email,
        role: { name: userOptions.roleName },
        profile: userOptions.profile,
      },
      tokens: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      },
    });
  });

  it('should fail to log in with an incorrect password', async () => {
    // Arrange: Create a user in the database first
    const userOptions = {
      email: 'incorrect.test@example.com',
      password: 'correctpassword',
      roleName: RoleName.CUSTOMER,
      profile: {
        firstName: 'Incorrect',
        lastName: 'Test',
      },
    };

    await createTestUser(userOptions, testPrisma);

    const userDataPayload = {
      email: userOptions.email,
      password: 'incorrectpassword',
    };

    // Act
    const response = await supertest(app)
      .post('/api/v1/auth/login')
      .send(userDataPayload);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Invalid email or password');
  });

  it('should fail to log in with a non-existent email', async () => {
    // Arrange
    const userDataPayload = {
      email: 'nonexistant.test@example.com',
      password: 'anyPassword',
    };

    // Act
    const response = await supertest(app)
      .post('/api/v1/auth/login')
      .send(userDataPayload);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Invalid email or password');
  });

  it('should issue a new token pair for a valid refresh token', async () => {
    // Arrange: Create and log in a user to get a valid refresh token
    const userOptions = {
      email: 'vaild.token@example.com',
      password: 'somepassword',
      roleName: RoleName.CUSTOMER,
      profile: {
        firstName: 'Valid',
        lastName: 'Token',
      },
    };

    await createTestUser(userOptions, testPrisma);

    const userDataPayload = {
      email: userOptions.email,
      password: userOptions.password,
    };

    // Login to get a valid refresh token
    const loginResponse = await supertest(app)
      .post('/api/v1/auth/login')
      .send(userDataPayload);

    const refreshToken = loginResponse.body.data.tokens.refreshToken;

    // Act
    const response = await supertest(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Successfully Refreshed Tokens');
    expect(response.body.data).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('should fail to refresh tokens with an invalid refresh token', async () => {
    // Arrange
    const invalidRefreshToken = 'Invalid.Refresh.Token.Here';

    // Act
    const response = await supertest(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: invalidRefreshToken });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Invalid or expired refresh token');
  });

  it('should invalidate the refresh token on logout', async () => {
    // Arrange: Create and log in a user to get a valid refresh token
    const userOptions = {
      email: 'logout.test@example.com',
      password: 'logoutpassword',
      roleName: RoleName.CUSTOMER,
      profile: {
        firstName: 'Logout',
        lastName: 'Test',
      },
    };

    const testUser = await createTestUser(userOptions, testPrisma);

    const userDataPayload = {
      email: userOptions.email,
      password: userOptions.password,
    };

    const loginResponse = await supertest(app)
      .post('/api/v1/auth/login')
      .send(userDataPayload);

    const refreshToken = loginResponse.body.data.tokens.refreshToken;

    // Act: Logout to invalidate the refresh token
    const response = await supertest(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken });

    // Assert
    expect(response.status).toBe(204);

    // Check the db to see if the token is invalidated
    const storedToken = await testPrisma.refreshToken.findFirst({
      where: { userId: testUser!.id },
    });

    expect(storedToken).toBe(null);
  });
});
