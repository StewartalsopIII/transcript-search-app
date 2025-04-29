import { NextRequest, NextResponse } from 'next/server';
import { parseTranscript, chunkTranscriptSegments } from '@/lib/transcriptParser';
import { generateEmbedding } from '@/lib/embeddingService';
import { storeTranscriptSegment } from '@/lib/database';
import { initDb } from '@/lib/initDb';
import { ApiResponse } from '@/types';

// Initialize the database
initDb().catch(console.error);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({
        status: 'error',
        message: 'No file provided',
      } as ApiResponse, { status: 400 });
    }
    
    // Check file type
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      return NextResponse.json({
        status: 'error',
        message: 'Only .txt and .md files are supported',
      } as ApiResponse, { status: 400 });
    }
    
    // Read the file content
    const fileContent = await file.text();
    
    // Parse the transcript
    const segments = parseTranscript(fileContent, file.name);
    
    // Apply chunking if needed
    const chunks = chunkTranscriptSegments(segments);
    
    // Process each chunk: generate embedding and store in PostgreSQL
    const processingResults = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          // Generate embedding for the chunk
          const embedding = await generateEmbedding(chunk.text_content);
          
          // Store the chunk with its embedding
          await storeTranscriptSegment({
            ...chunk,
            embedding,
          });
          
          return {
            success: true,
            segment: chunk,
          };
        } catch (error) {
          console.error('Error processing segment:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            segment: chunk,
          };
        }
      })
    );
    
    // Count successful segments
    const successfulSegments = processingResults.filter(result => result.success).length;
    const failedSegments = processingResults.filter(result => !result.success).length;
    
    // Return the response
    return NextResponse.json({
      status: 'success',
      message: `Processed ${successfulSegments} segments successfully${failedSegments > 0 ? `, ${failedSegments} segments failed` : ''}`,
      data: {
        totalSegments: chunks.length,
        successful: successfulSegments,
        failed: failedSegments,
      },
    } as ApiResponse);
    
  } catch (error) {
    console.error('Error processing transcript:', error);
    return NextResponse.json({
      status: 'error',
      message: `Error processing transcript: ${error instanceof Error ? error.message : String(error)}`,
    } as ApiResponse, { status: 500 });
  }
}