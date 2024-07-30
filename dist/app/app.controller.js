"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const public_decorators_1 = require("../core/decorators/public.decorators");
const terminus_1 = require("@nestjs/terminus");
const prisma_service_1 = require("../common/services/prisma.service");
let AppController = class AppController {
    constructor(healthCheckService, prismaService) {
        this.healthCheckService = healthCheckService;
        this.prismaService = prismaService;
    }
    async getHealth() {
        return this.healthCheckService.check([
            () => this.prismaService.isHealthy(),
        ]);
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('/health'),
    (0, terminus_1.HealthCheck)(),
    (0, public_decorators_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getHealth", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        prisma_service_1.PrismaService])
], AppController);
//# sourceMappingURL=app.controller.js.map