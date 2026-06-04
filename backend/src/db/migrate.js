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
    await query(schema);
    console.log('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
