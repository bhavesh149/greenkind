import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Charity } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { slugify } from './charities.utils';

export type ListParams = {
  q?: string;
  category?: string;
  featured?: boolean;
  page: number;
  limit: number;
  activeOnly: boolean;
};

@Injectable()
export class CharitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: ListParams) {
    const { page, limit, activeOnly } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.CharityWhereInput = {};
    if (activeOnly) {
      where.active = true;
    }
    if (params.featured === true) {
      where.featured = true;
    }
    if (params.category) {
      where.category = params.category;
    }
    if (params.q?.trim()) {
      where.OR = [
        { name: { contains: params.q.trim(), mode: 'insensitive' } },
        { description: { contains: params.q.trim(), mode: 'insensitive' } },
      ];
    }
    const [total, items] = await Promise.all([
      this.prisma.charity.count({ where }),
      this.prisma.charity.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
    ]);
    return { total, page, limit, items };
  }

  async getBySlug(slug: string, options: { activeOnly: boolean }) {
    const row = await this.prisma.charity.findUnique({ where: { slug } });
    if (!row) {
      throw new NotFoundException('Charity not found');
    }
    if (options.activeOnly && !row.active) {
      throw new NotFoundException('Charity not found');
    }
    return row;
  }

  async ensureActiveId(id: string): Promise<Charity> {
    const c = await this.prisma.charity.findFirst({
      where: { id, active: true },
    });
    if (!c) {
      throw new BadRequestException('Charity not found or inactive');
    }
    return c;
  }

  async createForAdmin(
    data: Pick<
      Charity,
      'name' | 'description' | 'category' | 'featured' | 'active'
    > & {
      createdById: string;
      slug?: string;
    },
  ) {
    let slug = data.slug?.trim() ? slugify(data.slug) : slugify(data.name);
    const existing = await this.prisma.charity.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    return this.prisma.charity.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        category: data.category,
        featured: data.featured,
        active: data.active,
        createdById: data.createdById,
      },
    });
  }

  async updateForAdmin(
    id: string,
    data: Partial<
      Pick<Charity, 'name' | 'description' | 'category' | 'featured' | 'active'>
    > & { slug?: string },
  ) {
    const row = await this.prisma.charity.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Charity not found');
    }
    const next: Prisma.CharityUpdateInput = {};
    if (data.name !== undefined) {
      next.name = data.name;
    }
    if (data.description !== undefined) {
      next.description = data.description;
    }
    if (data.category !== undefined) {
      next.category = data.category;
    }
    if (data.featured !== undefined) {
      next.featured = data.featured;
    }
    if (data.active !== undefined) {
      next.active = data.active;
    }
    if (data.slug !== undefined) {
      const s = slugify(data.slug);
      if (s !== row.slug) {
        const clash = await this.prisma.charity.findFirst({
          where: { slug: s, NOT: { id } },
        });
        if (clash) {
          throw new BadRequestException('Slug already in use');
        }
        next.slug = s;
      }
    }
    return this.prisma.charity.update({ where: { id }, data: next });
  }

  async softDeleteForAdmin(id: string) {
    const row = await this.prisma.charity.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Charity not found');
    }
    return this.prisma.charity.update({
      where: { id },
      data: { active: false, featured: false },
    });
  }
}
