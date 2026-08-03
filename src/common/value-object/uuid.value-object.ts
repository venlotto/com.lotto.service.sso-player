import { v4 as uuidv4 } from "uuid";

export class UUID {
  private readonly value: string;

  constructor(id?: string) {
    if (id !== undefined && id !== "") {
      if (!UUID.isValid(id)) {
        throw new Error(`Invalid UUID: ${id}`);
      }
      this.value = id;
    } else {
      this.value = uuidv4();
    }
  }

  // Method to validate UUID format
  public static isValid(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  // Method to return the UUID as a string
  public toString(): string {
    return this.value;
  }

  // Equality check method
  public equals(other: UUID): boolean {
    return this.value === other.value;
  }
}
