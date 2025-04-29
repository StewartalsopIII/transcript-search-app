import { TranscriptSegment } from '@/types';

/**
 * Parse transcript content into segments
 * This parser is designed for the specific format observed in the example:
 * 1. Numbered segments
 * 2. Timestamps in the format "00:00:00,000 --> 00:00:04,000"
 * 3. Text content following the timestamp
 * 4. Segments separated by blank lines
 * 
 * @param content The transcript content as a string
 * @param fileName The name of the source file
 * @returns An array of transcript segments
 */
export function parseTranscript(content: string, fileName: string): TranscriptSegment[] {
  // Split the content by lines
  const lines = content.split('\n');
  const segments: TranscriptSegment[] = [];
  
  let currentSegment: Partial<TranscriptSegment> | null = null;
  let textLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines or handle as segment separators
    if (!line) {
      if (currentSegment && textLines.length > 0) {
        // Complete current segment
        currentSegment.text_content = textLines.join(' ').trim();
        segments.push(currentSegment as TranscriptSegment);
        
        // Reset for next segment
        currentSegment = null;
        textLines = [];
      }
      continue;
    }
    
    // Check if this is a segment number
    if (/^\d+$/.test(line)) {
      // New segment starts
      if (currentSegment && textLines.length > 0) {
        // Complete previous segment
        currentSegment.text_content = textLines.join(' ').trim();
        segments.push(currentSegment as TranscriptSegment);
        textLines = [];
      }
      
      // Initialize new segment
      currentSegment = {
        source_file: fileName,
        start_timestamp: '',
        end_timestamp: null,
      };
      continue;
    }
    
    // Check if this is a timestamp line
    const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    if (timestampMatch && currentSegment) {
      currentSegment.start_timestamp = timestampMatch[1];
      currentSegment.end_timestamp = timestampMatch[2];
      continue;
    }
    
    // Otherwise, it's content text
    if (currentSegment) {
      textLines.push(line);
    }
  }
  
  // Add the last segment if it exists
  if (currentSegment && textLines.length > 0) {
    currentSegment.text_content = textLines.join(' ').trim();
    segments.push(currentSegment as TranscriptSegment);
  }
  
  return segments;
}

/**
 * Apply additional chunking to transcript segments if needed
 * This function can be extended to implement more sophisticated chunking strategies
 * Currently, it just returns the original segments
 * 
 * @param segments The original transcript segments
 * @param maxTokens Optional maximum token count per chunk
 * @returns The chunked segments
 */
export function chunkTranscriptSegments(
  segments: TranscriptSegment[],
  maxTokens: number = 500
): TranscriptSegment[] {
  // For now, we're treating each segment as a chunk
  // In a more advanced implementation, you might want to:
  // 1. Split very long segments into smaller chunks
  // 2. Combine very small segments
  // 3. Apply more sophisticated chunking strategies
  
  return segments;
}