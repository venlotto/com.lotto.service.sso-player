import {AuthGuard} from "@nestjs/passport";
import {ExecutionContext} from "@nestjs/common";


export class LocalAuthGuard extends AuthGuard('local') {
    public async canActivate(context: ExecutionContext): Promise<boolean> {
        return (await super.canActivate(context)) as boolean;
    }
}
