import {Body, Controller, Get, InternalServerErrorException, Logger, Post, Put, Req, UseGuards} from "@nestjs/common";
import {AuthService} from "../../auth/services/auth.service";
import {NewUserDto} from "../dto/new-user.dto";
import {NewUserHandler} from "../handler/new-user.handler";
import {ApiBearerAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import { ForgotPasswordDto } from "../../auth/dto/forgot-password.dto";
import {ResetPasswordDto} from '../../auth/dto/reset-password.dto';
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { EditProfileDto } from "../../auth/dto/edit-profile.dto";

@ApiTags('User')
@Controller({
  version: '1',
})
export class EditUserController {
    public constructor(
        private readonly authService: AuthService,
        private readonly handler: NewUserHandler,
        private readonly jwtService: JwtService,
        private readonly logger: Logger = new Logger(EditUserController.name),
    ) {
    }

    @ApiResponse({
        status: 201,
        description: 'Register user',
        content: {}
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
    })
    //@ApiBearerAuth()
    @Post("new-user")
    //@UseGuards(JwtAuthGuard)
    public async new(@Body() body: NewUserDto): Promise<any> {
        this.logger.log(EditUserController.name, "NewUser");

        let userId = null;
        try {
            userId = await this.handler.handle(body);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }

        return {
            'status': 'OK',
            'userId': userId,
        }
    }

    @Post('forgot-password')
    public async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'Password reset email sent' };
  }

  public async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'Password reset successful' };
  }

  @Get('/profile')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Get user profile',
    content: {}
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
  })
  @UseGuards(JwtAuthGuard)
  public async getProfile(@Req() req) {
    this.logger.log(EditUserController.name, "getProfile");
    try {
      const userId = this.jwtService.decode(req.headers.authorization.split(' ')[1])['userId'];
      const user = await this.authService.getUserProfile(userId);
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Put('/profile')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Edit user profile',
    content: {}
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
  })
  @UseGuards(JwtAuthGuard)
  public async editProfile(@Req() req, @Body() dto: EditProfileDto) {
    this.logger.log(EditUserController.name, "editProfile");
    try {
      const userId = this.jwtService.decode(req.headers.authorization.split(' ')[1])['userId'];
      const updatedUser = await this.authService.updateUserProfile(userId, dto);
      return updatedUser;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

}