import { PrismaClient } from '@generated/prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

declare const beforeEach: (fn: () => void) => void;

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const createMockPrismaClient = (): MockPrismaClient => {
  return mockDeep<PrismaClient>();
};

export const resetMockPrisma = (mockPrisma: MockPrismaClient): void => {
  mockReset(mockPrisma);
};

export const setupPrismaMock = () => {
  const mockPrisma = createMockPrismaClient();

  beforeEach(() => {
    resetMockPrisma(mockPrisma);
  });

  return mockPrisma;
};
