import { Prisma } from "@prisma/client";
export declare class User implements Prisma.UserCreateInput {
    name: string;
    email: string;
    password: string;
    username: string;
    lastLogin: Date | string | null;
    constructor(data: {
        name: string;
        email: string;
        password: string;
        username: string;
    });
}
