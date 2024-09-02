import { Controller, Logger, Get, UseGuards, Request } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags('User')
@Controller({
  version: '1',
})
export class MeController {
    public constructor(
        private readonly logger: Logger = new Logger(MeController.name),
    ) {}

    @ApiResponse({
        status: 200,
        description: 'Retrieve user payload',
        content: {}
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    @ApiResponse({
        status: 401,
        description: 'Token has expired', 
    })
    @Get("me") 
    @UseGuards(JwtAuthGuard)
    public async getMe(@Request() req): Promise<any> {
        const userPayload = req.user;
        return userPayload;
    }
}
