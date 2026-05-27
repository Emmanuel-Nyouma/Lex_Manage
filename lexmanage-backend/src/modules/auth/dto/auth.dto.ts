import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@cabinet.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: 'admin@cabinet.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ required: false })
  @IsString()
  @MinLength(8)
  phone?: string;

  @ApiProperty({ example: 'Cabinet Kamdem & Associés', required: false })
  @IsString()
  @MinLength(2)
  tenantName?: string;

  @ApiProperty({ required: false })
  @IsString()
  country?: string;

  @ApiProperty({ required: false })
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsString()
  invitationToken?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
