export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// サーバー側でGoogle OAuthへリダイレクトする（開発時はdevログイン）
export const getLoginUrl = () => "/api/oauth/google";
