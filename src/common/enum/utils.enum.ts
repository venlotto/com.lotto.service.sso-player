export function mapEnum<T>(enumType: T, value: string): T[keyof T] {
    const enumValues = Object.values(enumType) as string[];
    if (!enumValues.includes(value)) {
        throw new Error(`Invalid value: ${value}`);
    }
    return enumType[value as keyof typeof enumType];
}
