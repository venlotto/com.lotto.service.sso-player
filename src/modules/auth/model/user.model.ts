import {Prisma} from "@prisma/client";


export class User implements Prisma.UserCreateInput{
    name: string;
    email: string;
    password: string;
    username: string;
    lastLogin: Date | string | null;

    public constructor(data: {name: string, email: string, password: string, username: string}) {
        this.name = data.name;
        this.email = data.email;
        this.password = data.password;
        this.username = data.username;
    }
}