import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CharitySelectionDto {
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Omit to leave as-is, null to clear',
  })
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsUUID()
  selectedCharityId?: string | null;

  @ApiProperty({
    minimum: 10,
    maximum: 100,
    description: 'Percent of subscription to charity',
  })
  @IsInt()
  @Min(10)
  @Max(100)
  charityContribution!: number;
}
