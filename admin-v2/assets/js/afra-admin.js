(() => {
  "use strict";

  const body = document.body;
  const root = body.dataset.root || "";
  const page = body.dataset.page || "dashboard";
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fa = value => Number(value || 0).toLocaleString("fa-IR");
  const money = value => `${fa(value)} تومان`;
  const date = value => value ? new Date(value).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const day = value => value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString("fa-IR") : "—";
  const titles = {
    dashboard: ["داشبورد افراسفر", "نمای کلی آمار و عملیات واقعی سایت"],
    users: ["کاربران", "پروفایل‌های ثبت‌شده در پایگاه داده"],
    hosts: ["بررسی میزبان‌ها", "مدیریت درخواست‌های میزبانی"],
    roles: ["دسترسی مدیر", "بررسی دسترسی همین حساب با تابع امن سایت"],
    properties: ["اقامتگاه‌ها", "مدیریت آگهی‌های ثبت‌شده در افراسفر"],
    propertyCreate: ["افزودن اقامتگاه", "ثبت آگهی جدید در پایگاه داده افراسفر"],
    categories: ["دسته‌بندی اقامتگاه‌ها", "دسته‌بندی‌های مجاز طبق ساختار دیتابیس"],
    bookings: ["درخواست‌های رزرو", "پیگیری وضعیت رزرو و مشخصات اقامت"],
    history: ["تاریخچه رزروها", "فهرست رزروها و وضعیت پرداخت ثبت‌شده"],
    reports: ["گزارش رزروها", "شاخص‌ها از داده‌های فعلی پایگاه داده"],
    analytics: ["آمار و تحلیل", "تحلیل رزرو، آگهی و پشتیبانی"],
    revenue: ["گزارش پرداخت‌ها", "جمع مبالغ ثبت‌شده در رزروها؛ پرداخت فقط با گردش امن تأیید می‌شود"],
    transactions: ["تراکنش‌های رزرو", "مشاهده وضعیت و مرجع پرداخت رزروها"],
    invoices: ["پرداخت‌های تأییدشده", "مبالغ و کدهای رزرو ثبت‌شده در سامانه"],
    support: ["پشتیبانی", "پاسخ‌گویی به تیکت‌های ثبت‌شده"],
    reviews: ["نظرات", "بررسی و انتشار دیدگاه‌های مسافران"],
    settings: ["وضعیت سامانه", "بررسی اتصال و وضعیت بخش‌های متصل به دیتابیس"],
    backup: ["خروجی داده‌ها", "دریافت نسخه محلی از داده‌های مدیریتی قابل دسترس"]
  };
  const nav = [
    { id: "dashboard", label: "داشبورد", icon: "fa-tachometer-alt", href: `${root}admin-v2/index.html` },
    { id: "users", label: "حساب‌ها", icon: "fa-users", children: [["users", "پروفایل مسافران", `${root}admin-v2/pages/users/index.html`], ["hosts", "میزبان‌ها", `${root}admin-v2/pages/users/create.html`], ["roles", "دسترسی مدیر", `${root}admin-v2/pages/users/roles.html`]] },
    { id: "properties", label: "اقامتگاه‌ها", icon: "fa-house-user", children: [["properties", "فهرست اقامتگاه‌ها", `${root}admin-v2/pages/products/index.html`], ["propertyCreate", "افزودن اقامتگاه", `${root}admin-v2/pages/products/create.html`], ["categories", "دسته‌بندی‌ها", `${root}admin-v2/pages/products/categories.html`]] },
    { id: "bookings", label: "رزروها", icon: "fa-calendar-check", children: [["bookings", "درخواست‌های جدید", `${root}admin-v2/pages/orders/new.html`], ["history", "تاریخچه رزروها", `${root}admin-v2/pages/orders/history.html`], ["reports", "گزارش رزروها", `${root}admin-v2/pages/orders/reports.html`]] },
    { id: "analytics", label: "آمار و تحلیل", icon: "fa-chart-bar", href: `${root}admin-v2/pages/analytics.html` },
    { id: "finance", label: "پرداخت‌ها", icon: "fa-coins", children: [["revenue", "گزارش پرداخت‌ها", `${root}admin-v2/pages/finance/revenue.html`], ["transactions", "تراکنش‌های رزرو", `${root}admin-v2/pages/finance/transactions.html`], ["invoices", "پرداخت‌های تأییدشده", `${root}admin-v2/pages/finance/invoices.html`]] },
    { id: "support", label: "پشتیبانی", icon: "fa-headset", href: `${root}admin-v2/pages/support.html` },
    { id: "reviews", label: "نظرات", icon: "fa-star", href: `${root}admin-v2/pages/reviews.html` },
    { id: "settings", label: "سامانه و خروجی", icon: "fa-cog", children: [["settings", "وضعیت سامانه", `${root}admin-v2/pages/settings/general.html`], ["backup", "خروجی داده‌ها", `${root}admin-v2/pages/settings/backup.html`]] },
    { id: "site", label: "صفحات افراسفر", icon: "fa-globe", children: [["home", "صفحهٔ اصلی سایت", `${root}index.html`], ["search", "جست‌وجوی اقامتگاه", `${root}search.html`], ["map", "نقشهٔ اقامتگاه‌ها", `${root}map.html`], ["payments", "بررسی پرداخت‌ها", `${root}admin-payments.html`]] }
  ];

  const toast = message => {
    let stack = $(".toast-stack");
    if (!stack) { stack = document.createElement("div"); stack.className = "toast-stack"; document.body.append(stack); }
    const item = document.createElement("div"); item.className = "toast"; item.textContent = message; stack.append(item);
    setTimeout(() => item.remove(), 3600);
  };
  const failText = error => {
    const code = error?.code || "";
    if (code === "23P01") return "این اقامتگاه در بازهٔ انتخاب‌شده رزرو تأییدشده دارد؛ رزرو تداخل‌دار تأیید نشد.";
    if (code === "23514") return "مقادیر واردشده با قوانین اقامتگاه یا رزرو سازگار نیست.";
    if (code === "PGRST205" || code === "42P01") return "این بخش در طرح‌واره فعلی دیتابیس موجود نیست.";
    if (code === "42501" || code === "PGRST301") return "دسترسی این عملیات در سیاست‌های دیتابیس مجاز نیست.";
    return error?.message || "ارتباط با پایگاه داده برقرار نشد.";
  };
  const btn = (label, action, cls = "btn btn-primary") => `<button type="button" class="${cls}" data-action="${esc(action)}">${label}</button>`;
  const card = (label, value, icon, detail = "داده از پایگاه داده") => `<article class="card lift reveal"><div class="stat"><div><span class="stat-label">${label}</span><p class="stat-value">${value}</p><span class="trend">${detail}</span></div><span class="stat-icon"><i class="fas ${icon}" aria-hidden="true"></i></span></div></article>`;
  const table = (heads, rows, id = "") => `<div class="table-wrap"><table class="data-table responsive" ${id ? `id="${id}"` : ""}><thead><tr>${heads.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${heads.length}">رکوردی برای نمایش وجود ندارد.</td></tr>`}</tbody></table></div>`;
  const badge = (value, labels = {}) => `<span class="badge ${({ pending: "warning", confirmed: "success", approved: "success", paid: "success", rejected: "danger", cancelled: "danger", expired: "danger", open: "warning", in_progress: "info", closed: "success", unpaid: "warning", receipt_submitted: "info", failed: "danger" })[value] || "info"}">${esc(labels[value] || value || "نامشخص")}</span>`;
  const statusNames = { pending: "در انتظار", confirmed: "تأییدشده", rejected: "ردشده", cancelled: "لغوشده", expired: "منقضی", paid: "پرداخت‌شده", unpaid: "پرداخت‌نشده", receipt_submitted: "رسید دریافت‌شده", failed: "ناموفق", open: "باز", in_progress: "در حال بررسی", closed: "بسته", approved: "تأییدشده", rejected: "ردشده" };
  const empty = message => `<div class="card"><p>${esc(message)}</p></div>`;
  const query = async (tableName, columns = "*", limit = 500) => {
    const { data, error } = await window.afraSupabase.from(tableName).select(columns).order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  };
  const propertyMap = async ids => {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return {};
    const { data, error } = await window.afraSupabase.from("properties").select("id,title,location").in("id", unique);
    if (error) throw error;
    return Object.fromEntries((data || []).map(x => [x.id, x]));
  };

  async function requireAdmin() {
    const { data: { user }, error: userError } = await window.afraSupabase.auth.getUser();
    if (userError || !user) throw new Error("نشست شما معتبر نیست؛ دوباره وارد حساب مدیر شوید.");
    const { data, error } = await window.afraSupabase.rpc("is_admin");
    if (error || data !== true) throw new Error("دسترسی مدیر برای این عملیات تأیید نشد.");
    return user;
  }

  function authView(markup) {
    const dock = document.getElementById("afraAppearanceDock");
    document.body.innerHTML = markup;
    if (dock) document.body.appendChild(dock);
  }

  function loginView(message = "برای ورود، از حساب مدیر افراسفر استفاده کنید.") {
    authView(`<main class="auth-wrap"><section class="card auth-card"><a class="brand-mark" href="${root}index.html" aria-label="صفحهٔ اصلی افراسفر"><img class="afra-admin-leaf" src="${root}images/afra-safar-logo.png?v=fix20261119" width="36" height="40" alt=""></a><h1>ورود مدیر افراسفر</h1><p>${esc(message)}</p><form id="admin-login" class="auth-form"><label class="field"><span>ایمیل</span><input class="input" type="email" name="email" autocomplete="username" required></label><label class="field"><span>رمز عبور</span><input class="input" type="password" name="password" autocomplete="current-password" required></label><button class="btn btn-primary" type="submit">ورود امن</button><div role="status" id="login-message"></div></form></section></main>`);
    $("#admin-login").addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const submit = form.querySelector("button[type=submit]");
      submit.disabled = true;
      $("#login-message").textContent = "در حال بررسی حساب…";
      const { error } = await window.afraSupabase.auth.signInWithPassword({ email: form.elements.email.value.trim(), password: form.elements.password.value });
      if (error) { submit.disabled = false; $("#login-message").textContent = "ورود انجام نشد. ایمیل و رمز را بررسی کنید."; return; }
      location.reload();
    });
  }

  async function authorize() {
    if (!window.afraSupabase) throw new Error(window.afraSupabaseLoadError || "اتصال Supabase آماده نیست.");
    const { data: { user }, error: authError } = await window.afraSupabase.auth.getUser();
    if (authError || !user) { loginView(); return false; }
    const { data, error } = await window.afraSupabase.rpc("is_admin");
    if (error || data !== true) {
      authView(`<main class="auth-wrap"><section class="card auth-card"><div class="brand-mark"><i class="fas fa-lock"></i></div><h1>دسترسی مدیر لازم است</h1><p>این حساب با تابع امن is_admin تأیید نشد.</p><button class="btn btn-secondary" id="signout-denied" type="button">خروج از حساب</button></section></main>`);
      $("#signout-denied").addEventListener("click", async () => { await window.afraSupabase.auth.signOut(); location.reload(); });
      return false;
    }
    window.afraAdminUser = user;
    return true;
  }

  function shell() {
    let { 0: title, 1: subtitle } = titles[page] || ["پنل افراسفر", "مدیریت سامانه" ];
    if (page === "propertyCreate" && new URLSearchParams(location.search).has("edit")) { title = "ویرایش اقامتگاه"; subtitle = "اطلاعات، تصاویر و وضعیت نمایش اقامتگاه"; document.title = title + " | پنل افراسفر"; }
    const activeGroup = nav.find(item => item.children?.some(child => child[0] === page))?.id;
    const navHtml = nav.map(item => item.href
      ? `<a class="nav-link ${item.id === page ? "active" : ""}" href="${item.href}"><i class="fas ${item.icon}" aria-hidden="true"></i><span>${item.label}</span></a>`
      : `<div class="nav-group ${activeGroup === item.id ? "open" : ""}"><button class="nav-group-toggle" type="button" aria-expanded="${activeGroup === item.id}" data-nav-group="${item.id}"><i class="fas ${item.icon}" aria-hidden="true"></i><span>${item.label}</span><i class="fas fa-chevron-down chevron" aria-hidden="true"></i></button><div class="nav-submenu"><div>${item.children.map(child => `<a class="nav-link ${child[0] === page ? "active" : ""}" href="${child[2]}">${child[1]}</a>`).join("")}</div></div></div>`).join("");
    const shellRoot = $("[data-app-shell]");
    shellRoot.innerHTML = `<div id="admin-content" aria-live="polite"><div class="card">در حال بارگذاری داده‌های افراسفر…</div></div>`;
    document.body.insertAdjacentHTML("afterbegin", `<button class="menu-button" type="button" aria-label="باز کردن منو" aria-controls="app-sidebar" aria-expanded="false"><i class="fas fa-bars"></i></button><div class="sidebar-overlay" data-close-sidebar></div><aside class="app-sidebar" id="app-sidebar" aria-label="منوی اصلی"><a class="brand" href="${root}index.html" aria-label="افراسفر؛ رفتن به صفحهٔ اصلی سایت"><span class="brand-mark"><img class="afra-admin-leaf" src="${root}images/afra-safar-logo.png?v=fix20261119" width="36" height="40" alt=""></span><span><strong>افراسفر</strong><small>سفر.آرامش.خاطره</small></span></a><nav class="sidebar-nav">${navHtml}</nav><div class="sidebar-profile"><img src="${root}images/afra-safar-logo.png?v=fix20261119" class="afra-admin-leaf" alt=""><span class="profile"><strong class="profile-email" dir="ltr">${esc(window.afraAdminUser?.email || "مدیر")}</strong><small>دسترسی تأییدشده</small></span><span class="profile-status" title="متصل"></span></div></aside>`);
    const appMain = document.createElement("div"); appMain.className = "app-main"; document.body.append(appMain);
    appMain.insertAdjacentHTML("beforeend", `<header class="app-header"><a class="admin-mobile-brand" href="${root}index.html" aria-label="صفحهٔ اصلی افراسفر"><img class="afra-admin-leaf" src="${root}images/afra-safar-logo.png?v=fix20261119" width="27" height="31" alt=""><span><strong>افراسفر</strong><small>سفر.آرامش.خاطره</small></span></a><div class="page-title"><h1>${title}</h1><p>${subtitle}</p></div><div class="header-actions"><span class="admin-email" dir="ltr">${esc(window.afraAdminUser?.email || "مدیر")}</span><button class="btn btn-secondary btn-sm" type="button" data-action="signout"><i class="fas fa-sign-out-alt"></i> خروج</button></div></header>`);
    appMain.append(shellRoot);
    document.body.insertAdjacentHTML("beforeend", `<div class="toast-stack" aria-live="polite" aria-atomic="true"></div>`);
    const menuButton = $(".menu-button");
    const close = () => { body.classList.remove("sidebar-open"); menuButton?.setAttribute("aria-expanded", "false"); };
    menuButton?.addEventListener("click", () => { const open = body.classList.toggle("sidebar-open"); menuButton.setAttribute("aria-expanded", String(open)); });
    $("[data-close-sidebar]")?.addEventListener("click", close);
    document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
    document.querySelectorAll("[data-nav-group]").forEach(button => button.addEventListener("click", () => {
      const group = button.closest(".nav-group"); const open = !group.classList.contains("open");
      document.querySelectorAll(".nav-group.open").forEach(x => { x.classList.remove("open"); x.querySelector("[data-nav-group]")?.setAttribute("aria-expanded", "false"); });
      group.classList.toggle("open", open); button.setAttribute("aria-expanded", String(open));
    }));
    document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", close));
  }

  const dashboard = async () => {
    const [properties, reservations, tickets, reviews] = await Promise.all([
      query("properties", "id,is_active", 1000), query("reservations", "id,status,payment_status,payment_amount,created_at,guest_name,property_id,reservation_code,check_in,check_out", 1000), query("afra_support_tickets", "id,status,created_at", 1000), query("afra_reviews", "id,moderation_status,score,created_at", 1000)
    ]);
    const pending = reservations.filter(r => r.status === "pending").length;
    const latest = reservations.slice(0, 6); const props = await propertyMap(latest.map(x => x.property_id));
    const rows = latest.map(r => `<tr><td data-label="کد رزرو">${esc(r.reservation_code || r.id.slice(0, 8))}</td><td data-label="مسافر">${esc(r.guest_name)}</td><td data-label="اقامتگاه">${esc(props[r.property_id]?.title || "—")}</td><td data-label="ثبت">${date(r.created_at)}</td><td data-label="وضعیت">${badge(r.status, statusNames)}</td></tr>`).join("");
    return `<section class="card mb-2"><div class="toolbar admin-quick-actions"><a class="btn btn-primary" href="${root}admin-v2/pages/products/create.html">افزودن اقامتگاه</a><a class="btn btn-secondary" href="${root}admin-v2/pages/products/index.html">فهرست اقامتگاه‌ها</a><a class="btn btn-secondary" href="${root}admin-v2/pages/products/categories.html">دسته‌بندی‌ها</a><a class="btn btn-secondary" href="${root}admin-v2/pages/orders/new.html">درخواست‌های رزرو</a></div></section><section class="grid grid-4 mb-2">${card("اقامتگاه‌ها", fa(properties.length), "fa-house-user", `${fa(properties.filter(x => x.is_active).length)} آگهی فعال`)}${card("کل رزروها", fa(reservations.length), "fa-calendar-check", `${fa(pending)} درخواست در انتظار`)}${card("تیکت‌های باز", fa(tickets.filter(t => t.status !== "closed").length), "fa-headset", "از جدول پشتیبانی")}${card("نظرات در انتظار", fa(reviews.filter(r => r.moderation_status === "pending").length), "fa-star", "برای بررسی مدیر")}</section><section class="card reveal"><div class="section-head"><div><h2>آخرین رزروها</h2><p>نمایش اطلاعات واقعی از پایگاه داده</p></div><a class="btn btn-secondary btn-sm" href="${root}admin-v2/pages/orders/new.html">همه رزروها</a></div>${table(["کد رزرو", "مسافر", "اقامتگاه", "زمان ثبت", "وضعیت"], rows)}</section>`;
  };

  const users = async () => {
    const data = await query("afra_profiles", "user_id,full_name,phone,city,created_at", 1000);
    const rows = data.map(x => `<tr><td data-label="شناسه" dir="ltr">${esc(x.user_id)}</td><td data-label="نام">${esc(x.full_name || "—")}</td><td data-label="تلفن">${esc(x.phone || "—")}</td><td data-label="شهر">${esc(x.city || "—")}</td><td data-label="ثبت‌نام">${date(x.created_at)}</td></tr>`).join("");
    return `<section class="grid grid-4 mb-2">${card("پروفایل‌های موجود", fa(data.length), "fa-users")}</section><section class="card"><div class="section-head"><div><h2>پروفایل مسافران</h2><p>این فهرست از جدول afra_profiles خوانده می‌شود؛ مدیریت مستقیم کاربران Auth در این پنل فعال نیست.</p></div></div><div class="toolbar"><div class="field"><label for="admin-search">جست‌وجو</label><input class="input" id="admin-search" type="search" placeholder="نام، تلفن یا شهر" data-table-search="#admin-users-table"></div></div>${table(["شناسه کاربر", "نام", "تلفن", "شهر", "تاریخ"], rows, "admin-users-table")}</section>`;
  };

  const hosts = async () => {
    const data = await query("owner_profiles", "user_id,full_name,phone,approval_status,created_at", 1000);
    const rows = data.map(x => `<tr><td data-label="میزبان">${esc(x.full_name || "—")}</td><td data-label="تلفن">${esc(x.phone || "—")}</td><td data-label="شناسه" dir="ltr">${esc(x.user_id)}</td><td data-label="ثبت">${date(x.created_at)}</td><td data-label="وضعیت">${badge(x.approval_status, statusNames)}</td><td data-label="عملیات"><select class="select" data-host-status="${esc(x.user_id)}" data-current-status="${esc(x.approval_status)}"><option value="pending" ${x.approval_status === "pending" ? "selected" : ""}>در انتظار</option><option value="approved" ${x.approval_status === "approved" ? "selected" : ""}>تأیید</option><option value="rejected" ${x.approval_status === "rejected" ? "selected" : ""}>رد</option></select></td></tr>`).join("");
    return `<section class="card"><div class="section-head"><div><h2>درخواست‌های میزبانی</h2><p>تغییر وضعیت فقط با مجوز RLS مدیر ذخیره می‌شود.</p></div></div>${table(["نام", "تلفن", "شناسه", "تاریخ", "وضعیت", "تغییر وضعیت"], rows)}</section>`;
  };

  const roles = async () => `<section class="card"><h2>تأیید دسترسی</h2><p>این حساب برای همین نشست از تابع دیتابیس <code>is_admin()</code> تأیید شده است.</p><p>تغییر نقش حساب‌ها از داخل مرورگر انجام نمی‌شود. نقش مدیر باید از مسیر امن سرور و با دسترسی مالک پروژه مدیریت شود.</p><p class="badge success">دسترسی این نشست تأیید شد</p></section>`;

  const propertyManager = window.AfraAdminProperties?.create({ root, esc, fa, money, query, table, badge, toast, failText, requireAdmin, refresh: renderPage });
  const bookingManager = window.AfraAdminBookings?.create({ root, esc, fa, money, date, day, query, propertyMap, table, badge, statusNames, toast, failText, requireAdmin, refresh: renderPage });
  const properties = async () => { if (!propertyManager) throw new Error("فایل مدیریت اقامتگاه‌ها بارگذاری نشد؛ صفحه را تازه کنید."); return propertyManager.list(); };
  const propertyCreate = async () => { if (!propertyManager) throw new Error("فایل فرم اقامتگاه بارگذاری نشد؛ صفحه را تازه کنید."); return propertyManager.editor(); };
  const categories = async () => { if (!propertyManager) throw new Error("فایل دسته‌بندی‌ها بارگذاری نشد؛ صفحه را تازه کنید."); return propertyManager.categories(); };
  const bookings = async (history = false) => { if (!bookingManager) throw new Error("فایل مدیریت رزروها بارگذاری نشد؛ صفحه را تازه کنید."); return bookingManager.render(history); };

  const reports = async () => {
    const data = await query("reservations", "id,status,payment_status,payment_amount,created_at", 1000);
    const stats = ["pending", "confirmed", "rejected", "cancelled", "expired"].map(s => [statusNames[s], data.filter(x => x.status === s).length]);
    const paid = data.filter(x => x.payment_status === "paid").reduce((sum, x) => sum + Number(x.payment_amount || 0), 0);
    return `<section class="grid grid-4 mb-2">${card("کل رزروها", fa(data.length), "fa-calendar-check")}${card("رزروهای پرداخت‌شده", fa(data.filter(x => x.payment_status === "paid").length), "fa-check-circle")}${card("مجموع پرداخت تأییدشده", money(paid), "fa-coins")}${card("رزروهای در انتظار", fa(data.filter(x => x.status === "pending").length), "fa-hourglass-half")}</section><section class="card"><div class="section-head"><div><h2>توزیع وضعیت رزرو</h2><p>حداکثر ۱۰۰۰ رکورد اخیر</p></div></div>${table(["وضعیت", "تعداد"], stats.map(([s, n]) => `<tr><td>${s}</td><td>${fa(n)}</td></tr>`).join(""))}</section>`;
  };

  const analytics = async () => {
    const [properties, reservations, tickets, reviews] = await Promise.all([query("properties", "id,is_active,created_at", 1000), query("reservations", "id,status,payment_status,payment_amount,created_at", 1000), query("afra_support_tickets", "id,status,created_at", 1000), query("afra_reviews", "id,moderation_status,score,created_at", 1000)]);
    const week = new Date(); week.setDate(week.getDate() - 7);
    const recent = reservations.filter(x => new Date(x.created_at) >= week).length;
    const paid = reservations.filter(x => x.payment_status === "paid").reduce((sum, x) => sum + Number(x.payment_amount || 0), 0);
    return `<section class="grid grid-4 mb-2">${card("رزروهای ۷ روز", fa(recent), "fa-calendar-week")}${card("درآمد تأییدشده", money(paid), "fa-coins")}${card("نرخ پرداخت", reservations.length ? `${fa(Math.round(100 * reservations.filter(x => x.payment_status === "paid").length / reservations.length))}٪` : "۰٪", "fa-chart-line")}${card("آگهی فعال", fa(properties.filter(x => x.is_active).length), "fa-house-user")}</section><section class="grid grid-2"><article class="card"><h2>میزان پشتیبانی باز</h2><p class="stat-value">${fa(tickets.filter(x => x.status !== "closed").length)}</p><p>از ${fa(tickets.length)} تیکت ثبت‌شده</p></article><article class="card"><h2>نظرات منتظر بررسی</h2><p class="stat-value">${fa(reviews.filter(x => x.moderation_status === "pending").length)}</p><p>میانگین امتیاز ثبت‌شده: ${reviews.length ? (reviews.reduce((n, x) => n + Number(x.score || 0), 0) / reviews.length).toFixed(1) : "—"}</p></article></section>`;
  };

  const finance = async (mode = "all") => {
    const data = await query("reservations", "id,reservation_code,guest_name,property_id,payment_status,payment_method,payment_amount,payment_reference,payment_paid_at,created_at", 1000);
    const filtered = mode === "paid" ? data.filter(x => x.payment_status === "paid") : data;
    const props = await propertyMap(filtered.map(x => x.property_id));
    const paid = data.filter(x => x.payment_status === "paid").reduce((n, x) => n + Number(x.payment_amount || 0), 0);
    const rows = filtered.map(x => `<tr><td data-label="کد رزرو">${esc(x.reservation_code || x.id.slice(0, 8))}</td><td data-label="مسافر">${esc(x.guest_name)}</td><td data-label="اقامتگاه">${esc(props[x.property_id]?.title || "—")}</td><td data-label="روش پرداخت">${esc(x.payment_method || "—")}</td><td data-label="مبلغ">${money(x.payment_amount || 0)}</td><td data-label="وضعیت">${badge(x.payment_status, statusNames)}</td><td data-label="شناسه بانکی" dir="ltr">${esc(x.payment_reference || "—")}</td><td data-label="زمان تأیید">${date(x.payment_paid_at)}</td></tr>`).join("");
    return `<section class="grid grid-4 mb-2">${card("مجموع واریز تأییدشده", money(paid), "fa-coins")}${card("پرداخت‌های تأییدشده", fa(data.filter(x => x.payment_status === "paid").length), "fa-check-circle")}${card("در انتظار بررسی", fa(data.filter(x => x.payment_status === "receipt_submitted").length), "fa-receipt")}${card("رزروهای دیده‌شده", fa(data.length), "fa-calendar-check")}</section><section class="card"><div class="section-head"><div><h2>اطلاعات پرداخت رزروها</h2><p>تأیید یا استرداد وجه از این جدول انجام نمی‌شود.</p></div><a class="btn btn-primary btn-sm" href="${root}admin-payments.html">ورود به گردش امن بررسی پرداخت</a></div>${table(["کد رزرو", "مسافر", "اقامتگاه", "روش", "مبلغ", "وضعیت", "مرجع", "زمان تأیید"], rows)}</section>`;
  };

  const support = async () => {
    const data = await query("afra_support_tickets", "id,user_id,subject,category,message,status,admin_reply,created_at", 500);
    return data.length ? `<section class="grid grid-2">${data.map(t => `<article class="card"><div class="section-head"><div><h2>${esc(t.subject)}</h2><p>${esc(t.category)} · ${date(t.created_at)}</p></div>${badge(t.status, statusNames)}</div><p>${esc(t.message)}</p><form class="ticket-form" data-ticket="${esc(t.id)}"><label class="field"><span>پاسخ مدیر</span><textarea class="input" name="reply" rows="3" maxlength="4000">${esc(t.admin_reply || "")}</textarea></label><label class="field"><span>وضعیت</span><select class="select" name="status"><option value="open" ${t.status === "open" ? "selected" : ""}>باز</option><option value="in_progress" ${t.status === "in_progress" ? "selected" : ""}>در حال بررسی</option><option value="closed" ${t.status === "closed" ? "selected" : ""}>بسته</option></select></label><button class="btn btn-primary btn-sm" type="submit">ذخیره پاسخ</button><div role="status"></div></form></article>`).join("")}</section>` : empty("تیکتی ثبت نشده است.");
  };

  const reviews = async () => {
    const data = await query("afra_reviews", "id,property_id,guest_user_id,score,body,moderation_status,created_at,moderated_at", 500);
    const props = await propertyMap(data.map(x => x.property_id));
    const rows = data.map(x => `<tr><td data-label="امتیاز">${fa(x.score)} از ۵</td><td data-label="اقامتگاه">${esc(props[x.property_id]?.title || "—")}</td><td data-label="نظر">${esc(x.body)}</td><td data-label="ثبت">${date(x.created_at)}</td><td data-label="وضعیت">${badge(x.moderation_status, statusNames)}</td><td data-label="عملیات">${x.moderation_status === "pending" ? `<button class="btn btn-primary btn-sm" data-review-status="approved" data-review-id="${esc(x.id)}">تأیید</button> <button class="btn btn-secondary btn-sm" data-review-status="rejected" data-review-id="${esc(x.id)}">رد</button>` : "—"}</td></tr>`).join("");
    return `<section class="card"><div class="section-head"><div><h2>دیدگاه‌های ثبت‌شده</h2><p>تصمیم مدیر در ستون moderation_status ثبت می‌شود.</p></div></div>${table(["امتیاز", "اقامتگاه", "دیدگاه", "تاریخ", "وضعیت", "عملیات"], rows)}</section>`;
  };

  const settings = async () => {
    const { data: { user } } = await window.afraSupabase.auth.getUser();
    const { data, error } = await window.afraSupabase.rpc("is_admin");
    const records = await Promise.allSettled([query("properties", "id", 1), query("reservations", "id", 1), query("afra_support_tickets", "id", 1)]);
    const rows = [["نشست احراز هویت", user ? "فعال" : "ناموجود"], ["تابع is_admin", error ? failText(error) : data === true ? "تأییدشده" : "ردشده"], ["اقامتگاه‌ها", records[0].status === "fulfilled" ? "متصل" : failText(records[0].reason)], ["رزروها", records[1].status === "fulfilled" ? "متصل" : failText(records[1].reason)], ["پشتیبانی", records[2].status === "fulfilled" ? "متصل" : failText(records[2].reason)], ["کلید مرورگر", "publishable؛ کلید secret در کد مرورگر قرار ندارد"]];
    return `<section class="card"><div class="section-head"><div><h2>وضعیت اتصال و دسترسی</h2><p>بررسی خواندنی؛ تنظیمات حساس از این صفحه تغییر نمی‌کند.</p></div></div>${table(["مورد", "وضعیت"], rows.map(([a, b]) => `<tr><td>${a}</td><td>${esc(b)}</td></tr>`).join(""))}<div class="card mt-2"><h3>بخش‌های بدون جدول در دیتابیس فعلی</h3><p>تنظیمات فروشگاه و تخفیف‌های قالب اصلی به‌دلیل نبود جدول متناظر، در پنل افراسفر نمایش داده نمی‌شوند.</p></div></section>`;
  };

  const backup = async () => `<section class="card"><div class="section-head"><div><h2>خروجی محلی</h2><p>فقط داده‌هایی که حساب مدیر با RLS اجازه خواندن آن‌ها را دارد صادر می‌شوند.</p></div></div><p>یک خروجی JSON از اقامتگاه‌ها، رزروها، میزبان‌ها، تیکت‌ها و نظرات دانلود می‌شود. فایل فقط روی دستگاه شما ذخیره می‌شود و نسخه پشتیبان سمت سرور ایجاد نمی‌کند.</p><button class="btn btn-primary" type="button" data-action="export">ساخت و دانلود JSON</button><div id="export-result" role="status"></div></section>`;

  const renderers = { dashboard, users, hosts, roles, properties, propertyCreate, categories, bookings: () => bookings(false), history: () => bookings(true), reports, analytics, revenue: () => finance("paid"), transactions: () => finance("all"), invoices: () => finance("paid"), support, reviews, settings, backup };
  async function renderPage() {
    const target = $("#admin-content");
    try { target.innerHTML = await (renderers[page] || dashboard)(); bindPage(target); }
    catch (error) { target.innerHTML = `<section class="card"><h2>دریافت اطلاعات ناموفق بود</h2><p role="alert">${esc(failText(error))}</p><button class="btn btn-secondary" type="button" data-action="refresh">تلاش دوباره</button></section>`; }
  }

  function bindPage(target) {
    propertyManager?.bind(target);
    bookingManager?.bind(target);
    const tables = new Set([...target.querySelectorAll("[data-table-search],[data-table-filter]")].map(x => x.dataset.tableSearch || x.dataset.tableFilter));
    for (const selector of tables) {
      const inputs = [...target.querySelectorAll("[data-table-search]")].filter(x => x.dataset.tableSearch === selector);
      const selects = [...target.querySelectorAll("[data-table-filter]")].filter(x => x.dataset.tableFilter === selector);
      const applyFilters = () => {
        const term = (inputs[0]?.value || "").trim().toLocaleLowerCase();
        $(selector, target)?.querySelectorAll("tbody tr").forEach(row => {
          row.hidden = (term && !row.textContent.toLocaleLowerCase().includes(term)) || selects.some(select => select.value && (row.dataset.status ? row.dataset.status !== select.value : !row.textContent.includes(statusNames[select.value] || select.value)));
        });
      };
      inputs.forEach(x => x.addEventListener("input", applyFilters));
      selects.forEach(x => x.addEventListener("change", applyFilters));
    }
    target.querySelectorAll("[data-host-status]").forEach(select => select.addEventListener("change", async () => {
      const previous = select.dataset.currentStatus, next = select.value;
      if (next === previous) return;
      if (!confirm("وضعیت درخواست میزبانی به «" + (statusNames[next] || next) + "» تغییر کند؟")) { select.value = previous; return; }
      select.disabled = true;
      try {
        await requireAdmin();
        const { data, error } = await window.afraSupabase.from("owner_profiles").update({ approval_status: next }).eq("user_id", select.dataset.hostStatus).eq("approval_status", previous).select("user_id").maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("وضعیت این درخواست قبلاً تغییر کرده است؛ فهرست را تازه کنید.");
        toast("وضعیت میزبان ذخیره شد."); await renderPage();
      } catch (e) { toast(failText(e)); select.value = previous; select.disabled = false; }
    }));
    target.querySelectorAll("[data-review-status]").forEach(button => button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await requireAdmin();
        const { data, error } = await window.afraSupabase.from("afra_reviews").update({ moderation_status: button.dataset.reviewStatus, moderated_at: new Date().toISOString() }).eq("id", button.dataset.reviewId).select("id").maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("نظر تغییر نکرد؛ فهرست و دسترسی مدیر را بررسی کنید.");
        toast("وضعیت نظر ذخیره شد."); await renderPage();
      } catch (e) { toast(failText(e)); button.disabled = false; }
    }));
    target.querySelectorAll(".ticket-form").forEach(form => form.addEventListener("submit", async event => {
      event.preventDefault(); const button = form.querySelector("button[type=submit]"); button.disabled = true;
      try {
        await requireAdmin();
        const { data, error } = await window.afraSupabase.from("afra_support_tickets").update({ admin_reply: form.elements.reply.value.trim() || null, status: form.elements.status.value, updated_at: new Date().toISOString() }).eq("id", form.dataset.ticket).select("id").maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("پاسخ ذخیره نشد؛ فهرست و دسترسی مدیر را بررسی کنید.");
        form.querySelector('[role="status"]').textContent = "پاسخ و وضعیت ذخیره شد.";
      } catch (e) { form.querySelector('[role="status"]').textContent = failText(e); }
      finally { button.disabled = false; }
    }));
  }

  async function exportData() {
    const names = ["properties", "property_images", "reservations", "owner_profiles", "afra_profiles", "afra_support_tickets", "afra_reviews"];
    const out = { exported_at: new Date().toISOString(), note: "این خروجی فقط داده‌های قابل دسترس با نشست مدیر و RLS جاری را شامل می‌شود.", tables: {} };
    for (const name of names) out.tables[name] = await query(name, "*", 5000);
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `afrasafar-admin-export-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href);
    $("#export-result").textContent = "فایل خروجی دانلود شد.";
  }

  document.addEventListener("click", async event => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "signout") { await window.afraSupabase.auth.signOut(); location.href = `${root}admin-v2/index.html`; }
    if (action === "refresh") await renderPage();
    if (action === "export") { const button = event.target.closest("button"); button.disabled = true; try { await exportData(); } catch (e) { $("#export-result").textContent = failText(e); } finally { button.disabled = false; } }
  });

  (async () => {
    try {
      const ok = await authorize();
      if (!ok) return;
      shell();
      await renderPage();
    } catch (error) { authView(`<main class="auth-wrap"><section class="card auth-card"><h1>اتصال مدیر آماده نیست</h1><p>${esc(failText(error))}</p><p>اتصال اینترنت، بارگیری Supabase و دسترسی حساب را بررسی کنید.</p></section></main>`); }
  })();
})();
