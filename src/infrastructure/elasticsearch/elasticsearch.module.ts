import { Module } from '@nestjs/common';

import { env } from '@infrastructure/configs/env.config';

import { AppSearchService } from './app-search.service';
import { ElasticsearchService } from './elasticsearch.service';

@Module({
  providers: [
    {
      provide: 'SearchService',
      useFactory: (
        elasticsearchService: ElasticsearchService,
        appSearchService: AppSearchService,
      ) => {
        return env.ENABLE_NEW_ELASTICSEARCH ? elasticsearchService : appSearchService;
      },
      inject: [ElasticsearchService, AppSearchService],
    },
    ElasticsearchService,
    AppSearchService,
  ],
  exports: ['SearchService'],
})
export class SearchModule {}
