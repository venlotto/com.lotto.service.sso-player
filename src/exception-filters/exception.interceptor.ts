import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { ValidationError } from 'class-validator'; // Import ValidationError
import { Response } from 'express'; // Import Response

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);
    async catch(exception: any, host: ArgumentsHost) {
        const context = host.switchToHttp();
        const response = context.getResponse<Response>();

        if (exception instanceof ValidationError) {
            // Handle validation errors
            this.handleValidationErrors(exception, response);
            return;
        }

        // Handle other types of exceptions
        const statusCode: number =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception.message;

        if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR || statusCode === HttpStatus.BAD_REQUEST) {
            const error = {
                stack: exception.stack,
                message,
                statusCode,
            };
            this.logger.error(JSON.stringify(error));
        }

        return;
    }

    private handleValidationErrors(exception: ValidationError, response: Response): void {
        const errors = this.extractValidationErrors(exception);

        response.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: errors
        });
    }

    private extractValidationErrors(exception: ValidationError): any[] {
        const errors = [];
        for (const error of exception.children) {
            errors.push({
                property: error.property,
                constraints: error.constraints
            });
        }
        return errors;
    }
}
