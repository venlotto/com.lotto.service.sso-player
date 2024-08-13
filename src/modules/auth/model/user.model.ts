import {Prisma} from "@prisma/client";


export class User implements Prisma.UserCreateInput{
    id: string;
    name: string;
    email: string;
    password: string;
    username: string;
    lastLogin: Date | string | null;
    role: string;
    status: string;

    public constructor(data: {name: string, email: string, password: string, username: string, role: string, status: string}) {
        this.name = data.name;
        this.email = data.email;
        this.password = data.password;
        this.username = data.username;
        this.role = data.role;
        this.status = data.status;
    }
}
