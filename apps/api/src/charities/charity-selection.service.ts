import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CharitiesService } from './charities.service';

@Injectable()
export class CharitySelectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly charities: CharitiesService,
  ) {}

  async setSelection(
    userId: string,
    selectedCharityId: string | null | undefined,
    charityContribution: number,
  ) {
    if (charityContribution < 10 || charityContribution > 100) {
      throw new BadRequestException(
        'charityContribution must be between 10 and 100',
      );
    }
    if (selectedCharityId) {
      await this.charities.ensureActiveId(selectedCharityId);
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(selectedCharityId !== undefined && { selectedCharityId }),
        charityContribution,
      },
      select: {
        id: true,
        selectedCharityId: true,
        charityContribution: true,
        selectedCharity: { select: { id: true, name: true, slug: true } },
      },
    });
  }
}
