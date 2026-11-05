import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedUpdates, type UpdateRow } from "@/lib/supabase";

function localized(row: UpdateRow, locale: string) {
  return locale === "en"
    ? { title: row.title_en, body: row.body_en }
    : { title: row.title_ar, body: row.body_ar };
}

export async function NewsStrip() {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const updates = await getPublishedUpdates();
  const latest = updates[0];

  return (
    <section className="shell py-8" id="news">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="kicker">{t("newsKicker")}</p>
          <h2 className="display mt-3 text-4xl">{t("newsTitle")}</h2>
        </div>
        <Link href="/updates" className="nav-link">{t("newsAll")}</Link>
      </div>
      {latest ? <div className="mt-6"><UpdateCard row={latest} locale={locale} /></div> : <p className="mt-6 text-muted">{t("newsEmpty")}</p>}
    </section>
  );
}

export async function UpdateFeed() {
  const t = await getTranslations("updates");
  const locale = await getLocale();
  const updates = await getPublishedUpdates();

  if (updates.length === 0) {
    return <p className="text-muted">{t("empty")}</p>;
  }

  return (
    <div className="grid gap-4">
      {updates.map((row) => (
        <UpdateCard key={row.id} row={row} locale={locale} />
      ))}
    </div>
  );
}

function UpdateCard({ row, locale }: { row: UpdateRow; locale: string }) {
  const copy = localized(row, locale);
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", {
    dateStyle: "medium",
  }).format(new Date(row.created_at));

  return (
    <article className="panel shine lift overflow-hidden p-0">
      <div className="h-1.5 bg-gradient-to-l from-gold via-leaf to-sky" />
      <div className="p-6">
      <time className="kicker" dateTime={row.created_at}>{date}</time>
      <h3 className="mt-3 text-2xl font-extrabold">{copy.title}</h3>
      <p className="mt-3 whitespace-pre-line text-lg leading-8 text-muted">{copy.body}</p>
      </div>
    </article>
  );
}
