import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  const lang = locale ?? "zh-HK";
  return {
    messages: (await import(`./messages/${lang}.json`)).default,
    locale: lang,
  };
});
