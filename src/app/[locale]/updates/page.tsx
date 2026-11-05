import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UpdateFeed } from "@/components/content/NewsList";
import { isLocale } from "@/i18n/routing";
import { getSiteLinks } from "@/lib/site-links";

export default async function UpdatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("updates");
  const site = await getSiteLinks();

  return (
    <>
      <header className="shell pb-4 pt-14">
        <div className="panel stage-card wash-sky p-5 sm:p-8 md:p-10">
          <p className="kicker">{t("kicker")}</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">
            {t("title")} <em>{t("titleEm")}</em>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{t("lead")}</p>
        </div>
      </header>
      <section className="shell py-6">
        <Suspense fallback={<p className="text-muted">{t("loading")}</p>}>
          <UpdateFeed />
        </Suspense>
      </section>
      <section className="shell pb-8">
        <a className="btn btn-line" href={site.whatsapp_channel.url} target="_blank" rel="noreferrer">
          {t("channel")}
        </a>
      </section>
    </>
  );
}
