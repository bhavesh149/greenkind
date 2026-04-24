import { ApiProperty } from '@nestjs/swagger';
import { DrawMode } from '@prisma/client';
import { IsDateString, IsEnum } from 'class-validator';

export class CreateDrawDto {
  @ApiProperty({
    example: '2025-04-01',
    description: 'Any date in the month; normalized to UTC month start',
  })
  @IsDateString()
  month!: string;

  @ApiProperty({ enum: DrawMode })
  @IsEnum(DrawMode)
  mode!: DrawMode;
}
