import { getLocale, getTranslations } from "next-intl/server";
import { getPublishedMembers } from "@/lib/supabase";

export async function BestMembers() {
  const t = await getTranslations("volunteer");
  const locale = await getLocale();
  const members = await getPublishedMembers();

  if (members.length === 0) {
    return <p className="text-muted">{t("membersEmpty")}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {members.map((member) => (
        <article key={member.id} className="panel shine lift p-5">
          <h3 className="text-xl font-extrabold">{member.name}</h3>
          <p className="mt-1 text-gold-deep">{locale === "en" ? member.role_en : member.role_ar}</p>
          <p className="mt-3 text-muted">{locale === "en" ? member.note_en : member.note_ar}</p>
        </article>
      ))}
    </div>
  );
}
