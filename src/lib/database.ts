import { Pool } from 'pg';
import { TranscriptSegment } from '@/types';

// Import pgvector correctly
import pgvector from 'pgvector';

// Create a PostgreSQL connection pool using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`,
});

// Initialize the database and create the necessary tables if they don't exist
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // First check if the vector extension is installed
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // Check if the table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'transcript_segments'
      );
    `);
    
    // If the table doesn't exist, create it
    if (!tableCheck.rows[0].exists) {
      await client.query(`
        CREATE TABLE transcript_segments (
          id SERIAL PRIMARY KEY,
          source_file TEXT NOT NULL,
          start_timestamp TEXT NOT NULL,
          end_timestamp TEXT,
          text_content TEXT NOT NULL,
          embedding vector(1536) NOT NULL
        );
      `);
      
      try {
        // Create an index for vector similarity search
        await client.query(`
          CREATE INDEX transcript_segments_embedding_idx 
          ON transcript_segments 
          USING ivfflat (embedding vector_cosine_ops);
        `);
      } catch (indexError) {
        // If the index creation fails (e.g., not enough data for ivfflat), log the error but continue
        console.warn('Warning: Could not create ivfflat index. This is normal for empty tables:', indexError);
      }
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Store a transcript segment with its embedding in the database
export async function storeTranscriptSegment(segment: TranscriptSegment) {
  if (!segment.embedding) {
    throw new Error('Segment embedding is required');
  }

  const client = await pool.connect();
  try {
    // Convert the embedding array to a pgvector compatible format
    const embeddingStr = `[${segment.embedding.join(',')}]`;
    
    await client.query(
      `
      INSERT INTO transcript_segments (source_file, start_timestamp, end_timestamp, text_content, embedding)
      VALUES ($1, $2, $3, $4, $5::vector)
      `,
      [
        segment.source_file,
        segment.start_timestamp,
        segment.end_timestamp,
        segment.text_content,
        embeddingStr
      ]
    );
  } catch (error) {
    console.error('Error storing transcript segment:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Search for transcript segments similar to the query embedding
export async function searchTranscripts(
  queryEmbedding: number[], 
  limit: number = 10,
  similarityThreshold: number = 0.6
) {
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
      WHERE 1 - (embedding <=> $1::vector) > $3
      ORDER BY embedding <=> $1::vector
      LIMIT $2
      `,
      [embeddingStr, limit, similarityThreshold]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error searching transcripts:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Export the pool for direct queries if needed
export { pool };