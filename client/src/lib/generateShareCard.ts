// ============================================================
// Omiyage Go - SNSシェアカード生成（Canvas API・外部ライブラリなし）
// Instagramストーリーズ想定の縦長(9:16)画像を商品情報から合成する。
//
// 商品写真はCORS制約で読み込み・toBlob()に失敗することがある
// （crossOrigin未対応の外部ドメイン画像など）。その場合は
// 写真なし・テキストのみのフォールバックカードを生成する。
// ============================================================

export interface ShareCardInput {
  productName: string;
  price: number;
  prefecture: string;
  facilityName?: string; // 施設名・売り場名（あれば）。無ければ都道府県のみ表示
  brand?: string;
  imageUrl?: string;
}

export interface ShareCardResult {
  blob: Blob;
  dataUrl: string;
  /** 商品写真の合成に失敗し、テキストのみのカードにフォールバックした場合 true */
  isFallback: boolean;
}

const CARD_W = 1080;
const CARD_H = 1920; // 9:16
const MARGIN = 64;
const EMERALD = "#047857"; // emerald-700
const EMERALD_DARK = "#065f46"; // emerald-800
const EMERALD_LIGHT = "#d1fae5"; // emerald-100
const STONE_BG = "#faf9f7";
const STONE_TEXT = "#292524";
const STONE_SUB = "#78716c";

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 指定幅で文字列を折り返し、最大行数を超えたら末尾を "…" にする */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const chars = Array.from(text);
  const lines: string[] = [];
  let current = "";

  for (const ch of chars) {
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = ch;
      if (lines.length === maxLines) {
        current = "";
        break;
      }
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  if (lines.length > maxLines) {
    const truncated = lines.slice(0, maxLines);
    const last = truncated[maxLines - 1];
    let lastTrimmed = last;
    while (
      ctx.measureText(lastTrimmed + "…").width > maxWidth &&
      lastTrimmed.length > 1
    ) {
      lastTrimmed = lastTrimmed.slice(0, -1);
    }
    truncated[maxLines - 1] = lastTrimmed + "…";
    return truncated;
  }
  return lines;
}

/** 画像を読み込む。crossOrigin=anonymousで試行し、失敗したらnullを返す */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timeout = setTimeout(() => resolve(null), 8000);
    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };
    img.src = url;
  });
}

/** canvasがCORS汚染されていないか（toDataURLが例外を投げないか）を確認する */
function isCanvasTainted(canvas: HTMLCanvasElement): boolean {
  try {
    canvas.getContext("2d")!.getImageData(0, 0, 1, 1);
    return false;
  } catch {
    return true;
  }
}

function drawBrandFooter(ctx: CanvasRenderingContext2D, y: number) {
  // ロゴマーク
  const logoSize = 56;
  const logoX = CARD_W / 2 - 120;
  roundedRect(ctx, logoX, y, logoSize, logoSize, 14);
  ctx.fillStyle = EMERALD;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 30px 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("O", logoX + logoSize / 2, y + logoSize / 2 + 2);

  ctx.textAlign = "left";
  ctx.fillStyle = STONE_TEXT;
  ctx.font = "900 34px 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillText("Omiyage Go", logoX + logoSize + 16, y + logoSize / 2 + 2);

  ctx.font = "500 22px 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillStyle = STONE_SUB;
  ctx.textAlign = "center";
  ctx.fillText("外さない手土産を15分で決める", CARD_W / 2, y + logoSize + 42);
  ctx.textAlign = "left";
}

function drawTextOnlyCard(
  ctx: CanvasRenderingContext2D,
  input: ShareCardInput
) {
  // 背景: emeraldグラデーション（写真の代わり）
  const grad = ctx.createLinearGradient(0, 0, 0, CARD_H * 0.6);
  grad.addColorStop(0, EMERALD_DARK);
  grad.addColorStop(1, EMERALD);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H * 0.62);

  // 装飾の丸
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(CARD_W - 100, 160, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(80, CARD_H * 0.5, 160, 0, Math.PI * 2);
  ctx.fill();

  // ギフトアイコン風の絵文字テキスト
  ctx.font = "160px 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("🎁", CARD_W / 2, CARD_H * 0.32);

  ctx.font = "700 30px 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("今回のお土産", CARD_W / 2, CARD_H * 0.32 + 90);
  ctx.textAlign = "left";

  drawInfoBlock(ctx, input, CARD_H * 0.62);
}

function drawInfoBlock(
  ctx: CanvasRenderingContext2D,
  input: ShareCardInput,
  startY: number
) {
  let y = startY + 80;

  // 価格バッジ
  ctx.font = "900 30px 'Hiragino Sans', 'Yu Gothic', sans-serif";
  const priceText = `¥${input.price.toLocaleString()}`;
  const priceW = ctx.measureText(priceText).width + 56;
  roundedRect(ctx, MARGIN, y, priceW, 76, 38);
  ctx.fillStyle = EMERALD_LIGHT;
  ctx.fill();
  ctx.fillStyle = EMERALD_DARK;
  ctx.textBaseline = "middle";
  ctx.fillText(priceText, MARGIN + 28, y + 40);
  ctx.textBaseline = "alphabetic";
  y += 76 + 44;

  // 商品名
  ctx.font = "900 56px 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillStyle = STONE_TEXT;
  const nameLines = wrapText(ctx, input.productName, CARD_W - MARGIN * 2, 3);
  for (const line of nameLines) {
    ctx.fillText(line, MARGIN, y);
    y += 66;
  }
  y += 16;

  // ブランド
  if (input.brand) {
    ctx.font = "500 32px 'Hiragino Sans', 'Yu Gothic', sans-serif";
    ctx.fillStyle = STONE_SUB;
    ctx.fillText(input.brand, MARGIN, y);
    y += 56;
  }

  // 施設名・都道府県
  y += 8;
  ctx.font = "700 34px 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillStyle = EMERALD_DARK;
  // 位置ピン（簡易図形）
  const pinX = MARGIN + 12;
  const pinY = y - 12;
  ctx.beginPath();
  ctx.arc(pinX, pinY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(pinX - 8, pinY + 6);
  ctx.lineTo(pinX + 8, pinY + 6);
  ctx.lineTo(pinX, pinY + 22);
  ctx.closePath();
  ctx.fill();

  const locationText = input.facilityName
    ? `${input.facilityName}（${input.prefecture}）`
    : input.prefecture;
  const locLines = wrapText(ctx, locationText, CARD_W - MARGIN * 2 - 36, 2);
  ctx.fillText(locLines[0] ?? "", MARGIN + 34, y);
  y += 46;
  if (locLines[1]) {
    ctx.fillText(locLines[1], MARGIN + 34, y);
    y += 46;
  }

  // フッター（ロゴ）は下端固定
  drawBrandFooter(ctx, CARD_H - 190);
}

function drawPhotoCard(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  input: ShareCardInput
) {
  const photoTop = 0;
  const photoH = CARD_H * 0.58;

  // 写真をcover方式で描画
  const scale = Math.max(CARD_W / img.width, photoH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (CARD_W - dw) / 2;
  const dy = photoTop + (photoH - dh) / 2;

  ctx.save();
  roundedRect(ctx, 0, 0, CARD_W, photoH, 0);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();

  // 写真下部のグラデーションオーバーレイ（可読性向上）
  const overlay = ctx.createLinearGradient(0, photoH - 220, 0, photoH);
  overlay.addColorStop(0, "rgba(0,0,0,0)");
  overlay.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, photoH - 220, CARD_W, 220);

  drawInfoBlock(ctx, input, photoH);
}

/**
 * 商品情報からSNSシェア用の縦長カード画像を生成する。
 * 商品写真の読み込み・canvas合成に失敗した場合はテキストのみの
 * フォールバックカードを生成し、`isFallback: true` を返す。
 */
export async function generateShareCard(
  input: ShareCardInput
): Promise<ShareCardResult> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D コンテキストを取得できませんでした");
  }

  // 背景
  ctx.fillStyle = STONE_BG;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  let isFallback = true;

  if (input.imageUrl) {
    const img = await loadImage(input.imageUrl);
    if (img) {
      try {
        drawPhotoCard(ctx, img, input);
        if (!isCanvasTainted(canvas)) {
          isFallback = false;
        } else {
          throw new Error("tainted canvas");
        }
      } catch {
        // CORS等で描画に失敗 → 背景をリセットしてテキストのみカードへ
        ctx.clearRect(0, 0, CARD_W, CARD_H);
        ctx.fillStyle = STONE_BG;
        ctx.fillRect(0, 0, CARD_W, CARD_H);
        drawTextOnlyCard(ctx, input);
        isFallback = true;
      }
    } else {
      drawTextOnlyCard(ctx, input);
    }
  } else {
    drawTextOnlyCard(ctx, input);
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), "image/png", 0.95);
    } catch {
      resolve(null);
    }
  });

  if (!blob) {
    throw new Error(
      "カード画像の生成に失敗しました（CORS制約の可能性があります）"
    );
  }

  let dataUrl = "";
  try {
    dataUrl = canvas.toDataURL("image/png");
  } catch {
    dataUrl = URL.createObjectURL(blob);
  }

  return { blob, dataUrl, isFallback };
}
