import React, { useState, FormEvent } from 'react';
import { SearchResult } from '@/types';

interface SearchProps {
  onSearch: (results: SearchResult[]) => void;
}

export default function Search({ onSearch }: SearchProps) {
  const [queryText, setQueryText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!queryText.trim()) {
      setError('Please enter a search query');
      return;
    }
    
    setError(null);
    setIsSearching(true);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queryText }),
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        onSearch(result.data.results);
      } else {
        setError(result.message);
        onSearch([]);
      }
    } catch (error) {
      console.error('Error searching transcripts:', error);
      setError('Error searching transcripts: ' + (error instanceof Error ? error.message : String(error)));
      onSearch([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="Enter search query..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSearching}
        />
        <button
          type="submit"
          className={`px-4 py-2 rounded-md text-white font-medium 
            ${isSearching ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} 
            transition-colors duration-200 ease-in-out`}
          disabled={isSearching}
        >
          {isSearching ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Searching...
            </div>
          ) : (
            'Search'
          )}
        </button>
      </form>
      
      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}