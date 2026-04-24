import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Matches, Max, Min } from 'class-validator';

export class UpsertScoreDto {
  @ApiProperty({ example: '2026-04-22', description: 'UTC calendar date' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scoreDate!: string;

  @ApiProperty({ minimum: 1, maximum: 45, description: 'Stableford points' })
  @IsInt()
  @Min(1)
  @Max(45)
  scoreValue!: number;
}
