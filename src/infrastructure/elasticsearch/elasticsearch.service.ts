import { Client } from '@elastic/elasticsearch';
import { Injectable, OnModuleInit } from '@nestjs/common';

import { env } from '@infrastructure/configs/env.config';
import { LoggerService } from '@infrastructure/logger/logger-service';

import { defaultMappingSchema } from './elasticsearch.schema';
import { ISearchService, SearchQuery, SearchResponse } from './search.interface';

@Injectable()
export class ElasticsearchService implements OnModuleInit, ISearchService {
  private readonly logger = new LoggerService(ElasticsearchService.name);
  private readonly client: Client;
  private readonly indexName: string;

  constructor() {
    this.client = new Client({
      node: env.ELASTICSEARCH_NODE,
      auth: { apiKey: env.ELASTICSEARCH_API_KEY },
    });

    this.indexName = env.ELASTICSEARCH_INDEX_NAME;
  }

  async onModuleInit() {
    try {
      const indexExists = await this.client.indices.exists({ index: this.indexName });

      if (!indexExists) {
        await this.client.indices.create({
          index: this.indexName,
          mappings: defaultMappingSchema,
          settings: {
            analysis: {
              analyzer: {
                custom_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding'],
                },
              },
            },
          },
        });
        this.logger.info(`Created Elasticsearch index: ${this.indexName}`);
      }
    } catch (error: unknown) {
      const err = error as { body?: { error?: { type?: string } } };
      if (err?.body?.error?.type === 'resource_already_exists_exception') return;
      this.logger.error('Failed to initialize Elasticsearch index', error);
      throw error;
    }
  }

  async indexDocument(id: string, document: Record<string, unknown>): Promise<void> {
    try {
      await this.client.index({ index: this.indexName, id, document, refresh: true });
      this.logger.info(`Indexed document ${id}`);
    } catch (error) {
      this.logger.error(`Failed to index document ${id}`, error);
      throw error;
    }
  }

  async updateDocument(id: string, document: Record<string, unknown>): Promise<void> {
    await this.client.update({
      index: this.indexName,
      id,
      doc: document,
      doc_as_upsert: true,
      refresh: true,
    });
  }

  async removeDocument(id: string): Promise<void> {
    try {
      await this.client.delete({ index: this.indexName, id, refresh: true });
      this.logger.info(`Removed document ${id}`);
    } catch (error) {
      this.logger.error(`Failed to remove document ${id}`, error);
      throw error;
    }
  }

  async bulkIndex(documents: Array<{ id: string; data: Record<string, unknown> }>): Promise<void> {
    const operations = documents.flatMap(({ id, data }) => [
      { index: { _index: this.indexName, _id: id } },
      data,
    ]);

    if (operations.length > 0) {
      await this.client.bulk({ refresh: true, operations });
      this.logger.info(`Bulk indexed ${documents.length} documents`);
    }
  }

  async search(query: SearchQuery): Promise<SearchResponse> {
    try {
      const esQuery = this.buildQuery(query);
      const response = await this.client.search({ index: this.indexName, query: esQuery });

      return {
        hits: response.hits.hits.map((hit) => hit._source as Record<string, unknown>),
        total:
          typeof response.hits.total === 'number'
            ? response.hits.total
            : (response.hits.total?.value ?? 0),
      };
    } catch (error) {
      this.logger.error('Failed to search documents', error);
      throw error;
    }
  }

  private buildQuery(query: SearchQuery) {
    const must: Array<Record<string, unknown>> = [];
    const filter: Array<Record<string, unknown>> = [];

    if (query.searchTerm) {
      must.push({
        multi_match: {
          query: query.searchTerm,
          fields: ['*'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    if (query.filters) {
      Object.entries(query.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          filter.push({ term: { [key]: value } });
        }
      });
    }

    if (query.must) must.push(...query.must);
    if (query.filter) filter.push(...query.filter);

    return {
      bool: {
        must: must.length > 0 ? must : undefined,
        filter: filter.length > 0 ? filter : undefined,
      },
    };
  }
}
