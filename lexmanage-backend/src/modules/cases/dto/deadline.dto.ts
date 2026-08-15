import { IsEnum, IsISO8601, IsString, MaxLength, MinLength } from 'class-validator';

export enum DeadlinePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateDeadlineDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @IsISO8601({ strict: true })
  dueAt: string;

  @IsEnum(DeadlinePriority)
  priority: DeadlinePriority;
}
