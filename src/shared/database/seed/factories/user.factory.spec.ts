import { describe, it, expect } from 'bun:test';
import { UserFactory } from './user.factory';

describe('UserFactory', () => {
  describe('create', () => {
    it('should create user data with default values', () => {
      const userData = UserFactory.create();

      expect(userData).toHaveProperty('id');
      expect(userData).toHaveProperty('name');
      expect(userData).toHaveProperty('email');
      expect(userData).toHaveProperty('createdAt');
      expect(userData).toHaveProperty('updatedAt');

      expect(typeof userData.id).toBe('string');
      expect(typeof userData.name).toBe('string');
      expect(typeof userData.email).toBe('string');
      expect(userData.createdAt).toBeInstanceOf(Date);
      expect(userData.updatedAt).toBeInstanceOf(Date);
    });

    it('should create user data with custom values', () => {
      const customData = {
        id: 'custom-id',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const userData = UserFactory.create(customData);

      expect(userData.id).toBe(customData.id);
      expect(userData.name).toBe(customData.name);
      expect(userData.email).toBe(customData.email);
    });

    it('should create user data with partial overrides', () => {
      const overrides = { name: 'Jane Doe' };
      const userData = UserFactory.create(overrides);

      expect(userData.name).toBe(overrides.name);
      expect(userData.email).toBeDefined();
      expect(userData.id).toBeDefined();
    });
  });

  describe('createMany', () => {
    it('should create multiple user data objects', () => {
      const count = 5;
      const usersData = UserFactory.createMany(count);

      expect(usersData).toHaveLength(count);
      usersData.forEach((userData) => {
        expect(userData).toHaveProperty('id');
        expect(userData).toHaveProperty('name');
        expect(userData).toHaveProperty('email');
      });
    });

    it('should create multiple users with shared overrides', () => {
      const count = 3;
      const overrides = { name: 'Test User' };
      const usersData = UserFactory.createMany(count, overrides);

      expect(usersData).toHaveLength(count);
      usersData.forEach((userData) => {
        expect(userData.name).toBe(overrides.name);
        expect(userData.id).toBeDefined();
        expect(userData.email).toBeDefined();
      });
    });

    it('should create users with unique IDs even with overrides', () => {
      const count = 3;
      const usersData = UserFactory.createMany(count, { name: 'Same Name' });

      const ids = usersData.map((user) => user.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(count);
    });
  });

  describe('build', () => {
    it('should build user object without optional dates', () => {
      const userData = UserFactory.build();

      expect(userData).toHaveProperty('userId');
      expect(userData).toHaveProperty('username');
      expect(userData).not.toHaveProperty('createdAt');
      expect(userData).not.toHaveProperty('updatedAt');
    });

    it('should build user object with custom dates when provided', () => {
      const customDate = new Date('2023-01-01');
      const userData = UserFactory.build({
        createdAt: customDate,
        updatedAt: customDate,
      });

      expect(userData.createdAt).toBe(customDate);
      expect(userData.updatedAt).toBe(customDate);
    });

    it('should build user object with custom values', () => {
      const customData = {
        id: 'build-test-id',
        name: 'Build Test User',
        email: 'build@test.com',
      };

      const userData = UserFactory.build(customData);

      expect(userData.userId).toBe(customData.id);
      expect(userData.username).toBe(customData.name);
    });
  });

  describe('data validation', () => {
    it('should generate valid email formats', () => {
      const userData = UserFactory.create();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(userData.email!)).toBe(true);
    });

    it('should generate non-empty names', () => {
      const userData = UserFactory.create();

      expect(userData.name!.trim()).toBeTruthy();
      expect(userData.name!.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs by default', () => {
      const users = Array.from({ length: 10 }, () => UserFactory.create());
      const ids = users.map((user) => user.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(10);
    });
  });
});
