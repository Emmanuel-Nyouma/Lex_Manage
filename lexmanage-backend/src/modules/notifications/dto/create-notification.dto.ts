import { ArrayMaxSize, IsEnum, IsOptional, IsString, IsArray, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationLevel, NotificationMotif } from '@prisma/client';

export class CreateNotificationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) message?: string;
  @ApiProperty({ enum: NotificationLevel }) @IsEnum(NotificationLevel) level: NotificationLevel;
  @ApiProperty({ enum: NotificationMotif }) @IsEnum(NotificationMotif) motif: NotificationMotif;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(100) @IsUUID('4', { each: true }) recipientIds?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) recipientRoles?: string[];
  @ApiPropertyOptional() @IsOptional() @IsUUID('4') caseId?: string;
}
