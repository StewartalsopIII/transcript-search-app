'use client';

import React, { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  source: string;
  start: string;
  end: string | null;
  text: string;
  similarity: number;
}

export default function ChatThread() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<ChatContext[]>([]);
  const [showContext, setShowContext] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: messages,
        }),
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        // Add assistant response to chat
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Store context for reference
        setContext(result.data.context);
      } else {
        setError(result.message || 'An error occurred while sending your message');
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg flex flex-col h-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Podcast Transcript Chat</h2>
          <button
            onClick={() => setShowContext(!showContext)}
            className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            {showContext ? 'Hide Sources' : 'Show Sources'}
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Ask any question about the podcast transcripts...</p>
              </div>
            ) : (
              messages
                .filter((msg) => msg.role !== 'system')
                .map((msg, index) => (
                  <ChatMessage
                    key={index}
                    message={msg.content}
                    isUser={msg.role === 'user'}
                  />
                ))
            )}
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg my-2">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {showContext && context.length > 0 && (
            <div className="w-1/3 border-l overflow-y-auto p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-sm">Source Segments ({context.length})</h3>
                <div className="text-xs text-gray-500">
                  {context.length > 0 && `Showing ${context.length} relevant segments`}
                </div>
              </div>
              
              {/* Group segments by source file */}
              {Object.entries(
                context.reduce((groups, item) => {
                  const source = item.source;
                  if (!groups[source]) groups[source] = [];
                  groups[source].push(item);
                  return groups;
                }, {} as Record<string, ChatContext[]>)
              ).map(([source, items]) => (
                <div key={source} className="mb-4">
                  <div className="font-medium text-xs bg-gray-100 p-1 rounded mb-2">{source}</div>
                  {items
                    .sort((a, b) => b.similarity - a.similarity) // Sort by similarity within group
                    .map((item, i) => (
                      <div 
                        key={i} 
                        className="mb-3 p-2 border rounded bg-white text-xs hover:border-blue-300 transition-colors"
                        style={{ 
                          borderLeft: `3px solid ${
                            item.similarity > 0.8 ? 'rgb(59, 130, 246)' : // blue-500
                            item.similarity > 0.7 ? 'rgb(14, 165, 233)' : // sky-500
                            'rgb(186, 230, 253)' // sky-200
                          }`
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-gray-500 text-xs">
                            {item.start.replace(/,\d+$/, '')} {item.end ? `- ${item.end.replace(/,\d+$/, '')}` : ''}
                          </div>
                          <span className="px-1 bg-blue-100 rounded text-blue-800 text-xs font-medium">
                            {(item.similarity * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-gray-700 mt-1 whitespace-pre-line">
                          {item.text.length > 200 
                            ? `${item.text.substring(0, 200)}...` 
                            : item.text
                          }
                        </div>
                      </div>
                    ))
                  }
                </div>
              ))}
            </div>
          )}
        </div>
        
        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}