/* Afra Safar - shared Supabase browser client.
 * Publishable keys are meant for browser use. NEVER put secret/service_role keys here.
 * Connected project: chrdvpwympsskclbvnsz (confirmed 2026-11-03).
 */
(function (root) {
  "use strict";
  var PROJECT_URL = "https://chrdvpwympsskclbvnsz.supabase.co";
  var PUBLISHABLE_KEY = "sb_publishable_IvWjnRsU3BeAXuiG0kR8og_iWw4bwkj";
  if (root.afraSupabase && typeof root.afraSupabase.from === "function") return;
  if (!root.supabase || typeof root.supabase.createClient !== "function") {
    root.afraSupabaseLoadError = "کتابخانه Supabase بارگذاری نشد. اتصال اینترنت، CDN یا محدودیت مرورگر را بررسی کنید.";
    console.error("Afra Safar: Supabase SDK is not loaded.");
    return;
  }
  try {
    root.afraSupabase = root.supabase.createClient(PROJECT_URL, PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    root.afraSupabaseReady = true;
    root.dispatchEvent(new Event("afra:supabase-ready"));
  } catch (error) {
    root.afraSupabaseLoadError = error?.message || "اتصال Supabase ایجاد نشد.";
    console.error("Afra Safar: cannot initialize Supabase:",error);
  }
})(window);
