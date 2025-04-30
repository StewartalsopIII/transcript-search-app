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
 * Clean transcript segments to improve embedding quality
 * 
 * @param segment The transcript segment to clean
 * @returns The cleaned segment
 */
export function cleanTranscriptSegment(segment: TranscriptSegment): TranscriptSegment {
  // Create a copy of the segment to avoid modifying the original
  const cleanedSegment = { ...segment };
  
  // Clean the text content
  if (cleanedSegment.text_content) {
    // Remove redundant whitespace
    cleanedSegment.text_content = cleanedSegment.text_content.trim().replace(/\s+/g, ' ');
    
    // Remove any speaker identifiers like "[Speaker]:" or "Speaker:"
    cleanedSegment.text_content = cleanedSegment.text_content.replace(/^\s*\[?[A-Za-z\s]+\]?:\s*/g, '');
    
    // Remove any non-content markers like "[inaudible]", "[music]", etc.
    cleanedSegment.text_content = cleanedSegment.text_content.replace(/\[\w+\]/g, '');
    
    // Clean up any orphaned punctuation caused by the above removals
    cleanedSegment.text_content = cleanedSegment.text_content.replace(/\s+([.,;:!?])/g, '$1');
    cleanedSegment.text_content = cleanedSegment.text_content.replace(/([.,;:!?])\s+([.,;:!?])/g, '$1$2');
    
    // Final trim and whitespace normalization
    cleanedSegment.text_content = cleanedSegment.text_content.trim().replace(/\s+/g, ' ');
  }
  
  return cleanedSegment;
}

/**
 * Apply additional chunking to transcript segments if needed
 * This function can be extended to implement more sophisticated chunking strategies
 * 
 * @param segments The original transcript segments
 * @param maxTokens Optional maximum token count per chunk
 * @returns The chunked segments
 */
export function chunkTranscriptSegments(
  segments: TranscriptSegment[],
  maxTokens: number = 500
): TranscriptSegment[] {
  // Clean each segment
  const cleanedSegments = segments.map(cleanTranscriptSegment);
  
  // Additional chunking logic (not yet implemented)
  // For now, we're treating each segment as a chunk
  // In a more advanced implementation, you might want to:
  // 1. Split very long segments into smaller chunks
  // 2. Combine very small segments
  // 3. Apply more sophisticated chunking strategies
  
  return cleanedSegments;
}