import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UploadProofDto {
  @ApiProperty({
    description:
      'Image storage key, URL, or path your admin workflow expects (S3, Supabase, etc.)',
    maxLength: 2048,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(2048)
  proofImageKey!: string;
}
