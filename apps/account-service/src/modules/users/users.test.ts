import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import type { Express } from 'express';
import { createServer } from '../../core/server.js';
import { prisma as testPrisma } from '../../test/setup.js';

// Helper for cleaning DB between tests
import '../../test/utils.js';
import { hashPassword } from '../../shared/utils/password.js';
import e from 'express';
import { createTestUser } from '../../test/helpers.js';
import { RoleName } from '../../generated/prisma/index.js';

let app: Express;

beforeAll(() => {
  app = createServer(testPrisma);
});

describe('Users API', () => {
  it('should return user data for a valid access token', async () => {
    // Arrange: Create and log in a user to get a valid access token
    const userOptions = {
      email: 'userprofile.test@example.com',
      password: 'profilepassword',
      roleName: RoleName.CUSTOMER,
      profile: {
        firstName: 'Logout',
        lastName: 'Test',
      },
    };

    await createTestUser(userOptions, testPrisma);

    const userDataPayload = {
      email: userOptions.email,
      password: userOptions.password,
    };

    const loginResponse = await supertest(app)
      .post('/api/v1/auth/login')
      .send(userDataPayload);

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
      email: userOptions.email,
      role: { name: userOptions.roleName },
      profile: userOptions.profile,
    });
  });

  it('should return a 401 error for an invalid access token', async () => {
    // Arrange

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

  it('should return a updated user profile after updating profile data', async () => {
    // Arrange: Create and log in a user to get a valid access token
    const customerRole = await testPrisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    });
    await testPrisma.$transaction(async tx => {
      const testUser = await tx.user.create({
        data: {
          email: 'user.update@example.com',
          passwordHash: await hashPassword('updatepassword'),
          roleId: customerRole!.id,
        },
      });
      await tx.userProfile.create({
        data: {
          firstName: 'User',
          lastName: 'Update',
          userId: testUser.id,
        },
      });
    });

    const loginResponse = await supertest(app).post('/api/v1/auth/login').send({
      email: 'user.update@example.com',
      password: 'updatepassword',
    });

    const accessToken = loginResponse.body.data.tokens.accessToken;
    const authToken = `Bearer ${accessToken}`;

    // Act: Update the user's profile
    const updateData = {
      firstName: 'Updated',
      lastName: 'User',
      phone: '1234567890',
    };
    const updateResponse = await supertest(app)
      .put('/api/v1/users/me')
      .set('Authorization', authToken)
      .send(updateData);

    // Assert
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.status).toBe('success');
    expect(updateResponse.body.data).toMatchObject({
      id: expect.any(String),
      email: 'user.update@example.com',
      role: { name: 'CUSTOMER' },
      profile: {
        firstName: 'Updated',
        lastName: 'User',
        phone: '1234567890',
      },
    });
  });

  it('should create a new profile if profile is missing', async () => {
    // Arrange: Create an user in the database first
    const userOptions = {
      email: 'missing.profile@example.com',
      password: 'profilepassword',
      roleName: RoleName.CUSTOMER,
    };

    await createTestUser(userOptions, testPrisma);

    const userDataPayload = {
      email: userOptions.email,
      password: userOptions.password,
    };

    const loginResponse = await supertest(app)
      .post('/api/v1/auth/login')
      .send(userDataPayload);

    const authToken = `Bearer ${loginResponse.body.data.tokens.accessToken}`;

    // Act
    const response = await supertest(app)
      .put('/api/v1/users/me')
      .set('Authorization', authToken)
      .send({
        firstName: 'Missing',
        lastName: 'Profile',
        phone: '1234567890',
      });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toMatchObject({
      id: expect.any(String),
      email: 'missing.profile@example.com',
      role: { name: 'CUSTOMER' },
      profile: {
        firstName: 'Missing',
        lastName: 'Profile',
        phone: '1234567890',
      },
    });

    // Verify in DB
    const userProfileInDb = await testPrisma.userProfile.findUnique({
      where: { userId: response.body.data.id },
    });

    expect(userProfileInDb).not.toBeNull();
  });

  it('should return 401 when updating profile without a valid token', async () => {
    // Arrange: Create an user in the database first
    const userOptions = {
      email: 'invalid.token@example.com',
      password: 'somepassword',
      roleName: RoleName.CUSTOMER,
    };
    await createTestUser(userOptions, testPrisma);

    const invalidToken = 'Bearer Invalid.Token.Here';

    // Act
    const response = await supertest(app)
      .put('/api/v1/users/me')
      .set('Authorization', invalidToken)
      .send({
        firstName: 'ShouldNot',
        lastName: 'Work',
        phone: '0000000000',
      });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Unauthorized');
  });

  it('should return 400 when updating profile with invalid phone number', async () => {
    // Arrange: Create and log in a user to get a valid access token
    const userOptions = {
      email: 'invalid.token@example.com',
      password: 'somepassword',
      roleName: RoleName.CUSTOMER,
    };
    await createTestUser(userOptions, testPrisma);
    const userDataPayload = {
      email: userOptions.email,
      password: userOptions.password,
    };

    const loginResponse = await supertest(app)
      .post('/api/v1/auth/login')
      .send(userDataPayload);

    const authToken = `Bearer ${loginResponse.body.data.tokens.accessToken}`;

    // Act
    const response = await supertest(app)
      .put('/api/v1/users/me')
      .set('Authorization', authToken)
      .send({
        firstName: 'Invalid123',
        phone: 'NotAPhoneNumber!',
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Validation failed');
  });
});
