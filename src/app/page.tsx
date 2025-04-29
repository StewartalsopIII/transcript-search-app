'use client';

import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import Search from '@/components/Search';
import SearchResults from '@/components/SearchResults';
import Notification from '@/components/Notification';
import { SearchResult } from '@/types';

export default function Home() {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  const handleUploadComplete = (success: boolean, message: string) => {
    setIsUploading(false);
    setNotification({
      type: success ? 'success' : 'error',
      message
    });
  };
  
  const handleUploadStart = () => {
    setIsUploading(true);
  };
  
  const handleSearch = (results: SearchResult[]) => {
    setSearchResults(results);
  };
  
  const clearNotification = () => {
    setNotification(null);
  };
  
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">
        Transcript Search with Embeddings
      </h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Transcript</h2>
        <FileUpload 
          onUploadComplete={handleUploadComplete} 
          onUploadStart={handleUploadStart}
          isUploading={isUploading}
        />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Search Transcripts</h2>
        <Search onSearch={handleSearch} />
      </div>
      
      <SearchResults results={searchResults} />
      
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={clearNotification}
        />
      )}
    </main>
  );
}