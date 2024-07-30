import { ExceptionFilter, ArgumentsHost, BadRequestException } from '@nestjs/common';
export declare class BadRequestExceptionFilter implements ExceptionFilter {
    private logger;
    catch(exception: BadRequestException, host: ArgumentsHost): void;
}
