"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const config_1 = require("../config");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./services/prisma.service");
const config_2 = require("@nestjs/config");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Module)({
        controllers: [],
        imports: [
            config_2.ConfigModule.forRoot({
                load: config_1.default,
                isGlobal: true,
                cache: true,
                envFilePath: ['.env'],
                expandVariables: true,
            }),
        ],
        providers: [prisma_service_1.PrismaService],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map