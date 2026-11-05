import type { Metadata, Viewport } from "next";
import { Cairo, Fraunces } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import Script from "next/script";
import { OpeningMark } from "@/components/chrome/OpeningMark";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { Atmosphere } from "@/components/motion/Atmosphere";
import { PageFade } from "@/components/motion/PageFade";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { isLocale, routing } from "@/i18n/routing";
import "../globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const themeBoot = `try{var t=localStorage.getItem("athar-theme");if(t==="night"||t==="day")document.documentElement.dataset.theme=t}catch(e){}`;

const installBoot = `(()=>{if(!("serviceWorker"in navigator))return;navigator.serviceWorker.register("/sw.js").catch(function(){});window.addEventListener("beforeinstallprompt",function(event){event.preventDefault();window.__atharInstall=event;window.dispatchEvent(new Event("athar-install-ready"));});window.addEventListener("appinstalled",function(){window.__atharInstall=null;window.dispatchEvent(new Event("athar-install-ready"));});})();`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a2764",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title"),
    description: t("description"),
    applicationName: "ATHAR",
    appleWebApp: {
      capable: true,
      title: "ATHAR",
      statusBarStyle: "default",
    },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations("nav");

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${cairo.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Script id="athar-theme" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        <Script id="athar-install" strategy="beforeInteractive">
          {installBoot}
        </Script>
        <NextIntlClientProvider messages={messages}>
          <a className="skip-link" href="#content">{t("home")}</a>
          <OpeningMark />
          <Atmosphere />
          <ScrollProgress />
          <SiteHeader />
          <main id="content">
            <PageFade>{children}</PageFade>
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
