// tests/stagehand/utils/seed-profile.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function seedDemoProfile() {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: "10000000-0000-0000-0000-000000000001",
        email: "demo@feltsense.dev",
        full_name: null,
        avatar_url: null,
        role: "admin",
        // created_at/updated_at can be omitted to let defaults run
      },
      { onConflict: "id" }
    );

  if (error) throw error;
}