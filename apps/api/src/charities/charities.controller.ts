import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequireActiveSubscription } from '../common/decorators/require-subscription.decorator';
import type { JwtUserPayload } from '../auth/jwt-payload';
import { CharitiesService } from './charities.service';
import { CharitySelectionService } from './charity-selection.service';
import { ListCharitiesQueryDto } from './dto/list-charities-query.dto';
import { CharitySelectionDto } from './dto/selection.dto';

@ApiTags('charities')
@Controller('charities')
export class CharitiesController {
  constructor(
    private readonly charities: CharitiesService,
    private readonly selection: CharitySelectionService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List charities (public directory)' })
  async list(@Query() query: ListCharitiesQueryDto) {
    const result = await this.charities.list({
      q: query.q,
      category: query.category,
      featured: query.featured,
      page: query.page,
      limit: query.limit,
      activeOnly: true,
    });
    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      items: result.items.map(mapCharity),
    };
  }

  @Patch('me/selection')
  @RequireActiveSubscription()
  @ApiOperation({
    summary:
      'Set selected charity and contribution % (min 10%) for subscription split',
  })
  async setSelection(
    @CurrentUser() u: JwtUserPayload,
    @Body() body: CharitySelectionDto,
  ) {
    return this.selection.setSelection(
      u.sub,
      body.selectedCharityId,
      body.charityContribution,
    );
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Charity detail by slug' })
  async bySlug(@Param('slug') slug: string) {
    const row = await this.charities.getBySlug(slug, { activeOnly: true });
    return { charity: mapCharity(row) };
  }
}

function mapCharity(c: {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  featured: boolean;
  active: boolean;
  images: unknown;
  events: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    category: c.category,
    featured: c.featured,
    active: c.active,
    images: c.images,
    events: c.events,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}
