import { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: any, host: ArgumentsHost): Promise<void>;
    private handleValidationErrors;
    private extractValidationErrors;
}
