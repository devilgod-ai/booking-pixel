# OAuth 申請步驟

## Google OAuth

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 建立新專案或選擇現有專案
3. 左側選單 → **APIs & Services** → **Credentials**
4. 點擊 **+ Create Credentials** → **OAuth client ID**
5. 如需設定 OAuth consent screen，填寫：
   - User Type: External
   - App name、User support email、Developer contact email
   - Scopes: 選擇 `email`、`profile`、`openid`
6. 回到 Credentials，選擇 **Web application**
7. 填入 Authorized redirect URI：
   ```
   https://你的域名/api/auth/callback/google
   ```
8. 完成後取得 **Client ID** 及 **Client Secret**，填入 `.env`：
   ```
   GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   ```

---

## Facebook OAuth

1. 前往 [Meta for Developers](https://developers.facebook.com)
2. 建立 App → 選擇 **Consumer** 類型
3. 左側選單 → **Products** → 加入 **Facebook Login**
4. Facebook Login → **Settings**，填入 Valid OAuth Redirect URI：
   ```
   https://你的域名/api/auth/callback/facebook
   ```
5. 左側 **App Settings** → **Basic**，取得 App ID 和 App Secret
6. 填入 `.env`：
   ```
   FACEBOOK_CLIENT_ID=xxx
   FACEBOOK_CLIENT_SECRET=xxx
   ```

---

## Instagram OAuth（須先完成 Facebook 設定）

1. 同一 Facebook App → **Products** → 加入 **Instagram Basic Display**
2. 或使用 **Instagram Graph API**（功能更完整）
3. 需完成 **Meta 商業驗證** (Business Verification)：
   - 前往 [Security Center](https://business.facebook.com/settings/security)
   - 上傳商業登記證等證明文件
   - 審核約需 2-5 個工作天
4. 設定 redirect URI：
   ```
   https://你的域名/api/auth/callback/instagram
   ```
5. 填入 `.env`：
   ```
   INSTAGRAM_CLIENT_ID=xxx
   INSTAGRAM_CLIENT_SECRET=xxx
   ```

> **備註:** Instagram OAuth 比 Google/Facebook 複雜，建議先完成前兩者，Instagram 可之後再加。
