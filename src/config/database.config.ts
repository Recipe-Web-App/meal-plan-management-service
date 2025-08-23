import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '@/shared/services/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  async onModuleInit() {
    // Attempt to connect to the database; log failures via the app logger
    try {
      await this.$connect();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        'Database connection failed, continuing without database for testing',
        { error: errorMessage },
        'PrismaService',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
