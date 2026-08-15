import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CABINET_ADMIN = 'CABINET_ADMIN',
  LAWYER = 'LAWYER',
  ASSISTANT = 'ASSISTANT',
  SECRETARY = 'SECRETARY',
}

export class CreateUserDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(100) firstName: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(100) lastName: string;
  @ApiProperty() @IsEmail() @MaxLength(254) email: string;
  @ApiProperty() @IsString() @MinLength(8) @MaxLength(128) password: string;
  @ApiProperty({ enum: UserRole }) @IsEnum(UserRole) role: UserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @ApiPropertyOptional({ enum: UserRole }) @IsOptional() @IsEnum(UserRole) role?: UserRole;
}
