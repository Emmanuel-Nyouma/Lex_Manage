import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

const TENANT_ASSIGNABLE_ROLES = [
  'CABINET_ADMIN',
  'LAWYER',
  'ASSISTANT',
  'SECRETARY',
] as const;

export class UpdateTenantDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(120) city?: string;
  @IsOptional() @IsString() @MaxLength(120) country?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(40) fax?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(300) website?: string;
  @IsOptional() @IsString() @MaxLength(80) siret?: string;
  @IsOptional() @IsString() @MaxLength(80) barNumber?: string;
}

export class CreateInvitationDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsIn(TENANT_ASSIGNABLE_ROLES)
  role: (typeof TENANT_ASSIGNABLE_ROLES)[number];
}

export class UpdateMemberDto {
  @IsOptional()
  @IsIn(TENANT_ASSIGNABLE_ROLES)
  role?: (typeof TENANT_ASSIGNABLE_ROLES)[number];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
