/* Owner profile bootstrap. Auth users are verified by Supabase Auth; RLS restricts profile insertion to auth.uid(). */
(function (root) {
  "use strict";
  async function ensureOwnerProfile(client,user) {
    if (!client || !user?.id) throw new Error("برای ورود مالک، ابتدا احراز هویت لازم است.");
    const getProfile = () => client.from("owner_profiles")
      .select("approval_status,full_name,phone,user_id")
      .eq("user_id",user.id).maybeSingle();
    const existing = await getProfile();
    if (existing.error) throw new Error("خطا در خواندن پرونده مالک: " + existing.error.message);
    if (existing.data) return {profile:existing.data,created:false};
    const meta = user.user_metadata || {};
    // Never create an owner record for ordinary/guest accounts.
    if (meta.account_type !== "owner") return {profile:null,created:false};
    // Initial account creation may have required email verification: in that case
    // there was no authenticated session and registration could not insert profile.
    const payload = {
      user_id:user.id,
      full_name: String(meta.full_name||"").slice(0,100),
      phone: String(meta.phone||"").slice(0,22),
      approval_status:"pending"
    };
    const created = await client.from("owner_profiles").insert(payload);
    if (created.error && created.error.code!=="23505") {
      throw new Error("ثبت پرونده مالک انجام نشد: " + created.error.message);
    }
    const after = await getProfile();
    if (after.error) throw new Error("خواندن پرونده مالک انجام نشد: "+after.error.message);
    if (!after.data) throw new Error("پرونده مالک ثبت نشده است. مجوز دسترسی owner_profiles را بررسی کنید.");
    return {profile:after.data,created:!created.error};
  }
  root.afraOwnerAuth = {ensureOwnerProfile};
})(window);
