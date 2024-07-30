import {ArgumentMetadata, BadRequestException, Injectable, Logger, PipeTransform} from "@nestjs/common";

@Injectable()
export class JoiValidationPipe implements PipeTransform {
    constructor(private schema: any) {
    }

    transform(value: any, metadata: ArgumentMetadata): any {
        try {
            if (metadata.type === 'query') {
                const {error} = this.schema.query.validate(value);
                if (error)
                    throw new Error(error);
            } else if (metadata.type === 'body') {
                const {error} = this.schema.body.validate(value);
                if (error)
                    throw new Error(error);
            }
        } catch (e) {
            Logger.error(`Validation error details : ${e.message}`);
            throw new BadRequestException();
        }
        return value;
    }
}