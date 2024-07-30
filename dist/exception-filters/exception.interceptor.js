"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    async catch(exception, host) {
        const context = host.switchToHttp();
        const response = context.getResponse();
        if (exception instanceof class_validator_1.ValidationError) {
            this.handleValidationErrors(exception, response);
            return;
        }
        const statusCode = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception.message;
        if (statusCode === common_1.HttpStatus.INTERNAL_SERVER_ERROR || statusCode === common_1.HttpStatus.BAD_REQUEST) {
            const error = {
                stack: exception.stack,
                message,
                statusCode,
            };
            this.logger.error(JSON.stringify(error));
        }
        return;
    }
    handleValidationErrors(exception, response) {
        const errors = this.extractValidationErrors(exception);
        response.status(common_1.HttpStatus.BAD_REQUEST).json({
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: errors
        });
    }
    extractValidationErrors(exception) {
        const errors = [];
        for (const error of exception.children) {
            errors.push({
                property: error.property,
                constraints: error.constraints
            });
        }
        return errors;
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=exception.interceptor.js.map