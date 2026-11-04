import express, { type Express, type Request } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getProductById } from "../db";

// ============================================================
// SNSシェアクローラー向け OGP bot対応
// ============================================================
// LINE/X(Twitter)/Facebook/InstagramなどのシェアクローラーはJavaScriptを実行せず
// 静的HTMLしか見ないため、クライアント側Helmetで書き換えたOGPタグは届かない。
// User-Agentで既知クローラーを検出し、対象パス(/db-product/:id)のみ
// サーバー側で軽量にog:title/og:description/og:imageを書き換えて返す。
// 通常ユーザー(非bot)のリクエストは従来通りSPAのindex.htmlをそのまま返す。

const SOCIAL_BOT_UA_PATTERNS = [
  /facebookexternalhit/i,
  /Facebot/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /Slackbot/i,
  /LineBot/i,
  /Line\/\d/i, // LINE内蔵ブラウザのプレビュー取得
  /WhatsApp/i,
  /Discordbot/i,
  /TelegramBot/i,
  /Pinterest/i,
  /redditbot/i,
  /Applebot/i,
  /Google-InspectionTool/i,
  /vkShare/i,
  /Skype/i,
];

function isSocialBotUserAgent(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return SOCIAL_BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

const DB_PRODUCT_PATH_RE = /^\/db-product\/([^/?#]+)/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * bot向けリクエストの場合、対象商品のOGPメタタグを注入したHTMLを返す。
 * 対象外（bot以外・商品が対象パスでない・商品が見つからない等）ならnullを返し、
 * 呼び出し元は従来通りの処理にフォールバックする。
 */
async function renderBotHtmlIfApplicable(
  req: Request,
  template: string
): Promise<string | null> {
  if (!isSocialBotUserAgent(req.headers["user-agent"])) return null;

  const match = DB_PRODUCT_PATH_RE.exec(req.path);
  if (!match) return null;

  const productId = decodeURIComponent(match[1]);
  const product = await getProductById(productId);
  if (!product) return null;

  const title = `${product.name}（${product.prefecture}）| Omiyage Go`;
  const description = product.description
    ? `${product.description.slice(0, 100)}...`
    : `${product.prefecture}のお土産「${product.name}」。${product.brand}。価格¥${product.price.toLocaleString()}。`;
  const imageUrl = product.realImageUrl || product.imageUrl || "";
  const pageUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

  const metaTags = [
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="product" />`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}" />` : "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
  ]
    .filter(Boolean)
    .join("\n    ");

  let html = template.replace(
    /<title>.*?<\/title>/i,
    `<title>${escapeHtml(title)}</title>`
  );
  html = html.replace("</head>", `    ${metaTags}\n  </head>`);
  return html;
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);

      const botPage = await renderBotHtmlIfApplicable(req, page);
      if (botPage) {
        res.status(200).set({ "Content-Type": "text/html" }).end(botPage);
        return;
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");

    try {
      const template = await fs.promises.readFile(indexPath, "utf-8");
      const botPage = await renderBotHtmlIfApplicable(req, template);
      if (botPage) {
        res.status(200).set({ "Content-Type": "text/html" }).end(botPage);
        return;
      }
    } catch {
      // テンプレート読み込みに失敗した場合は従来通りsendFileにフォールバック
    }

    res.sendFile(indexPath);
  });
}
