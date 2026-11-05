import { cacheLife, cacheTag } from "next/cache";
import { links } from "@/lib/links";
import { createSupabase } from "@/lib/supabase";

export type SiteLink = {
  key: string;
  group_name: string;
  label_ar: string;
  label_en: string;
  url: string;
  note_ar: string;
  note_en: string;
  sort_order: number;
};

export function defaultSiteLinks(): Record<string, SiteLink> {
  return {
    form_organizer: {
      key: "form_organizer",
      group_name: "form",
      label_ar: "فريق التنظيم",
      label_en: "Organizer team",
      url: links.organizerForm,
      note_ar: "المتاح حاليًا: العلاقات العامة فقط",
      note_en: "Open now: PR only",
      sort_order: 1,
    },
    form_leaders: {
      key: "form_leaders",
      group_name: "form",
      label_ar: "فورم الليدرز",
      label_en: "Leaders form",
      url: links.leadersForm,
      note_ar: "متاح: دروس تقوية ومساعدة ذوي الاحتياجات وSTEM",
      note_en: "Open: tutoring, disability support, and STEM",
      sort_order: 2,
    },
    form_offline: {
      key: "form_offline",
      group_name: "form",
      label_ar: "تطوع أوفلاين",
      label_en: "Offline volunteers",
      url: links.offlineForm,
      note_ar: "التطوع والخدمة المجتمعية على أرض الواقع",
      note_en: "Community service on the ground",
      sort_order: 3,
    },
    form_online: {
      key: "form_online",
      group_name: "form",
      label_ar: "تطوع أونلاين",
      label_en: "Online volunteers",
      url: links.onlineForm,
      note_ar: "التعليم والمهارات واللغات والدعم الأكاديمي",
      note_en: "Education, skills, languages, and academic support",
      sort_order: 4,
    },
    whatsapp_channel: {
      key: "whatsapp_channel",
      group_name: "social",
      label_ar: "واتساب",
      label_en: "WhatsApp",
      url: links.whatsappChannel,
      note_ar: "",
      note_en: "",
      sort_order: 10,
    },
    instagram: {
      key: "instagram",
      group_name: "social",
      label_ar: "إنستغرام",
      label_en: "Instagram",
      url: links.instagram,
      note_ar: "",
      note_en: "",
      sort_order: 11,
    },
    tiktok: {
      key: "tiktok",
      group_name: "social",
      label_ar: "تيك توك",
      label_en: "TikTok",
      url: links.tiktok,
      note_ar: "",
      note_en: "",
      sort_order: 12,
    },
    facebook: {
      key: "facebook",
      group_name: "social",
      label_ar: "فيسبوك",
      label_en: "Facebook",
      url: links.facebook,
      note_ar: "",
      note_en: "",
      sort_order: 13,
    },
    governorates: {
      key: "governorates",
      group_name: "community",
      label_ar: "جروبات المحافظات",
      label_en: "Governorate groups",
      url: links.governorates,
      note_ar: "",
      note_en: "",
      sort_order: 20,
    },
  };
}

export function linkText(link: SiteLink, locale: string, field: "label" | "note") {
  if (field === "label") return locale === "en" ? link.label_en : link.label_ar;
  const note = locale === "en" ? link.note_en : link.note_ar;
  return note;
}

export async function getSiteLinks(): Promise<Record<string, SiteLink>> {
  "use cache";
  cacheTag("site-links");
  cacheLife("minutes");

  const base = defaultSiteLinks();
  try {
    const supabase = createSupabase();
    if (!supabase) return base;

    const { data, error } = await supabase
      .from("site_links")
      .select("key, group_name, label_ar, label_en, url, note_ar, note_en, sort_order")
      .order("sort_order", { ascending: true });

    if (error || !data) return base;

    for (const row of data) {
      if (!row.key || !row.url) continue;
      base[row.key] = row;
    }
    return base;
  } catch (error) {
    console.error("site_links", error);
    return base;
  }
}
