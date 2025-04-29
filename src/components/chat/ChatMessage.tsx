'use client';

import React from 'react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
}

export default function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  // Format the message with simple markdown-like styling
  const formatMessage = (text: string) => {
    // Replace URLs with clickable links
    const withLinks = text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">$1</a>'
    );
    
    // Replace line breaks with <br>
    const withBreaks = withLinks.replace(/\n/g, '<br>');
    
    return withBreaks;
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        <div
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: formatMessage(message) }}
        />
        {timestamp && (
          <div className="text-xs mt-1 text-gray-500">
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}