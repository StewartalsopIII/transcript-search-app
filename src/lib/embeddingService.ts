import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Embedding model to use
const EMBEDDING_MODEL = 'text-embedding-ada-002';

/**
 * Generate an embedding vector for the given text
 * @param text The text to generate an embedding for
 * @returns An array of floating point numbers representing the embedding
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Remove any excess whitespace to clean the text
    const cleanedText = text.trim().replace(/\s+/g, ' ');
    
    // Get the embedding from OpenAI
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: cleanedText,
    });

    // Return the embedding vector
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
  }
}