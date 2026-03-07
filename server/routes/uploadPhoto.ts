import { Router, Request, Response } from "express";
import busboy from "busboy";
import { storagePut } from "../storage";

const router = Router();

/**
 * POST /api/upload-collection-photo
 * コレクター機能用の写真アップロードエンドポイント
 * multipart/form-data で "file" フィールドを受け取る
 */
router.post("/api/upload-collection-photo", async (req: Request, res: Response) => {
  try {
    // セッション確認
    const cookieHeader = req.headers.cookie || "";
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((c) => {
      const [k, ...v] = c.trim().split("=");
      if (k) cookies[k.trim()] = v.join("=");
    });
    const sessionToken = cookies["omiyage_session"];
    if (!sessionToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Content-Type チェック
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({ error: "multipart/form-data required" });
    }

    // busboy でファイルを受け取る
    const bb = busboy({ headers: req.headers, limits: { fileSize: 16 * 1024 * 1024 } });

    let uploadedUrl: string | null = null;
    let fileError: string | null = null;

    await new Promise<void>((resolve, reject) => {
      bb.on("file", async (fieldname: string, file: NodeJS.ReadableStream & { destroy: () => void }, info: { filename: string; mimeType: string }) => {
        if (fieldname !== "file") {
          file.resume();
          return;
        }
        const { filename, mimeType } = info;
        const chunks: Buffer[] = [];

        file.on("data", (chunk: Buffer) => chunks.push(chunk));
        file.on("limit", () => {
          fileError = "File size exceeds 16MB limit";
          file.destroy();
        });
        file.on("end", async () => {
          if (fileError) return;
          try {
            const buffer = Buffer.concat(chunks);
            const ext = filename.split(".").pop() || "jpg";
            const key = `collection-photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const result = await storagePut(key, buffer, mimeType || "image/jpeg");
            uploadedUrl = result.url;
          } catch (err: any) {
            fileError = err.message;
          }
        });
      });

      bb.on("finish", resolve);
      bb.on("error", reject);
      req.pipe(bb);
    });

    if (fileError) {
      return res.status(400).json({ error: fileError });
    }
    if (!uploadedUrl) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    return res.json({ url: uploadedUrl });
  } catch (err: any) {
    console.error("[uploadPhoto] Error:", err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

export default router;
