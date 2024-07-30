import { ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: HttpException, host: ArgumentsHost): Promise<void>;
}
