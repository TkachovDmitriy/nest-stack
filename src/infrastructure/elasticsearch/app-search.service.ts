import { Client } from '@elastic/enterprise-search';
import { Injectable, OnModuleInit } from '@nestjs/common';

import { env } from '@infrastructure/configs/env.config';
import { LoggerService } from '@infrastructure/logger/logger-service';

import { ISearchService, SearchQuery, SearchResponse } from './search.interface';

@Injectable()
export class AppSearchService implements OnModuleInit, ISearchService {
  private readonly client: Client;
  private readonly engineName: string;
  private readonly logger = new LoggerService(AppSearchService.name);

  constructor() {
    this.client = new Client({
      url: env.ELASTIC_ENTERPRISE_SEARCH_BASE_URL,
      auth: { token: env.ELASTIC_ENTERPRISE_SEARCH_API_KEY },
    });
    this.engineName = env.ELASTIC_ENTERPRISE_SEARCH_ENGINE_NAME;
  }

  async onModuleInit() {
    const listEngines = await this.client.app.listEngines();

    if (listEngines.results.some((engine) => engine.name === this.engineName)) return;

    await this.client.app.createEngine({
      body: { name: this.engineName },
    });
  }

  async indexDocument(id: string, document: Record<string, unknown>): Promise<void> {
    try {
      await this.client.app.indexDocuments({
        engine_name: this.engineName,
        documents: [{ id, ...document }],
      });
      this.logger.info(`Indexed document ${id}`);
    } catch (error) {
      this.logger.error(`Failed to index document ${id}`, error);
      throw error;
    }
  }

  async updateDocument(id: string, document: Record<string, unknown>): Promise<void> {
    await this.client.app.putDocuments({
      engine_name: this.engineName,
      documents: [{ id, ...document }],
    });
  }

  async removeDocument(id: string): Promise<void> {
    try {
      await this.client.app.deleteDocuments({
        engine_name: this.engineName,
        documentIds: [id],
      });
      this.logger.info(`Removed document ${id}`);
    } catch (error) {
      this.logger.error(`Failed to remove document ${id}`, error);
      throw error;
    }
  }

  async bulkIndex(documents: Array<{ id: string; data: Record<string, unknown> }>): Promise<void> {
    try {
      await this.client.app.indexDocuments({
        engine_name: this.engineName,
        documents: documents.map(({ id, data }) => ({ id, ...data })),
      });
      this.logger.info(`Bulk indexed ${documents.length} documents`);
    } catch (error) {
      this.logger.error('Failed to bulk index documents', error);
      throw error;
    }
  }

  async search(_query: SearchQuery): Promise<SearchResponse> {
    return { hits: [], total: 0 };
  }
}
