import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WinnerVerificationStatus } from '@prisma/client';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyWinnerDto {
  @ApiProperty({
    enum: [
      WinnerVerificationStatus.APPROVED,
      WinnerVerificationStatus.REJECTED,
    ],
  })
  @IsIn([WinnerVerificationStatus.APPROVED, WinnerVerificationStatus.REJECTED])
  status!: WinnerVerificationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4_000)
  adminNotes?: string;
}
