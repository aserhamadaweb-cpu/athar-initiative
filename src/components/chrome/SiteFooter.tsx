import { getLocale, getTranslations } from "next-intl/server";
import { InstallButton } from "@/components/chrome/InstallButton";
import { Link } from "@/i18n/navigation";
import { getSiteLinks, linkText } from "@/lib/site-links";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const locale = await getLocale();
  const site = await getSiteLinks();
  const socials = ["whatsapp_channel", "instagram", "tiktok", "facebook"].map((key) => site[key]);

  return (
    <footer className="site-footer mt-20">
      <div className="shell grid gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="kicker">ATHAR</p>
          <p className="display mt-3 max-w-sm text-3xl">{t("tagline")}</p>
          <p className="mt-3 text-muted">{t("note")}</p>
        </div>
        <nav className="grid content-start gap-2">
          <Link className="nav-link" href="/volunteer">{nav("volunteer")}</Link>
          <Link className="nav-link" href="/teams">{nav("teams")}</Link>
          <Link className="nav-link" href="/updates">{nav("updates")}</Link>
          <Link className="nav-link" href="/game">{nav("game")}</Link>
          <Link className="nav-link" href="/admin">{t("admin")}</Link>
        </nav>
        <div>
          <p className="kicker">{t("follow")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {socials.map((item) => (
              <a key={item.key} className="btn btn-line !px-3 !py-2" href={item.url} target="_blank" rel="noreferrer">
                {linkText(item, locale, "label")}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="shell flex flex-col gap-2 border-t border-line py-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 {t("rights")}</p>
        <InstallButton className="btn btn-primary w-full sm:w-auto" />
        <p className="site-credit">powered by ASER HAMADA</p>
      </div>
    </footer>
  );
}
