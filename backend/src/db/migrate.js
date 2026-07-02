import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaSqlPath = path.join(__dirname, 'schema.sql');

async function runMigrations() {
  try {
    const schema = fs.readFileSync(schemaSqlPath, 'utf8');
    
    console.log('Running database migrations...');
    
    // Split by statements and run each, ignoring "already exists" errors
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      try {
        await query(statement + ';');
      } catch (err) {
        // Ignore "already exists" errors for idempotent migrations
        if (err.code === '42710' || err.code === '42P07' || err.code === '42P16') {
          console.log(`⏭️  Skipped (already exists): ${statement.trim().slice(0, 50)}...`);
        } else {
          throw err;
        }
      }
    }
    
    console.log('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
