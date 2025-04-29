import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface FileUploadProps {
  onUploadComplete: (success: boolean, message: string) => void;
  onUploadStart: () => void;
  isUploading: boolean;
}

export default function FileUpload({ 
  onUploadComplete, 
  onUploadStart,
  isUploading 
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle drag events
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle file drop
  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };
  
  // Handle file input change
  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };
  
  // Process and upload the file
  const processFile = async (file: File) => {
    // Check file type
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      onUploadComplete(false, 'Only .txt and .md files are supported');
      return;
    }
    
    try {
      onUploadStart();
      
      // Create form data for the upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the file
      const response = await fetch('/api/process-transcript', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        onUploadComplete(true, result.message);
      } else {
        onUploadComplete(false, result.message);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      onUploadComplete(false, 'Error uploading file: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // Trigger file input click
  const onButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  
  return (
    <div 
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
        ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        transition-colors duration-200 ease-in-out
      `}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".txt,.md"
        onChange={handleChange}
        disabled={isUploading}
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-gray-700">Processing transcript...</p>
        </div>
      ) : (
        <>
          <svg 
            className="w-12 h-12 mx-auto text-gray-400 mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-700 mb-1">
            Drag and drop your transcript file here, or click to select
          </p>
          <p className="text-sm text-gray-500">
            Supports .txt and .md files
          </p>
        </>
      )}
    </div>
  );
}