export interface SearchQuery {
  searchTerm?: string;
  filters?: Record<string, unknown>;
  must?: Array<Record<string, unknown>>;
  filter?: Array<Record<string, unknown>>;
}

export interface SearchResponse {
  hits: Array<Record<string, unknown>>;
  total: number;
}

export interface ISearchService {
  indexDocument(id: string, document: Record<string, unknown>): Promise<void>;
  updateDocument(id: string, document: Record<string, unknown>): Promise<void>;
  removeDocument(id: string): Promise<void>;
  bulkIndex(documents: Array<{ id: string; data: Record<string, unknown> }>): Promise<void>;
  search(query: SearchQuery): Promise<SearchResponse>;
}
