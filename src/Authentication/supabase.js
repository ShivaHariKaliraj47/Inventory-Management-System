import { createClient } from "@supabase/supabase-js";

// Publishable credentials are safe to include in the browser bundle. Prefer environment overrides when provided.
const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || "https://dreirrsbkoofcvbivrat.supabase.co";
const key = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_tDvIdF_QnIzAfFwpERQBHA_POEYqwzh";

export const supabase = createClient(url, key);
