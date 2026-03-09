/**
 * Omiyage Go - Service Worker
 * Web Push通知の受信・表示・クリック処理を担当
 */

const CACHE_NAME = 'omiyage-go-v1';

// インストール
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// アクティベート
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// プッシュ通知受信
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Omiyage Go',
      body: event.data.text(),
      icon: '/icon-192.png',
    };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/badge-72.png',
    image: data.image || undefined,
    tag: data.tag || 'omiyage-notification',
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/',
      productId: data.productId || null,
      facilityId: data.facilityId || null,
      type: data.type || 'general',
    },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Omiyage Go', options)
  );
});

// 通知クリック
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  let targetUrl = notifData.url || '/';

  // アクションボタンのクリック
  if (event.action === 'view_product' && notifData.productId) {
    targetUrl = `/db-product/${notifData.productId}`;
  } else if (event.action === 'view_station' && notifData.facilityId) {
    targetUrl = `/station/${notifData.facilityId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 既存のウィンドウがあればフォーカス
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // なければ新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// バックグラウンド同期（将来の拡張用）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    // お気に入りデータの同期
  }
});
