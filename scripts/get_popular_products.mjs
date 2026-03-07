import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  `SELECT id, name, brand, prefecture, category FROM products 
   WHERE badges LIKE '%bestseller%' OR badges LIKE '%editorial%' OR editorialPick = 1
   ORDER BY reviewCount DESC, likeCount DESC
   LIMIT 20`
);
await conn.end();
console.log(JSON.stringify(rows, null, 2));
