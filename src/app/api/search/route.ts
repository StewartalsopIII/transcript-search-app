import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/embeddingService';
import { searchTranscripts } from '@/lib/database';
import { initDb } from '@/lib/initDb';
import { ApiResponse, SearchQuery, SearchResult } from '@/types';

// Initialize the database
initDb().catch(console.error);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the search query from the request body
    const body = await request.json();
    const { queryText } = body as SearchQuery;
    
    if (!queryText || typeof queryText !== 'string') {
      return NextResponse.json({
        status: 'error',
        message: 'Search query text is required',
      } as ApiResponse, { status: 400 });
    }
    
    // Generate embedding for the query text
    const queryEmbedding = await generateEmbedding(queryText);
    
    // Search for similar transcript segments
    const results = await searchTranscripts(queryEmbedding, 10);
    
    // Transform the results to match the SearchResult type
    const searchResults: SearchResult[] = results.map(row => ({
      id: row.id,
      source_file: row.source_file,
      start_timestamp: row.start_timestamp,
      end_timestamp: row.end_timestamp,
      text_content: row.text_content,
      similarity: parseFloat(row.similarity.toFixed(4)),
    }));
    
    // Return the response
    return NextResponse.json({
      status: 'success',
      message: `Found ${searchResults.length} results`,
      data: {
        results: searchResults,
      },
    } as ApiResponse);
    
  } catch (error) {
    console.error('Error searching transcripts:', error);
    return NextResponse.json({
      status: 'error',
      message: `Error searching transcripts: ${error instanceof Error ? error.message : String(error)}`,
    } as ApiResponse, { status: 500 });
  }
}