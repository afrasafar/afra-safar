/* Legacy reservation decisions and prepared messages inside the current admin UI. */
(() => {
  "use strict";
  const PAYMENT = Object.freeze({ card: "6219861924453805", holder: "محمد رسولی" });
  window.AfraAdminBookings = Object.freeze({ create({ root, esc, fa, money, date, day, query, propertyMap, table, badge, statusNames, toast, failText, requireAdmin, refresh }) {
    const base = new URL(root || "./", location.href);
    const messages = new Map();
    const rowsById = new Map();
    const url = path => new URL(path, base).href;
    function trackingLink(row, file = "my-reservations.html") {
      const link = new URL(file, base);
      link.searchParams.set("code", row.reservation_code || row.id);
      link.searchParams.set("phone", row.guest_phone || "");
      return link.href;
    }
    function fullMessage(row, property) {
      const confirmed = ["confirmed", "approved"].includes(row.status);
      const nights = Math.max(0, Math.round((Date.parse(row.check_out + "T00:00:00Z") - Date.parse(row.check_in + "T00:00:00Z")) / 86400000));
      return ["افراسفر | نتیجهٔ بررسی رزرو", `سلام ${row.guest_name || "مسافر گرامی"}، درخواست رزرو شما بررسی شد.`,
        `کد پیگیری: ${row.reservation_code || row.id}`, `اقامتگاه: ${property.title || "نامشخص"}`, `موقعیت: ${property.location || "ثبت نشده"}`,
        `نام مسافر: ${row.guest_name || "—"}`, `شماره تماس: ${row.guest_phone || "—"}`, `تاریخ ورود: ${day(row.check_in)}`, `تاریخ خروج: ${day(row.check_out)}`,
        `تعداد شب: ${fa(nights)}`, `تعداد مهمان: ${fa(row.guest_count)}`, `وضعیت رزرو: ${statusNames[row.status] || row.status}`,
        `مبلغ پایه: ${row.payment_base_amount == null ? "ثبت نشده" : money(row.payment_base_amount)}`,
        `تخفیف: ${fa(row.discount_percent)}٪ (${money(row.discount_amount || 0)})`,
        `مبلغ قابل پرداخت: ${row.payment_amount == null ? "پس از تأیید محاسبه می‌شود" : money(row.payment_amount)}`,
        confirmed ? `مهلت پرداخت: ${row.payment_deadline_at ? date(row.payment_deadline_at) : "۲۰ دقیقه پس از تأیید رزرو"}` : "",
        confirmed && row.payment_status !== "paid" ? `شماره کارت: ${PAYMENT.card}\nبه نام: ${PAYMENT.holder}` : "",
        confirmed && row.payment_status !== "paid" ? "در صورت پایان مهلت پرداخت، درخواست جدید ثبت کنید." : "",
        row.guest_message ? `توضیحات مسافر: ${row.guest_message}` : "",
        `صفحهٔ پیگیری و اتصال تلگرام: ${trackingLink(row)}`,
        confirmed ? `پیگیری و جزئیات پرداخت: ${trackingLink(row)}` : "",
        "برای اتصال تلگرام، صفحهٔ پیگیری را باز کرده و دکمهٔ اتصال تلگرام را انتخاب کنید."
      ].filter(Boolean).join("\n");
    }
    async function render(history = false) {
      const data = await query("reservations", "id,reservation_code,property_id,guest_name,guest_phone,guest_message,check_in,check_out,guest_count,status,payment_status,payment_amount,payment_base_amount,discount_code,discount_percent,discount_amount,payment_deadline_at,created_at", 1000);
      const props = await propertyMap(data.map(x => x.property_id));
      const view = history ? data : data.filter(x => x.status === "pending");
      messages.clear(); rowsById.clear();
      const rows = view.map(row => {
        const property = props[row.property_id] || {};
        const text = fullMessage(row, property); messages.set(String(row.id), text); rowsById.set(String(row.id), row);
        const share = new URL("https://t.me/share/url"); share.searchParams.set("url", trackingLink(row)); share.searchParams.set("text", text);
        const decisions = row.status === "pending" ? `<button type="button" class="btn btn-primary btn-sm" data-booking-decision="confirmed" data-booking-id="${esc(row.id)}">تأیید رزرو</button><button type="button" class="btn btn-danger btn-sm" data-booking-decision="rejected" data-booking-id="${esc(row.id)}">رد درخواست</button>` : ["confirmed", "approved"].includes(row.status) ? `<button type="button" class="btn btn-danger btn-sm" data-booking-decision="rejected" data-booking-id="${esc(row.id)}">رد رزرو</button>` : "";
        const notify = ["confirmed", "approved"].includes(row.status) ? `<a class="btn btn-secondary btn-sm" href="${esc(share.href)}" target="_blank" rel="noopener noreferrer">آماده‌سازی پیام در تلگرام</a><button type="button" class="btn btn-secondary btn-sm" data-copy-booking="${esc(row.id)}">کپی پیام کامل رزرو و پرداخت</button>` : "";
        return `<tr data-status="${esc(row.status)}"><td data-label="کد رزرو"><strong>${esc(row.reservation_code || row.id)}</strong></td><td data-label="مسافر">${esc(row.guest_name)}<br><small dir="ltr">${esc(row.guest_phone)}</small>${row.guest_message ? `<p class="admin-guest-note">${esc(row.guest_message)}</p>` : ""}</td>
        <td data-label="اقامتگاه"><a href="${esc(url(`admin-v2/pages/products/create.html?edit=${encodeURIComponent(row.property_id)}`))}">${esc(property.title || "نامشخص")}</a><small>${esc(property.location || "")}</small></td>
        <td data-label="ورود / خروج">${day(row.check_in)} تا ${day(row.check_out)}<small>ثبت: ${date(row.created_at)}</small></td><td data-label="مهمان">${fa(row.guest_count)}</td>
        <td data-label="مبلغ">${row.payment_amount == null ? "پس از تأیید" : money(row.payment_amount)}<small>پایه: ${row.payment_base_amount == null ? "—" : money(row.payment_base_amount)}</small><small>تخفیف: ${fa(row.discount_percent)}٪؛ ${money(row.discount_amount || 0)}</small>${row.payment_deadline_at ? `<small>مهلت: ${date(row.payment_deadline_at)}</small>` : ""}</td>
        <td data-label="پرداخت">${badge(row.payment_status, statusNames)}</td><td data-label="وضعیت">${badge(row.status, statusNames)}</td>
        <td data-label="عملیات"><div class="admin-property-actions">${decisions}${notify}<a class="btn btn-secondary btn-sm" href="${esc(trackingLink(row))}">پیگیری رزرو</a></div></td></tr>`;
      }).join("");
      return `<section class="card"><div class="section-head"><div><h2>${history ? "همهٔ رزروها و تاریخچه" : "درخواست‌های در انتظار"}</h2><p>${fa(view.length)} رزرو؛ تأیید، رد، پیگیری و آماده‌سازی پیام</p></div><div class="toolbar"><button type="button" class="btn btn-secondary btn-sm" data-action="refresh">به‌روزرسانی رزروها</button><a class="btn btn-secondary btn-sm" href="${esc(url("admin-payments.html"))}">بررسی پرداخت‌ها</a></div></div>
      <div class="toolbar"><label class="field"><span>جست‌وجو</span><input class="input" id="admin-search" type="search" placeholder="کد رزرو، نام، تلفن یا اقامتگاه" data-table-search="#admin-bookings-table"></label><label class="field"><span>وضعیت</span><select class="select" id="booking-filter" data-table-filter="#admin-bookings-table"><option value="">همه</option>${["pending", "confirmed", "rejected", "cancelled", "expired"].map(s => `<option value="${s}">${statusNames[s]}</option>`).join("")}</select></label></div>
      ${table(["کد رزرو", "مسافر", "اقامتگاه", "تاریخ", "نفرات", "مبلغ", "پرداخت", "وضعیت", "عملیات"], rows, "admin-bookings-table")}</section>`;
    }
    async function copy(text) {
      if (navigator.clipboard?.writeText) { try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* fall back on HTTP or when clipboard is restricted */ } }
      const el = document.createElement("textarea"); el.value = text; el.style.position = "fixed"; el.style.opacity = "0"; el.setAttribute("readonly", ""); document.body.append(el); el.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (_) {} el.remove(); return ok;
    }
    function bind(target) {
      target.querySelectorAll("[data-booking-decision]").forEach(button => button.addEventListener("click", async () => {
        const row = rowsById.get(button.dataset.bookingId), next = button.dataset.bookingDecision;
        if (!row || !["confirmed", "rejected"].includes(next)) return;
        const note = row.payment_status === "paid" ? " این عملیات وضعیت پرداخت را تغییر نمی‌دهد و بازپرداخت خودکار انجام نمی‌شود." : "";
        if (!confirm(`از ${next === "confirmed" ? "تأیید" : "رد"} این رزرو مطمئن هستید؟${note}`)) return;
        button.disabled = true;
        try {
          await requireAdmin();
          const { data, error } = await window.afraSupabase.from("reservations").update({ status: next }).eq("id", row.id).eq("status", row.status).select("id").maybeSingle();
          if (error) throw error;
          if (!data) throw new Error("وضعیت رزرو قبلاً تغییر کرده یا دسترسی این عملیات وجود ندارد؛ فهرست را تازه کنید.");
          toast(next === "confirmed" ? "رزرو تأیید شد." : "رزرو رد شد."); await refresh();
        } catch (e) { toast(failText(e)); if (button.isConnected) button.disabled = false; }
      }));
      target.querySelectorAll("[data-copy-booking]").forEach(button => button.addEventListener("click", async () => {
        const text = messages.get(button.dataset.copyBooking); if (!text) return;
        button.disabled = true;
        try { toast(await copy(text) ? "پیام کامل رزرو کپی شد." : "کپی انجام نشد؛ دسترسی کلیپ‌بورد مرورگر را بررسی کنید."); }
        finally { button.disabled = false; }
      }));
    }
    return Object.freeze({ render, bind });
  } });
})();
