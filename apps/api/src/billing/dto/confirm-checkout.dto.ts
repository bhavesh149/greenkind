import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ConfirmCheckoutDto {
  @ApiProperty({ example: 'cs_test_...' })
  @IsString()
  @MinLength(10)
  sessionId!: string;
}
