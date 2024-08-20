import { BadRequestException, Body, ConflictException, Controller, InternalServerErrorException, Logger, Post, UseFilters } from "@nestjs/common";
import { AuthService } from "../../auth/services/auth.service";
import { NewUserDto } from "../dto/new-user.dto";
import { NewUserHandler } from "../handler/new-user.handler";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { User } from "../model/user.model";
import { HttpExceptionFilter } from "src/core/filters/http.exception.filters";

@ApiTags('User')
@Controller({
  version: '1',
})
@UseFilters(new HttpExceptionFilter()) 
export class NewUserController {
    public constructor(
        private readonly handler: NewUserHandler,
        private readonly authService: AuthService,
        private readonly logger: Logger = new Logger(NewUserController.name),
    ) {}

    @ApiResponse({
        status: 201,
        description: 'Create new user',
        content: {}
    })
    @ApiResponse({
        status: 409,
        description: 'Conflict',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
    })
    @Post("new-user")
    public async new(@Body() newUserDto: NewUserDto): Promise<any> {
        this.logger.log(NewUserController.name, "NewUser");

        try {
            const user = await this.handler.handle(newUserDto);

            const userPayload = await User.toPayload(user);
            return {
                'user_id': user.id,
                'access_token': await this.authService.generateAccessToken(userPayload),
                'refresh_token': await this.authService.generateRefreshToken(userPayload),
            };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            } else {
                this.logger.error(error.message, error.stack);
                throw new InternalServerErrorException('An unexpected error occurred');
            }
        }
    }
}
