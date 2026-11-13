import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://demafaiuika.my.id";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    let agendaUrls: MetadataRoute.Sitemap = [];

    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from("agendas")
            .select("slug, updated_at, event_date")
            .eq("status", "published");

        if (!error && data) {
            agendaUrls = data.map((agenda) => ({
                url: `${siteUrl}/agenda/${agenda.slug}`,
                lastModified: agenda.updated_at
                    ? new Date(agenda.updated_at)
                    : new Date(agenda.event_date),
                changeFrequency: "weekly",
                priority: 0.8,
            }));
        }
    }

    return [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        ...agendaUrls,
    ];
}