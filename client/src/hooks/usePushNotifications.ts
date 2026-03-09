/**
 * Web Push通知フック
 * Service Workerの登録・購読管理・通知許可リクエストを担当
 */
import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type NotificationPermission = "default" | "granted" | "denied";

export interface UsePushNotificationsReturn {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  isSupported: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  const subscribeMutation = trpc.notifications.subscribe.useMutation();
  const unsubscribeMutation = trpc.notifications.unsubscribe.useMutation();

  // Service Worker登録と購読状態の確認
  useEffect(() => {
    if (!isSupported) return;

    setPermission(Notification.permission as NotificationPermission);

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        setSwRegistration(reg);

        // 既存の購読を確認
        const existingSub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!existingSub);
      } catch (err) {
        console.error("[Push] Service Worker registration failed:", err);
      }
    };

    registerSW();
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !swRegistration || !VAPID_PUBLIC_KEY) return false;

    setIsLoading(true);
    try {
      // 通知許可をリクエスト
      const perm = await Notification.requestPermission();
      setPermission(perm as NotificationPermission);

      if (perm !== "granted") {
        setIsLoading(false);
        return false;
      }

      // Push購読を作成
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = subscription.toJSON();
      const keys = subJson.keys as { p256dh: string; auth: string };

      // サーバーに購読情報を登録
      await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: navigator.userAgent.substring(0, 256),
      });

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("[Push] Subscribe failed:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, swRegistration, subscribeMutation]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !swRegistration) return false;

    setIsLoading(true);
    try {
      const existingSub = await swRegistration.pushManager.getSubscription();
      if (!existingSub) {
        setIsSubscribed(false);
        setIsLoading(false);
        return true;
      }

      // サーバーから購読を削除
      await unsubscribeMutation.mutateAsync({ endpoint: existingSub.endpoint });

      // ブラウザの購読を解除
      await existingSub.unsubscribe();

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("[Push] Unsubscribe failed:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, swRegistration, unsubscribeMutation]);

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported,
    subscribe,
    unsubscribe,
  };
}
