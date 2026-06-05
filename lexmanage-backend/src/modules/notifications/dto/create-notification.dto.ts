import { IsEnum, IsOptional, IsString, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationLevel, NotificationMotif } from '@prisma/client';

export class CreateNotificationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
  @ApiProperty({ enum: NotificationLevel }) @IsEnum(NotificationLevel) level: NotificationLevel;
  @ApiProperty({ enum: NotificationMotif }) @IsEnum(NotificationMotif) motif: NotificationMotif;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUUID('4', { each: true }) recipientIds?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) recipientRoles?: string[];
  @ApiPropertyOptional() @IsOptional() @IsUUID('4') caseId?: string;
}
