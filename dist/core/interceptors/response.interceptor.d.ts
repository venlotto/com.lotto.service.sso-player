import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare class ResponseInterceptor implements NestInterceptor {
    private readonly reflector;
    statusMessages: {
        [key: string]: string;
    };
    constructor(reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Promise<any>;
}
