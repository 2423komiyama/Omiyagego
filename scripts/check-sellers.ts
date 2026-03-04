import { getDb } from '../server/db';
import { sellers } from '../drizzle/schema';

async function check() {
  const db = await getDb();
  if (!db) { console.log('no db'); return; }
  const result = await db.select().from(sellers).limit(3);
  console.log(JSON.stringify(result, null, 2));
}
check().catch(console.error);
