"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/services/prisma.service");
const user_controller_1 = require("./controller/user.controller");
const auth_service_1 = require("./services/auth.service");
const register_user_handler_1 = require("./handler/register-user.handler");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const process = require("node:process");
const auth_controller_1 = require("./controller/auth.controller");
const local_strategy_1 = require("./strategies/local.strategy");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            user_controller_1.UserController,
            auth_controller_1.AuthController,
        ],
        imports: [
            passport_1.PassportModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || '48da21ccb2abd9a2e756228b42d15fdbe39c00f1',
                signOptions: { expiresIn: process.env.JWT_EXPIRES + 's' },
            }),
        ],
        providers: [
            prisma_service_1.PrismaService,
            common_1.Logger,
            auth_service_1.AuthService,
            register_user_handler_1.RegisterUserHandler,
            local_strategy_1.LocalStrategy,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map