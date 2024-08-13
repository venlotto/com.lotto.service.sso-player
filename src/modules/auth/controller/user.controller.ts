import {Body, Controller, Get, InternalServerErrorException, Logger, Post, Put, Req, UseGuards} from "@nestjs/common";
import {AuthService} from "../services/auth.service";
import {RegisterUserDto} from "../dto/register-user.dto";
import {RegisterUserHandler} from "../handler/register-user.handler";
import {ApiBearerAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import { ForgotPasswordDto } from "../dto/forgot-password.dto";
import {ResetPasswordDto} from '../dto/reset-password.dto';
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { EditProfileDto } from "../dto/edit-profile.dto";

@Controller('user')
export class UserController {
    public constructor(
        private readonly authService: AuthService,
        private readonly handler: RegisterUserHandler,
        private readonly jwtService: JwtService,
        private readonly logger: Logger = new Logger(UserController.name),
    ) {
    }

    @Post('/register')
    @ApiTags('User')
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
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    public async register(@Body() body: RegisterUserDto): Promise<any> {
        this.logger.log(UserController.name, "register");

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

    @ApiTags('User')
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
  @ApiTags('User')
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
    this.logger.log(UserController.name, "getProfile");
    try {
      const userId = this.jwtService.decode(req.headers.authorization.split(' ')[1])['userId'];
      const user = await this.authService.getUserProfile(userId);
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Put('/profile')
  @ApiTags('User')
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
    this.logger.log(UserController.name, "editProfile");
    try {
      const userId = this.jwtService.decode(req.headers.authorization.split(' ')[1])['userId'];
      const updatedUser = await this.authService.updateUserProfile(userId, dto);
      return updatedUser;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

}