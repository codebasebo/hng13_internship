import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const adapter = new JSONFile("./src/db/database.json");
const db = new Low(adapter, { countries: [], last_refreshed_at: null });

await db.read();
db.data ||= { countries: [], last_refreshed_at: null };

export default db;
