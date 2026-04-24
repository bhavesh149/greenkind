import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class DonationCheckoutDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  charityId!: string;

  @ApiProperty({
    description: 'Smallest currency unit (paise for INR, cents for USD)',
  })
  @IsInt()
  @Min(100)
  @Max(5_000_000)
  amountCents!: number;
}
