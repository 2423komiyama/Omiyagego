import "dotenv/config";
import { getDb } from "../server/db";
import { products } from "../drizzle/schema";
import { writeFileSync } from "fs";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DB connection failed");
  const rows = await db
    .select({ id: products.id, name: products.name, brand: products.brand, prefecture: products.prefecture })
    .from(products);
  writeFileSync("/home/ubuntu/products_for_brandurl.json", JSON.stringify(rows, null, 2));
  console.log("Exported", rows.length, "products");
  process.exit(0);
}

main().catch(console.error);
