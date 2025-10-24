import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const file = join(__dirname, 'db.json');
const adapter = new JSONFile(file);
export const db = new Low(adapter, { strings: [] });

// Read DB asynchronously. Avoid top-level await so module exports are available immediately.
db.read().catch(() => {});
