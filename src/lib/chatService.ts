import { OpenAI } from 'openai';
import { pool } from './database';
import { generateEmbedding } from './embeddingService';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type definitions
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface TranscriptSegment {
  id: number;
  source_file: string;
  start_timestamp: string;
  end_timestamp: string | null;
  text_content: string;
  similarity: number;
}

/**
 * Search for transcript segments similar to the query embedding
 */
export async function searchSimilarSegments(queryEmbedding: number[], limit: number = 5): Promise<TranscriptSegment[]> {
  const client = await pool.connect();
  try {
    // Convert the query embedding array to a pgvector compatible format
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    
    const result = await client.query(
      `
      SELECT 
        id, 
        source_file, 
        start_timestamp, 
        end_timestamp, 
        text_content,
        1 - (embedding <=> $1::vector) as similarity
      FROM transcript_segments
      ORDER BY embedding <=> $1::vector
      LIMIT $2
      `,
      [embeddingStr, limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error searching transcripts:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Format retrieved transcript segments into context for the LLM
 */
function buildContextFromSegments(segments: TranscriptSegment[]): string {
  return segments.map(segment => {
    const header = `Source: ${segment.source_file} | Time: ${segment.start_timestamp}${segment.end_timestamp ? ` to ${segment.end_timestamp}` : ''}`;
    return `---\n${header}\n${segment.text_content}\n`;
  }).join('\n');
}

/**
 * Generate a response to a user message using retrieved context
 */
export async function generateChatResponse(
  userMessage: string, 
  chatHistory: ChatMessage[] = []
): Promise<{ response: string; context: TranscriptSegment[] }> {
  try {
    // Generate embedding for the user query
    const queryEmbedding = await generateEmbedding(userMessage);
    
    // Retrieve relevant transcript segments
    const relevantSegments = await searchSimilarSegments(queryEmbedding, 5);
    
    // Build context from segments
    const context = buildContextFromSegments(relevantSegments);
    
    // Create the system message with instructions
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are an expert analyst of podcast transcripts. 

APPROACH TO INFORMATION:
- Synthesize information across all provided segments to form complete concepts
- Present information with confidence when supported by multiple segments
- Acknowledge uncertainty only when truly unclear
- Connect related ideas from different parts of the conversation
- Distinguish between established facts and speculative ideas in the transcript

RESPONSE STRUCTURE:
1. Begin with a clear definition/overview of the concept
2. Organize information by themes rather than timestamps
3. Explain the purpose/application of the concept
4. Describe how it relates to broader topics discussed
5. Conclude with a concise summary

STYLE GUIDELINES:
- Use a confident, authoritative tone
- Prioritize conceptual understanding over timestamp ordering
- Include references discretely at the end of relevant points (not mid-sentence)
- If a concept appears across multiple segments, integrate the information holistically
- For technical concepts, provide explanations accessible to a knowledgeable audience

If the answer cannot be found in the transcript segments, clearly state this limitation.`
    };
    
    // Format the user message with context
    const userMessageWithContext: ChatMessage = {
      role: 'user',
      content: `${userMessage}\n\nHere are relevant transcript segments to help with your response:\n\n${context}`
    };
    
    // Combine history with current messages
    // Limit history to prevent context window issues
    const recentHistory = chatHistory.slice(-4);
    const messages = [
      systemMessage,
      ...recentHistory,
      userMessageWithContext
    ];
    
    // Generate response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const response = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    
    return {
      response,
      context: relevantSegments
    };
  } catch (error) {
    console.error('Error in chat response generation:', error);
    throw error;
  }
}

/**
 * Format chat history for display
 */
export function formatChatHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(msg => msg.role !== 'system');
}