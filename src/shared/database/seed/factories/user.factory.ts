/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { User } from '@prisma/client';
import { faker } from '@faker-js/faker';

export interface CreateUserData {
  id?: string;
  name?: string;
  email?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserFactory {
  static create(overrides: CreateUserData = {}): CreateUserData {
    return {
      id: overrides.id ?? faker.string.uuid(),
      name: overrides.name ?? faker.person.fullName(),
      email: overrides.email ?? faker.internet.email(),
      createdAt: overrides.createdAt ?? new Date(),
      updatedAt: overrides.updatedAt ?? new Date(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides: CreateUserData = {}): CreateUserData[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static build(overrides: CreateUserData = {}): Omit<User, 'createdAt' | 'updatedAt'> & {
    createdAt?: Date;
    updatedAt?: Date;
  } {
    const data = this.create(overrides);
    const result: any = {
      id: data.id!,
      name: data.name!,
      email: data.email!,
    };

    // Only include dates if explicitly provided in overrides
    if ('createdAt' in overrides && overrides.createdAt) {
      result.createdAt = overrides.createdAt;
    }
    if ('updatedAt' in overrides && overrides.updatedAt) {
      result.updatedAt = overrides.updatedAt;
    }

    return result;
  }
}
