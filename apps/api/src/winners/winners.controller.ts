import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../auth/jwt-payload';
import { UploadProofDto } from './dto/proof.dto';
import { WinnersService } from './winners.service';

@ApiTags('winners')
@Controller('winners')
export class WinnersController {
  constructor(private readonly winners: WinnersService) {}

  @Get('me')
  @ApiOperation({ summary: 'List current user’s wins / ongoing verifications' })
  async listMine(@CurrentUser() u: JwtUserPayload) {
    return this.winners.listMine(u.sub);
  }

  @Patch(':id/proof')
  @ApiOperation({ summary: 'Submit or update proof reference for a win' })
  async proof(
    @CurrentUser() u: JwtUserPayload,
    @Param('id') id: string,
    @Body() body: UploadProofDto,
  ) {
    return this.winners.setProof(u.sub, id, body.proofImageKey);
  }
}
