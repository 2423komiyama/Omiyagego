// 旧本番（Manus上でまだ稼働中）の公開tRPC APIから全データを吸い出すサルベージスクリプト。
// 使い方: node scripts/export-from-prod.mjs
// 出力: data-export/{facilities,products,sellers,reviews,curated_links,features,meta}.json

import fs from "node:fs";
import path from "node:path";

const BASE = "https://omiyagego-axrcumbv.manus.space/api/trpc";
const OUT_DIR = path.join(process.cwd(), "data-export");
const CONCURRENCY = 8;

async function call(proc, input, retries = 3) {
  const encoded = encodeURIComponent(JSON.stringify({ 0: { json: input } }));
  const url = `${BASE}/${proc}?batch=1&input=${encoded}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json[0]?.error) throw new Error(JSON.stringify(json[0].error).slice(0, 200));
      return json[0].result.data.json;
    } catch (err) {
      if (attempt >= retries) throw new Error(`${proc} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    })
  );
  return results;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const save = (name, data) => {
  fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(data, null, 1));
  console.log(`saved ${name}.json (${Array.isArray(data) ? data.length : "obj"})`);
};

// 1. 施設
const facilities = await call("facilities.list", null);
save("facilities", facilities);

// 2. 商品一覧（ページング全件）
const products = [];
for (let offset = 0; ; offset += 100) {
  const page = await call("products.search", { limit: 100, offset });
  const items = page.products ?? page;
  products.push(...items);
  process.stdout.write(`\rproducts: ${products.length}`);
  if (items.length < 100) break;
}
console.log();

// 3. 商品詳細＋売り場＋レビュー（商品ごと）
const sellers = [];
const reviews = [];
let done = 0;
const detailed = await mapLimit(products, CONCURRENCY, async p => {
  const detail = await call("products.get", { id: p.id });
  if (detail?.sellers) {
    for (const s of detail.sellers) sellers.push(s);
  }
  try {
    const r = await call("reviews.list", { productId: p.id, limit: 100, offset: 0 });
    const list = r?.reviews ?? r;
    if (Array.isArray(list)) reviews.push(...list);
  } catch {
    // レビュー無しは無視
  }
  done++;
  if (done % 50 === 0) process.stdout.write(`\rdetails: ${done}/${products.length}`);
  const { sellers: _s, ...productOnly } = detail ?? {};
  return detail ? productOnly : p;
});
console.log(`\rdetails: ${done}/${products.length}`);

save("products", detailed);
save("sellers", sellers);
save("reviews", reviews);

// 4. その他の公開データ
try { save("curated_links", await call("curatedLinks.getActive", null)); } catch (e) { console.warn("curated_links skip:", e.message); }
try { save("features", await call("features.list", null)); } catch (e) { console.warn("features skip:", e.message); }

save("meta", {
  exportedAt: new Date().toISOString(),
  source: BASE,
  counts: {
    facilities: facilities.length,
    products: detailed.length,
    sellers: sellers.length,
    reviews: reviews.length,
  },
});
console.log("done.");
