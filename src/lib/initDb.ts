import { initializeDatabase } from './database';

/**
 * Initialize the database connection and schema
 * This should be called when the application starts
 */
export async function initDb() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}