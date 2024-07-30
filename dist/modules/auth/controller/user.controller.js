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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UserController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../services/auth.service");
const register_user_dto_1 = require("../dto/register-user.dto");
const register_user_handler_1 = require("../handler/register-user.handler");
const swagger_1 = require("@nestjs/swagger");
let UserController = UserController_1 = class UserController {
    constructor(authService, handler, logger = new common_1.Logger(UserController_1.name)) {
        this.authService = authService;
        this.handler = handler;
        this.logger = logger;
    }
    async register(body) {
        this.logger.log('UserController.register');
        let userId = null;
        try {
            userId = await this.handler.handle(body);
        }
        catch (error) {
            throw Error(error);
        }
        return {
            'status': 'OK',
            'userId': userId,
        };
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)('/register'),
    (0, swagger_1.ApiTags)('User'),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Register user',
        content: {}
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request',
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal Server Error',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_user_dto_1.RegisterUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "register", null);
exports.UserController = UserController = UserController_1 = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        register_user_handler_1.RegisterUserHandler,
        common_1.Logger])
], UserController);
//# sourceMappingURL=user.controller.js.map