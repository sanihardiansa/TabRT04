import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaSqlPath = path.join(__dirname, 'schema.sql');

/**
 * Split SQL into statements, respecting dollar-quoted strings ($$...$$)
 */
function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  const lines = sql.split('\n');

  for (const line of lines) {
    // Check for dollar quote boundaries
    const dollarMatches = line.match(/\$\$/g);
    if (dollarMatches) {
      for (const _ of dollarMatches) {
        inDollarQuote = !inDollarQuote;
      }
    }

    current += line + '\n';

    // Only split on semicolons when not inside a dollar-quoted block
    if (!inDollarQuote && line.trim().endsWith(';')) {
      const trimmed = current.trim();
      if (trimmed && trimmed !== ';') {
        statements.push(trimmed);
      }
      current = '';
    }
  }

  // Handle any remaining content
  const remaining = current.trim();
  if (remaining && remaining !== ';') {
    statements.push(remaining);
  }

  return statements;
}

async function runMigrations() {
  try {
    const schema = fs.readFileSync(schemaSqlPath, 'utf8');
    
    console.log('Running database migrations...');
    
    const statements = splitStatements(schema);
    for (const statement of statements) {
      try {
        await query(statement);
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
