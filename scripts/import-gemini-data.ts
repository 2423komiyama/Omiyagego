import fs from 'fs';
import { getDb } from '../server/db';
import { products } from '../drizzle/schema';

async function importGeminiData() {
  const data = JSON.parse(fs.readFileSync('./gemini_combined_data.json', 'utf-8'));
  
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  console.log(`Starting import of ${data.products.length} products...`);
  
  for (const product of data.products) {
    try {
      const id = product.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const guaranteeReason = typeof product.guaranteeReason === 'string' 
        ? product.guaranteeReason 
        : JSON.stringify(product.guaranteeReason || []);
      const badges = typeof product.badges === 'string' 
        ? product.badges 
        : JSON.stringify(product.badges || []);
      
      await db.insert(products).values({
        id,
        name: product.name,
        brand: product.brand,
        description: product.description || null,
        price: product.price,
        imageUrl: product.imageUrl || null,
        prefecture: product.prefecture,
        region: product.region,
        category: product.category || 'その他',
        shelfLife: product.shelfLife || null,
        isIndividualPackaged: product.isIndividualPackaged || false,
        servingSize: product.servingSize || null,
        guaranteeReason: guaranteeReason,
        makerStory: product.makerStory || null,
        badges: badges,
      });
      successCount++;
      console.log(`✓ Imported: ${product.name}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Error importing "${product.name}":`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log(`\n=== Import Complete ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${successCount + errorCount}`);
}

importGeminiData().catch(console.error);
