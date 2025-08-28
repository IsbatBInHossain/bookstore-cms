import { describe, it, expect, beforeAll } from 'vitest';
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

  it('should fetch all users for admin user', async () => {
    // Arrange: Create and log in an admin user to get a valid access token
    const adminUserOptions = {
      email: 'fetch.users@example.com',
      password: 'adminpassword',
      roleName: RoleName.ADMIN,
    };

    await createTestUser(adminUserOptions, testPrisma);

    const loginResponse = await supertest(app).post('/api/v1/auth/login').send({
      email: adminUserOptions.email,
      password: adminUserOptions.password,
    });

    const authToken = `Bearer ${loginResponse.body.data.tokens.accessToken}`;

    // Act
    const response = await supertest(app)
      .get('/api/v1/users')
      .set('Authorization', authToken);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toMatchObject([
      {
        id: expect.any(String),
        email: adminUserOptions.email,
        role: { name: adminUserOptions.roleName },
      },
    ]);
  });

  it('should return 403 when a non-admin user tries to fetch all users', async () => {
    // Arrange: Create and log in a non-admin user to get a valid access token
    const customerUserOptions = {
      email: 'nonadmin.user@example.com',
      password: 'userpassword',
      roleName: RoleName.CUSTOMER,
    };

    await createTestUser(customerUserOptions, testPrisma);

    const loginResponse = await supertest(app).post('/api/v1/auth/login').send({
      email: customerUserOptions.email,
      password: customerUserOptions.password,
    });

    const authToken = `Bearer ${loginResponse.body.data.tokens.accessToken}`;

    // Act
    const response = await supertest(app)
      .get('/api/v1/users')
      .set('Authorization', authToken);

    // Assert
    expect(response.status).toBe(403);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Forbidden');
  });

  it('should update a user role when requested by an admin', async () => {
    // Arrange: Create and log in an admin user to get a valid access token
    const adminUserOptions = {
      email: 'update.role@example.com',
      password: 'adminpassword',
      roleName: RoleName.ADMIN,
    };

    await createTestUser(adminUserOptions, testPrisma);

    const loginResponse = await supertest(app).post('/api/v1/auth/login').send({
      email: adminUserOptions.email,
      password: adminUserOptions.password,
    });

    const authToken = `Bearer ${loginResponse.body.data.tokens.accessToken}`;

    // Create a new user to update role
    const userOptions = {
      email: 'update.user@example.com',
      password: 'somepassword',
      roleName: RoleName.CUSTOMER,
      profile: {
        firstName: 'Update',
        lastName: 'Role',
      },
    };

    const user = await createTestUser(userOptions, testPrisma);

    // Act
    const response = await supertest(app)
      .put(`/api/v1/users/${user.id}/role`)
      .set('Authorization', authToken)
      .send({
        role: 'manager',
      });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Successfully updated the user role');
    expect(response.body.data).toMatchObject({
      id: expect.any(String),
      email: userOptions.email,
      role: { name: RoleName.MANAGER },
      profile: userOptions.profile,
    });
  });

  it('should return 400 when updating role with invalid role name', async () => {
    // Arrange: Create and log in an admin user to get a valid access token
    const adminUserOptions = {
      email: 'invalid.role@example.com',
      password: 'adminpassword',
      roleName: RoleName.ADMIN,
    };

    await createTestUser(adminUserOptions, testPrisma);

    const loginResponse = await supertest(app).post('/api/v1/auth/login').send({
      email: adminUserOptions.email,
      password: adminUserOptions.password,
    });

    const authToken = `Bearer ${loginResponse.body.data.tokens.accessToken}`;

    // Create a new user to update role
    const userOptions = {
      email: 'update.user@example.com',
      password: 'somepassword',
      roleName: RoleName.CUSTOMER,
      profile: {
        firstName: 'Update',
        lastName: 'Role',
      },
    };

    const user = await createTestUser(userOptions, testPrisma);

    // Act
    const response = await supertest(app)
      .put(`/api/v1/users/${user.id}/role`)
      .set('Authorization', authToken)
      .send({
        role: 'invalid_role',
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Invalid role type');
  });

  it('should return 403 when a non-admin user tries to update a user role', async () => {
    // Arrange: Create and login non admin user
    const nonAdminUserOptions = {
      email: 'non.admin@example.com',
      password: 'nonadminpassword',
      role: RoleName.CUSTOMER,
    };

    await createTestUser(nonAdminUserOptions, testPrisma);

    const loginResponse = await supertest(app).post('/api/v1/auth/login').send({
      email: nonAdminUserOptions.email,
      password: nonAdminUserOptions.password,
    });

    const authToken = `Bearer ${loginResponse.body.data.tokens.accessToken}`;

    // Create a new user to update role
    const userOptions = {
      email: 'test.user@example.com',
      password: 'somepassword',
      roleName: RoleName.CUSTOMER,
      profile: {
        firstName: 'Non',
        lastName: 'Admin',
      },
    };

    const user = await createTestUser(userOptions, testPrisma);

    // Act
    const response = await supertest(app)
      .put(`/api/v1/users/${user.id}/role`)
      .set('Authorization', authToken)
      .send({
        role: 'manager',
      });

    // Assert
    expect(response.status).toBe(403);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Forbidden');
  });

  it('should return 404 when updating role of non-existent user', async () => {
    // Arrange: Create and log in an admin user to get a valid access token
    const adminUserOptions = {
      email: 'non.existing@example.com',
      password: 'adminpassword',
      roleName: RoleName.ADMIN,
    };

    await createTestUser(adminUserOptions, testPrisma);

    const loginResponse = await supertest(app).post('/api/v1/auth/login').send({
      email: adminUserOptions.email,
      password: adminUserOptions.password,
    });

    const authToken = `Bearer ${loginResponse.body.data.tokens.accessToken}`;
    const invalidUserId = 'invalid-user-id';

    // Act
    const response = await supertest(app)
      .put(`/api/v1/users/${invalidUserId}/role`)
      .set('Authorization', authToken)
      .send({
        role: 'manager',
      });

    // Assert
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('User with given id not found');
  });

  it('should return 403 when updating own role', async () => {
    // Arrange: Create and login non admin user
    const adminUserOptions = {
      email: 'self.update@example.com',
      password: 'adminpassword',
      roleName: RoleName.ADMIN,
    };

    const admin = await createTestUser(adminUserOptions, testPrisma);

    const loginResponse = await supertest(app).post('/api/v1/auth/login').send({
      email: adminUserOptions.email,
      password: adminUserOptions.password,
    });

    const authToken = `Bearer ${loginResponse.body.data.tokens.accessToken}`;

    // Act
    const response = await supertest(app)
      .put(`/api/v1/users/${admin.id}/role`)
      .set('Authorization', authToken)
      .send({
        role: 'customer',
      });

    // Assert
    expect(response.status).toBe(403);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Changing your own role is not allowed');
  });
});
