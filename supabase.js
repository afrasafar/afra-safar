// ============================================
// AFRA SAFAR
// Supabase Connection
// ============================================

const SUPABASE_URL = "https://chrdvpwympsskclbvnsz.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_IvWjnRsU3BeAXuiG0kR8og_iWw4bwkj";

const { createClient } = supabase;

const afraSupabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);