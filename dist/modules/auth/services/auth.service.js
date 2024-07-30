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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../../common/services/prisma.service");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
let AuthService = AuthService_1 = class AuthService {
    constructor(jwtService, prismaService, logger = new common_1.Logger(AuthService_1.name)) {
        this.jwtService = jwtService;
        this.prismaService = prismaService;
        this.logger = logger;
    }
    async validateUser(username, password) {
        const user = await this.prismaService.user.findUnique({
            where: {
                username: username
            }
        });
        if (user && await bcrypt.compare(password, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async login(user) {
        const userExists = await this.prismaService.user.findUnique({
            where: {
                username: user.username,
            }
        });
        const payload = {
            username: user.username,
            sub: user.id,
            email: userExists.email,
            name: userExists.name,
            lastLogin: userExists.lastLogin,
        };
        await this.prismaService.user.update({
            where: {
                username: payload.username,
            },
            data: {
                lastLogin: new Date(),
            },
        });
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
    async register(user) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return this.prismaService.user.create({
            data: {
                name: user.name,
                email: user.email,
                password: hashedPassword,
                username: user.username,
            },
        });
    }
    async findByCriteria(criteria) {
        return this.prismaService.user.findMany({
            where: {
                OR: criteria.OR,
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        common_1.Logger])
], AuthService);
//# sourceMappingURL=auth.service.js.map