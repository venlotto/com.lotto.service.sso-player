import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const message = exception.message;

        this.logger.error(`HTTP Exception: ${message}`, exception.stack);

        response.status(status).json({
            message: message
        });
    }
}
