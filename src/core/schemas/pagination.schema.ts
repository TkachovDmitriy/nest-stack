import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const PaginationQueryWithSortSchema = PaginationQuerySchema.extend({
  sortBy: z.enum(['price_asc', 'price_desc', 'created_desc', 'created_asc']),
});

export const SitemapPaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(10000).optional(),
});

export const PaginationQueryWithFeaturedSchema = PaginationQuerySchema.extend({
  featured: z.preprocess((val) => val === 'true', z.boolean()),
});

export const PaginationQueryWithDateFilterSchema = PaginationQuerySchema.extend({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number(),
      pages: z.number(),
      page: z.number(),
      limit: z.number(),
    }),
  });
