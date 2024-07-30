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
var RegisterUserHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUserHandler = void 0;
const auth_service_1 = require("../services/auth.service");
const common_1 = require("@nestjs/common");
const user_model_1 = require("../model/user.model");
let RegisterUserHandler = RegisterUserHandler_1 = class RegisterUserHandler {
    constructor(authService, logger = new common_1.Logger(RegisterUserHandler_1.name)) {
        this.authService = authService;
        this.logger = logger;
    }
    async handle(request) {
        this.logger.log(RegisterUserHandler_1.name);
        const existingUser = await this.authService.findByCriteria({
            OR: [{ email: request.email }, { username: request.username }],
        });
        if (existingUser.length > 0) {
            const conflictingField = existingUser[0].email === request.email ? 'email' : 'username';
            const errorMessage = `User already registered with ${conflictingField} given`;
            this.logger.error(errorMessage);
            throw new common_1.BadRequestException({ code: 400, message: errorMessage });
        }
        try {
            const dto = new user_model_1.User(request);
            const user = await this.authService.register(dto);
            return user.id;
        }
        catch (error) {
            this.logger.error(error);
            throw Error(error.message);
        }
    }
};
exports.RegisterUserHandler = RegisterUserHandler;
exports.RegisterUserHandler = RegisterUserHandler = RegisterUserHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        common_1.Logger])
], RegisterUserHandler);
//# sourceMappingURL=register-user.handler.js.map