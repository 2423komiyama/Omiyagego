/**
 * Web Push通知ヘルパー
 * VAPID鍵を使ってプッシュ通知を送信する
 */
import webpush from 'web-push';
import { getDb } from './db';
import { pushSubscriptions } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

// VAPID設定
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:omiyage-go@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  productId?: string;
  facilityId?: string;
  tag?: string;
  type?: 'nearby' | 'trending' | 'general';
  actions?: Array<{ action: string; title: string }>;
}

/**
 * 特定のユーザーにプッシュ通知を送信
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.isActive, true)));

  return sendPushToSubscriptions(subs, payload);
}

/**
 * 複数の購読に対してプッシュ通知を送信
 * 失効した購読は自動的に無効化する
 */
export async function sendPushToSubscriptions(
  subs: Array<{ id: number; endpoint: string; p256dh: string; auth: string }>,
  payload: PushPayload
): Promise<number> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not configured, skipping push notification');
    return 0;
  }

  let sent = 0;
  const payloadStr = JSON.stringify({
    ...payload,
    icon: payload.icon || '/icon-192.png',
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadStr
        );
        sent++;
      } catch (err: any) {
        // 410 Gone または 404 = 購読が失効
        if (err.statusCode === 410 || err.statusCode === 404) {
          const db2 = await getDb();
          if (db2) await db2
            .update(pushSubscriptions)
            .set({ isActive: false })
            .where(eq(pushSubscriptions.id, sub.id));
        }
        console.error('[Push] Failed to send:', err.message);
      }
    })
  );

  return sent;
}

/**
 * お気に入り商品の売り場に近づいた時の通知
 */
export async function sendNearbyNotification(params: {
  userId: number;
  productName: string;
  productId: string;
  facilityName: string;
  facilityId: string;
  distanceMeters: number;
}): Promise<void> {
  const { userId, productName, productId, facilityName, facilityId, distanceMeters } = params;

  const distanceText = distanceMeters < 1000
    ? `${Math.round(distanceMeters)}m`
    : `${(distanceMeters / 1000).toFixed(1)}km`;

  await sendPushToUser(userId, {
    title: `📍 お気に入りのお土産が近くにあります`,
    body: `「${productName}」が${facilityName}（${distanceText}先）で買えます`,
    url: `/db-product/${productId}`,
    productId,
    facilityId,
    tag: `nearby-${productId}`,
    type: 'nearby',
    actions: [
      { action: 'view_product', title: '商品を見る' },
      { action: 'view_station', title: '売り場を見る' },
    ],
  });
}

/**
 * エリア別トレンド通知
 */
export async function sendTrendingNotification(params: {
  userId: number;
  prefecture: string;
  productName: string;
  productId: string;
  trendRank: number;
}): Promise<void> {
  const { userId, prefecture, productName, productId, trendRank } = params;

  await sendPushToUser(userId, {
    title: `🔥 ${prefecture}で今注目のお土産`,
    body: `「${productName}」が${prefecture}で${trendRank}位にランクイン！`,
    url: `/db-product/${productId}`,
    productId,
    tag: `trending-${prefecture}`,
    type: 'trending',
    actions: [
      { action: 'view_product', title: '商品を見る' },
    ],
  });
}
