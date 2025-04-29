import React from 'react';
import { SearchResult } from '@/types';

interface SearchResultsProps {
  results: SearchResult[];
}

export default function SearchResults({ results }: SearchResultsProps) {
  if (results.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Search Results</h2>
      <div className="space-y-4">
        {results.map((result) => (
          <div 
            key={result.id} 
            className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-gray-500">
                {result.source_file}
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                {result.similarity.toFixed(2)} similarity
              </span>
            </div>
            
            <p className="text-gray-800 mb-2">
              {result.text_content}
            </p>
            
            <div className="text-sm text-gray-600">
              <span>
                {result.start_timestamp}
                {result.end_timestamp ? ` → ${result.end_timestamp}` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}