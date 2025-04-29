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
              <h3 className="font-medium text-sm mb-2">Source Segments</h3>
              {context.map((item, i) => (
                <div key={i} className="mb-3 p-2 border rounded bg-white text-xs">
                  <div className="font-medium truncate">{item.source}</div>
                  <div className="text-gray-500 mb-1">
                    {item.start} {item.end ? `- ${item.end}` : ''}
                    <span className="ml-1 px-1 bg-blue-100 rounded text-blue-800">
                      {(item.similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-gray-700">{item.text.substring(0, 150)}...</div>
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