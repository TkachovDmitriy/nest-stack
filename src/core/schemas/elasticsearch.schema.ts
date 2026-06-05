import { z } from 'zod';

import { PublicListingSchema } from './listing.schema';

export const ElasticSearchQuerySchema = z.object({
  searchTerm: z.string().optional(),
  propertyType: z.string().optional(),
  entityType: z.string().optional(),
  priceRange: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  location: z
    .object({
      city: z.string(),
      radius: z.number().min(0),
    })
    .optional(),
  featured: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
});

export const ElasticSearchResponseSchema = z.object({
  featured: z.object({
    items: z.array(z.any()),
    total: z.number(),
  }),
  regular: z.object({
    items: z.array(z.any()),
    total: z.number(),
  }),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
});

export const ListingIndexSchema = PublicListingSchema.extend({
  searchableText: z.string(),
});

export const ElasticSearchFiltersSchema = z.object({
  must: z.array(z.any()),
  filter: z.array(z.any()),
});
