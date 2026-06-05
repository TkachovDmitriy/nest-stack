import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';

export interface BaseDocument {
  id: string;
  [key: string]: unknown;
}

export const defaultMappingSchema: MappingTypeMapping = {
  properties: {
    id: {
      type: 'text',
      fields: { keyword: { type: 'keyword' } },
      fielddata: true,
    },
    created_at: { type: 'date' },
    updated_at: { type: 'date' },
  },
};
