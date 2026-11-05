import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <section className="shell py-24">
      <h1 className="display text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">{t("lead")}</p>
      <Link className="btn btn-primary mt-8" href="/">{t("home")}</Link>
    </section>
  );
}
