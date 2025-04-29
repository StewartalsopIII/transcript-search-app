'use client';

import React from 'react';
import Link from 'next/link';
import ChatThread from '@/components/chat/ChatThread';

export default function ChatPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Transcript Chat</h1>
        <Link
          href="/"
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-200"
        >
          Back to Search
        </Link>
      </div>
      
      <ChatThread />
    </main>
  );
}