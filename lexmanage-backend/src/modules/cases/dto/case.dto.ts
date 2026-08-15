import { ArrayMaxSize, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CaseStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum CasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateCaseDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(200) title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiProperty() @IsString() @MaxLength(200) clientName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) courtName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) caseNumber?: string;
  @ApiPropertyOptional({ enum: CaseStatus }) @IsOptional() @IsEnum(CaseStatus) status?: CaseStatus;
  @ApiPropertyOptional({ enum: CasePriority }) @IsOptional() @IsEnum(CasePriority) priority?: CasePriority;
  @ApiPropertyOptional() @IsOptional() @IsUUID() clientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigneeId?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @ArrayMaxSize(100) @IsUUID(undefined, { each: true }) documentIds?: string[];
}

export class UpdateCaseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) courtName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) caseNumber?: string;
  @ApiPropertyOptional({ enum: CaseStatus }) @IsOptional() @IsEnum(CaseStatus) status?: CaseStatus;
  @ApiPropertyOptional({ enum: CasePriority }) @IsOptional() @IsEnum(CasePriority) priority?: CasePriority;
  @ApiPropertyOptional() @IsOptional() @IsUUID() clientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigneeId?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @ArrayMaxSize(100) @IsUUID(undefined, { each: true }) documentIds?: string[];
}
