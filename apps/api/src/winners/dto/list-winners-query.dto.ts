import { ApiPropertyOptional } from '@nestjs/swagger';
import { WinnerVerificationStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListWinnersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(WinnerVerificationStatus)
  verificationStatus?: WinnerVerificationStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10) || 1)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10) || 20)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
