import { type ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { JoiValidationPipe } from "./joi-validation.pipe";

type ValidationSchema = ConstructorParameters<typeof JoiValidationPipe>[0];
type CorrelatedRequest = ConstructorParameters<typeof JoiValidationPipe>[1];

interface JoiShape {
  validate(value: unknown): { error?: Error; value: unknown };
}

const buildTarget = (shouldFail: boolean): JoiShape => ({
  validate: (value: unknown) =>
    shouldFail
      ? { error: new Error("value is not allowed"), value }
      : { error: undefined, value },
});

const buildSchema = (
  failingBranch?: "body" | "query",
): ValidationSchema =>
  ({
    body: buildTarget(failingBranch === "body"),
    query: buildTarget(failingBranch === "query"),
  }) as unknown as ValidationSchema;

const buildRequest = (correlationId?: string): CorrelatedRequest =>
  ({ correlationId }) as unknown as CorrelatedRequest;

const meta = (type: "body" | "param" | "query"): ArgumentMetadata =>
  ({ type }) as ArgumentMetadata;

describe("JoiValidationPipe", () => {
  describe("transform", () => {
    it("returns the query value unchanged when validation passes", (): void => {
      const pipe = new JoiValidationPipe(buildSchema(), buildRequest("corr-1"));
      const value = { page: 2 };

      expect(pipe.transform(value, meta("query"))).toBe(value);
    });

    it("throws BadRequestException when query validation fails", (): void => {
      const pipe = new JoiValidationPipe(
        buildSchema("query"),
        buildRequest("corr-2"),
      );

      expect(() => pipe.transform({ page: "nope" }, meta("query"))).toThrow(
        BadRequestException,
      );
    });

    it("returns the body value unchanged when validation passes", (): void => {
      const pipe = new JoiValidationPipe(buildSchema(), buildRequest("corr-3"));
      const value = { name: "ok" };

      expect(pipe.transform(value, meta("body"))).toBe(value);
    });

    it("throws BadRequestException when body validation fails", (): void => {
      const pipe = new JoiValidationPipe(
        buildSchema("body"),
        buildRequest("corr-4"),
      );

      expect(() => pipe.transform({ name: 123 }, meta("body"))).toThrow(
        BadRequestException,
      );
    });

    it("passes values through for metadata types without a schema branch", (): void => {
      const pipe = new JoiValidationPipe(buildSchema(), buildRequest("corr-5"));
      const value = "raw";

      expect(pipe.transform(value, meta("param"))).toBe(value);
    });
  });
});
