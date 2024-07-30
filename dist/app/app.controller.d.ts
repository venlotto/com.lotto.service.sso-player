import { HealthCheckService } from '@nestjs/terminus';
import { PrismaService } from '../common/services/prisma.service';
export declare class AppController {
    private healthCheckService;
    private prismaService;
    constructor(healthCheckService: HealthCheckService, prismaService: PrismaService);
    getHealth(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
