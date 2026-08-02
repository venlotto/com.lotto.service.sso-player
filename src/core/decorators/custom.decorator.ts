import { SetMetadata } from "@nestjs/common";
import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  type ValidatorConstraintInterface,
} from "class-validator";

interface MatchValidationArguments extends ValidationArguments {
  object: Record<string, unknown>;
  constraints: unknown[];
}

export function Match(
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol): void => {
    const propertyKey = String(propertyName);
    registerDecorator({
      name: "match",
      target: object.constructor,
      propertyName: propertyKey,
      ...(validationOptions !== undefined
        ? { options: validationOptions }
        : {}),
      constraints: [property],
      validator: {
        validate(value: unknown, args: MatchValidationArguments): boolean {
          const relatedPropertyName = args.constraints[0];
          if (typeof relatedPropertyName !== "string") {
            return false;
          }
          const relatedValue = args.object[relatedPropertyName];
          return value === relatedValue;
        },
        defaultMessage(args: MatchValidationArguments): string {
          const relatedPropertyName = args.constraints[0];
          return `${propertyKey} must match ${String(relatedPropertyName)}`;
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
