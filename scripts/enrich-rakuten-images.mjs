// ブランド名まで一致確認済みの楽天商品画像を realImageUrl に反映する。
// 対象は products.json 補完リストのうちブランド一致が確認できた11件のみ
// （ブランド不一致・0件だった10件は誤情報回避のため対象外）。
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data-export");
const applyDb = process.argv.includes("--apply-db");

const hiRes = (url) => url.replace(/\?_ex=\d+x\d+$/, "?_ex=500x500");

const updates = [
  { id: "ngy_33db7d9cfc37", imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/nagoyakoutin/cabinet/05385986/11074152/imgrc0097765795.jpg?_ex=128x128" },
  { id: "ngy_3e022c49eb9a", imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/r-food/cabinet/yabaton/item_mset_img01.jpg?_ex=128x128" },
  { id: "ngy_789db103e3d2", imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/f232190-komaki/cabinet/a05/004o02-sku2.jpg?_ex=128x128" },
  { id: "ngy_bb663fb71b78", imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/shachimonaka/cabinet/09600408/shachimonaka1.jpg?_ex=128x128" },
  { id: "ngy_cad2b63f0b90", imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/f231002-nagoya/cabinet/frp_goods/frp035/23800262.jpg?_ex=128x128" },
  { id: "p-hiroshima-016", imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/89kingdom/cabinet/cabinet2/wik1127_001.jpg?_ex=128x128" },
  { id: "shz_3fef96978941", imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/shunkado/cabinet/default/shunkado/products_img/imgrc0104531759.jpg?_ex=128x128" },
  { id: "shz_775c0d3ad3fa", imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/aikane/cabinet/poshu400x400.jpg?_ex=128x128" },
  { id: "shz_d328c98a0615", imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/tohei-ya/cabinet/mishimacorokke/cover02.jpg?_ex=128x128" },
  { id: "shz_e48734e769bd", imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/dinos/cabinet/ir_228/fj0242c1.jpg?_ex=128x128" },
  { id: "shz_ed76a17b5d68", imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/misonoya/cabinet/202603_13/b105-16-1.jpg?_ex=128x128" },
].map((u) => ({ id: u.id, realImageUrl: hiRes(u.imageUrl) }));

const productsPath = path.join(DATA_DIR, "products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
const byId = new Map(products.map((p) => [p.id, p]));

let applied = 0;
for (const u of updates) {
  const p = byId.get(u.id);
  if (!p) {
    console.warn(`skip: product ${u.id} not found in local data-export`);
    continue;
  }
  p.realImageUrl = u.realImageUrl;
  applied++;
}
fs.writeFileSync(productsPath, JSON.stringify(products, null, 1));
console.log(`data-export/products.json: realImageUrl updated for ${applied}/${updates.length} products.`);

if (applyDb) {
  const { drizzle } = await import("drizzle-orm/mysql2");
  const { products: productsTable } = await import("../drizzle/schema.ts");
  const { eq } = await import("drizzle-orm");

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set; skipping DB apply.");
    process.exit(1);
  }

  const db = drizzle({
    connection: {
      uri: process.env.DATABASE_URL,
      ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    },
  });

  for (const u of updates) {
    await db.update(productsTable).set({ realImageUrl: u.realImageUrl }).where(eq(productsTable.id, u.id));
    console.log(`DB updated: ${u.id}`);
  }
  console.log("DB apply complete.");
}
