export type CharityCard = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  featured: boolean;
  active: boolean;
  images: unknown;
  events: unknown;
  createdAt: string;
  updatedAt: string;
};

export type CharitiesListResponse = {
  total: number;
  page: number;
  limit: number;
  items: CharityCard[];
};

export type CharityDetailResponse = { charity: CharityCard };
