import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

const i18nMiddleware = createMiddleware({
  locales: ["zh-HK", "zh-CN", "en"],
  defaultLocale: "zh-HK",
});

export default function middleware(request: NextRequest) {
  return i18nMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
