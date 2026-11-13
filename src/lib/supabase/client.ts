
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabasePublishableKey) {
        console.error("[Supabase ENV CHECK]", {
            urlAvailable: Boolean(supabaseUrl),
            keyAvailable: Boolean(supabasePublishableKey),
        });

        throw new Error(
            "Supabase URL atau Publishable Key belum tersedia."
        );
    }

    return createBrowserClient(
        supabaseUrl,
        supabasePublishableKey
    );
}
