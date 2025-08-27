import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import type { Express } from 'express';
import { createServer } from '../../core/server.js';
import { prisma as testPrisma } from '../../test/setup.js';

// Helper for cleaning DB between tests
import '../../test/utils.js';
import { hashPassword } from '../../shared/utils/password.js';

let app: Express;

beforeAll(() => {
  app = createServer(testPrisma);
});

describe('Users API', () => {
  it('should return user data for a valid access token', async () => {
    // Arrange: Create and log in a user to get a valid access token
    const customerRole = await testPrisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    });
    await testPrisma.$transaction(async tx => {
      const testUser = await tx.user.create({
        data: {
          email: 'userprofile.test@example.com',
          passwordHash: await hashPassword('profilepassword'),
          roleId: customerRole!.id,
        },
      });

      await tx.userProfile.create({
        data: {
          firstName: 'UserProfile',
          lastName: 'Test',
          userId: testUser.id,
        },
      });
    });

    const loginResponse = await supertest(app).post('/api/v1/auth/login').send({
      email: 'userprofile.test@example.com',
      password: 'profilepassword',
    });

    const accessToken = loginResponse.body.data.tokens.accessToken;
    const authToken = `Bearer ${accessToken}`;

    // Act
    const response = await supertest(app)
      .get('/api/v1/users/me')
      .set('Authorization', authToken);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toMatchObject({
      id: expect.any(String),
      email: 'userprofile.test@example.com',
      role: { name: 'CUSTOMER' },
      profile: {
        firstName: 'UserProfile',
        lastName: 'Test',
      },
    });
  });

  it('should return a 401 error for an invalid access token', async () => {
    // Arrange: Create an user in the database first
    const customerRole = await testPrisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    });

    await testPrisma.user.create({
      data: {
        email: 'invalid.token@example.com',
        passwordHash: await hashPassword('somepassword'),
        roleId: customerRole!.id,
      },
    });

    const invalidAuth = 'Bearer Invalid.Token.Here';
    // Login to get a valid token
    await supertest(app).post('/api/v1/auth/login').send({
      email: 'invalid.token@example.com',
      password: 'somepassword',
    });

    // Act
    const response = await supertest(app)
      .get('/api/v1/users/me')
      .set('Authorization', invalidAuth);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Unauthorized');
  });
});
