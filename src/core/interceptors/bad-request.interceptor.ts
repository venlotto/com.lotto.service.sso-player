import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';

@Catch(BadRequestException)
export class BadRequestExceptionFilter implements ExceptionFilter {
    private logger = new Logger('BadRequestExceptionFilter');

    catch(exception: BadRequestException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const message = exception.message;
        const errors = exception.getResponse()['message']; // Extract validation errors

        this.logger.error(`Bad request: ${message}`);
        this.logger.error(`Validation errors: ${JSON.stringify(errors)}`);

        // Log request details
        this.logger.error(`Request URL: ${request.url}`);
        this.logger.error(`Request Method: ${request.method}`);
        this.logger.error(`Request Body: ${JSON.stringify(request.body)}`);

        // Send a response
        response.status(400).json({
            statusCode: 400,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: 'Bad request',
            errors: errors, // Include validation errors in response
        });
    }
}
