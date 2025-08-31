import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<HealthService>;

  beforeEach(async () => {
    const mockHealthService = {
      check: jest.fn(),
      checkReadiness: jest.fn(),
      checkReadinessGraceful: jest.fn(),
      checkLiveness: jest.fn(),
      getVersion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health check result', async () => {
      const mockResult = { status: 'ok', info: {}, error: {}, details: {} };
      healthService.check.mockResolvedValue(mockResult as any);

      const result = await controller.getHealth();

      expect(result).toEqual(mockResult);
      expect(healthService.check).toHaveBeenCalled();
    });
  });

  describe('getReadiness', () => {
    it('should return graceful readiness check result', async () => {
      const mockResult = {
        status: 'ok',
        info: {
          service: { status: 'up' },
          database: { status: 'down', degraded: true },
        },
        error: {},
        details: {},
      };
      healthService.checkReadinessGraceful.mockResolvedValue(mockResult as any);

      const result = await controller.getReadiness();

      expect(result).toEqual(mockResult);
      expect(healthService.checkReadinessGraceful).toHaveBeenCalled();
    });
  });

  describe('getLiveness', () => {
    it('should return liveness check result', async () => {
      const mockResult = { status: 'ok', info: {}, error: {}, details: {} };
      healthService.checkLiveness.mockResolvedValue(mockResult as any);

      const result = await controller.getLiveness();

      expect(result).toEqual(mockResult);
      expect(healthService.checkLiveness).toHaveBeenCalled();
    });
  });

  describe('getVersion', () => {
    it('should return version information', () => {
      const mockVersion = {
        version: '1.0.0',
        environment: 'test',
        timestamp: '2025-01-01T00:00:00.000Z',
      };
      healthService.getVersion.mockReturnValue(mockVersion);

      const result = controller.getVersion();

      expect(result).toEqual(mockVersion);
      expect(healthService.getVersion).toHaveBeenCalled();
    });
  });
});
