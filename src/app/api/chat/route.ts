import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/chatService';
import { initDb } from '@/lib/initDb';

// Initialize database connection
initDb().catch(console.error);

// Define types
interface ChatRequest {
  message: string;
  history: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body
    const body = await request.json() as ChatRequest;
    const { message, history = [] } = body;
    
    if (!message) {
      return NextResponse.json({
        status: 'error',
        message: 'No message provided',
      }, { status: 400 });
    }
    
    // Generate chat response using the service
    const response = await generateChatResponse(message, history);
    
    // Return the response
    return NextResponse.json({
      status: 'success',
      data: {
        response: response.response,
        context: response.context.map(segment => ({
          source: segment.source_file,
          start: segment.start_timestamp,
          end: segment.end_timestamp,
          text: segment.text_content,
          similarity: parseFloat(segment.similarity.toFixed(2))
        }))
      },
    });
    
  } catch (error) {
    console.error('Error handling chat request:', error);
    return NextResponse.json({
      status: 'error',
      message: `Error generating response: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}