import { z } from 'zod';

import {
  ElasticSearchFiltersSchema,
  ElasticSearchQuerySchema,
  ElasticSearchResponseSchema,
  ListingIndexSchema,
} from '@core/schemas/elasticsearch.schema';

export type SearchQuery = z.infer<typeof ElasticSearchQuerySchema>;
export type SearchResponse = z.infer<typeof ElasticSearchResponseSchema>;
export type ListingIndex = z.infer<typeof ListingIndexSchema>;
export type ElasticSearchQuery = z.infer<typeof ElasticSearchFiltersSchema>;

export interface IElasticsearchService {
  indexListing(listing: ListingIndex): Promise<void>;
  deleteIndex(listingId: string): Promise<void>;
}
