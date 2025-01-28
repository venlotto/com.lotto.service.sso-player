import { SetMetadata } from "@nestjs/common";
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraintInterface,
} from "class-validator";

interface MatchValidationArguments extends ValidationArguments {
  object: Record<string, any>;
}

export function Match(
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: "match",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: unknown, args: MatchValidationArguments): boolean {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = args.object[relatedPropertyName];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments): string {
          const [relatedPropertyName] = args.constraints;
          return `${propertyName} must match ${relatedPropertyName}`;
        },
      } as ValidatorConstraintInterface,
    });
  };
}

export interface CustomMetadata {
  key: string;
  value: unknown;
}

export const Custom = (
  metadata: CustomMetadata,
): ClassDecorator & MethodDecorator => {
  return SetMetadata(metadata.key, metadata.value);
};
