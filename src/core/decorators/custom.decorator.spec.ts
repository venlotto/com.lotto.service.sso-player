import { registerDecorator, type ValidationOptions } from "class-validator";
import { Match } from "./custom.decorator";

jest.mock("class-validator", () => ({
  registerDecorator: jest.fn(),
}));

interface CapturedValidator {
  validate(value: unknown, args: unknown): boolean;
  defaultMessage(args: unknown): string;
}

interface CapturedDecoratorOptions {
  name: string;
  target: unknown;
  propertyName: string;
  options?: ValidationOptions;
  constraints: unknown[];
  validator: CapturedValidator;
}

describe("Match decorator", () => {
  const mockRegisterDecorator = registerDecorator as jest.Mock;

  class CredentialForm {
    public pin: string;
    public confirmPin: string;
  }

  beforeEach(() => {
    mockRegisterDecorator.mockClear();
  });

  const applyAndCapture = (
    options?: ValidationOptions,
  ): CapturedDecoratorOptions => {
    const decorator = Match("pin", options);
    decorator(CredentialForm.prototype, "confirmPin");
    expect(mockRegisterDecorator).toHaveBeenCalledTimes(1);
    return mockRegisterDecorator.mock.calls[0][0] as CapturedDecoratorOptions;
  };

  it("should register a decorator named match against the property", () => {
    const captured = applyAndCapture();

    expect(captured.name).toBe("match");
    expect(captured.target).toBe(CredentialForm);
    expect(captured.propertyName).toBe("confirmPin");
    expect(captured.constraints).toEqual(["pin"]);
  });

  it("should forward validation options when provided", () => {
    const captured = applyAndCapture({ message: "pins differ" });

    expect(captured.options).toEqual({ message: "pins differ" });
  });

  it("should validate to true when the value matches the related property", () => {
    const captured = applyAndCapture();

    const isValid = captured.validator.validate("same-value", {
      constraints: ["pin"],
      object: { pin: "same-value" },
    });

    expect(isValid).toBe(true);
  });

  it("should validate to false when the value differs from the related property", () => {
    const captured = applyAndCapture();

    const isValid = captured.validator.validate("other-value", {
      constraints: ["pin"],
      object: { pin: "same-value" },
    });

    expect(isValid).toBe(false);
  });

  it("should validate to false when the constraint is not a string", () => {
    const captured = applyAndCapture();

    const isValid = captured.validator.validate("same-value", {
      constraints: [42],
      object: { pin: "same-value" },
    });

    expect(isValid).toBe(false);
  });

  it("should build a default message naming both properties", () => {
    const captured = applyAndCapture();

    const message = captured.validator.defaultMessage({
      constraints: ["pin"],
    });

    expect(message).toBe("confirmPin must match pin");
  });
});
