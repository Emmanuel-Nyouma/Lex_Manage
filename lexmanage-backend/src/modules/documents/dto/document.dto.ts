import { IsEnum, IsInt, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  OCR_PENDING = 'OCR_PENDING',
  OCR_DONE = 'OCR_DONE',
  INDEXED = 'INDEXED',
  ERROR = 'ERROR',
}

export class CreateDocumentDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() fileName: string;
  @ApiProperty() @IsString() fileUrl: string;
  @ApiProperty() @IsString() fileType: string;
  @ApiProperty() @IsInt() @IsPositive() fileSize: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() caseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional({ enum: DocumentStatus }) @IsOptional() @IsEnum(DocumentStatus) status?: DocumentStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
}
