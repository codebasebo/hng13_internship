import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database file path
const file = join(__dirname, '../../data/db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, {});

// Initialize database with default data
async function initDB() {
  await db.read();
  
  db.data = db.data || { countries: [], metadata: { last_refreshed_at: null } };
  
  await db.write();
}

// Initialize on module load
await initDB();

export default db;
