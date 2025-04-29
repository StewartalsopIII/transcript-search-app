# Transcript Search with Embeddings

This application allows you to upload transcript files (in `.txt` or `.md` format), process them using OpenAI's embedding API, and perform semantic searches using vector similarity.

## Features

- Drag-and-drop file uploads for transcript files
- Parsing of timestamped transcript segments
- Generation of vector embeddings for transcript segments
- Storage of transcript data and embeddings using PostgreSQL with pgvector extension
- Vector similarity search for finding relevant transcript segments

## Prerequisites

1. **PostgreSQL**: Install PostgreSQL 14+ with the pgvector extension
   ```
   # For macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # For Linux
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **pgvector Setup**: Install the pgvector extension in your PostgreSQL database
   ```sql
   CREATE EXTENSION vector;
   ```

3. **Database Setup**: Create a database for the application
   ```sql
   CREATE DATABASE transcript_search_db;
   ```

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your environment variables in `.env.local`:
   ```
   # OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key_here
   
   # PostgreSQL Connection
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/transcript_search_db
   
   # Or use individual parameters
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=transcript_search_db
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. **Upload Transcripts**:
   - Drag and drop a `.txt` or `.md` transcript file onto the upload zone, or click to select a file
   - The application will process the file, extracting the timestamped segments, generating embeddings, and storing them in PostgreSQL

2. **Search Transcripts**:
   - Enter a search query in the search box and click "Search"
   - The application will find transcript segments that are semantically similar to your query and display them ranked by similarity

## Transcript Format

The application is designed to work with transcripts in the following format:
```
1
00:00:00,000 --> 00:00:04,000
Welcome to the podcast.

2
00:00:04,000 --> 00:00:08,000
Today we're talking about...
```

Each segment consists of:
1. A segment number
2. A timestamp line in the format `HH:MM:SS,mmm --> HH:MM:SS,mmm`
3. The transcript text
4. A blank line separating segments

## Technologies Used

- Next.js (App Router)
- React
- OpenAI Embeddings API
- PostgreSQL with pgvector extension for vector similarity search
- Tailwind CSS