export interface TranscriptSegment {
  id?: number;
  source_file: string;
  start_timestamp: string;
  end_timestamp: string | null;
  text_content: string;
  embedding?: number[];
}

export interface SearchResult {
  id: number;
  source_file: string;
  start_timestamp: string;
  end_timestamp: string | null;
  text_content: string;
  similarity: number;
}

export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}

export interface SearchQuery {
  queryText: string;
}