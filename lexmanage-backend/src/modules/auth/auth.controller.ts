import { Body, Controller, Post, Get, Patch, UseGuards, Res, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, UpdateProfileDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new law firm (Tenant) with admin user' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...result } = await this.authService.register(dto);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: isProd, sameSite: isProd ? 'strict' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return result;
  }

  @Post('login')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Login and get JWT tokens' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...result } = await this.authService.login(dto);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: isProd, sameSite: isProd ? 'strict' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return result;
  }

  @Post('refresh')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Get a new access token using a refresh token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    const { refreshToken: newRefreshToken, ...result } = await this.authService.refreshToken(refreshToken);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: isProd, sameSite: isProd ? 'strict' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@CurrentUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(userId);
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }
}
