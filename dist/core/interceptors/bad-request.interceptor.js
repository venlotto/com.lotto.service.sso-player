"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let BadRequestExceptionFilter = class BadRequestExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger('BadRequestExceptionFilter');
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const message = exception.message;
        const errors = exception.getResponse()['message'];
        this.logger.error(`Bad request: ${message}`);
        this.logger.error(`Validation errors: ${JSON.stringify(errors)}`);
        this.logger.error(`Request URL: ${request.url}`);
        this.logger.error(`Request Method: ${request.method}`);
        this.logger.error(`Request Body: ${JSON.stringify(request.body)}`);
        response.status(400).json({
            statusCode: 400,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: 'Bad request',
            errors: errors,
        });
    }
};
exports.BadRequestExceptionFilter = BadRequestExceptionFilter;
exports.BadRequestExceptionFilter = BadRequestExceptionFilter = __decorate([
    (0, common_1.Catch)(common_1.BadRequestException)
], BadRequestExceptionFilter);
//# sourceMappingURL=bad-request.interceptor.js.map