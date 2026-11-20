/* Property management ported from the supplied admin.html into the current shell. */
(() => {
  "use strict";
  const LABELS = Object.freeze({ villa: "ویلا", forest: "کلبه جنگلی", pool: "ویلا استخردار", luxury: "اقامتگاه لوکس" });
  const MIME = Object.freeze({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" });
  const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
  window.AfraAdminProperties = Object.freeze({ create({ root, esc, fa, money, query, table, badge, toast, failText, requireAdmin, refresh }) {
    const db = () => window.afraSupabase;
    const base = new URL(root || "./", location.href);
    const url = path => new URL(path, base).href;
    const $ = (selector, scope = document) => scope.querySelector(selector);
    let records = new Map();
    let draft = null;
    let previewURLs = [];
    function disposePreviews() { previewURLs.forEach(x => URL.revokeObjectURL(x)); previewURLs = []; }
    function imageURL(value) {
      if (!String(value || "").trim()) return "";
      try { const u = new URL(String(value).trim(), base); return ["http:", "https:"].includes(u.protocol) ? u.href : ""; } catch (_) { return ""; }
    }
    const options = (selected, all = false) => (all ? '<option value="">همهٔ دسته‌ها</option>' : "") + Object.entries(LABELS).map(([k, v]) => `<option value="${k}" ${selected === k ? "selected" : ""}>${v}</option>`).join("");
    async function gallery(id) {
      const { data, error } = await db().from("property_images").select("id,property_id,image_url,sort_order").eq("property_id", String(id)).order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    }
    async function getRecord(id) {
      const { data, error } = await db().from("properties").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    }
    function message(text, kind = "info") {
      const out = $("#property-form-result");
      if (out) { out.textContent = text; out.dataset.kind = kind; out.setAttribute("role", kind === "error" ? "alert" : "status"); }
    }
    async function validateFile(file) {
      if (!file || !Object.hasOwn(MIME, file.type)) throw new Error("فرمت عکس باید JPG، PNG، WEBP یا AVIF باشد.");
      if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error("حجم هر عکس باید بیشتر از صفر و حداکثر ۸ مگابایت باشد.");
      if (typeof createImageBitmap === "function") {
        const bitmap = await createImageBitmap(file).catch(() => { throw new Error("این فایل یک عکس معتبر و قابل نمایش نیست."); });
        bitmap.close();
      }
    }
    async function upload(file, status) {
      await validateFile(file);
      const user = await requireAdmin();
      const path = `${user.id}/${crypto.randomUUID()}.${MIME[file.type]}`;
      status.textContent = `در حال آپلود ${file.name}…`;
      const { error } = await db().storage.from("property-images").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = db().storage.from("property-images").getPublicUrl(path);
      if (!imageURL(data?.publicUrl)) throw new Error("آدرس عکس آپلودشده دریافت نشد.");
      return data.publicUrl;
    }
    async function list() {
      const data = await query("properties", "id,title,location,category,capacity,price,image_url,is_active,created_at", 1000);
      records = new Map(data.map(x => [String(x.id), x]));
      const category = new URLSearchParams(location.search).get("category") || "";
      const rows = data.map(x => `<tr data-property-row data-category="${esc(x.category)}" data-active="${!!x.is_active}">
        <td data-label="اقامتگاه"><div class="entity"><img class="admin-property-thumb" src="${esc(imageURL(x.image_url) || url("images/afra-hero-forest-villa.webp"))}" alt="" loading="lazy">${x.is_active ? `<a href="${esc(url(`property.html?id=${encodeURIComponent(x.id)}`))}"><strong>${esc(x.title)}</strong></a>` : `<strong>${esc(x.title)}</strong>`}</div></td>
        <td data-label="موقعیت">${esc(x.location || "—")}</td><td data-label="دسته">${esc(LABELS[x.category] || x.category)}</td>
        <td data-label="ظرفیت">${fa(x.capacity)}</td><td data-label="قیمت هر شب">${money(x.price)}</td>
        <td data-label="وضعیت">${badge(x.is_active ? "approved" : "rejected", { approved: "فعال", rejected: "غیرفعال" })}</td>
        <td data-label="عملیات"><div class="admin-property-actions">
        <a class="btn btn-secondary btn-sm" data-edit-property="${esc(x.id)}" href="${esc(url(`admin-v2/pages/products/create.html?edit=${encodeURIComponent(x.id)}`))}">ویرایش</a>
        ${x.is_active ? `<a class="btn btn-secondary btn-sm" href="${esc(url(`property.html?id=${encodeURIComponent(x.id)}`))}">مشاهده در سایت</a>` : ""}
        <button type="button" class="btn btn-secondary btn-sm" data-toggle-property="${esc(x.id)}" data-active="${!!x.is_active}">${x.is_active ? "غیرفعال‌کردن" : "فعال‌کردن"}</button>
        <button type="button" class="btn btn-danger btn-sm" data-delete-property="${esc(x.id)}">حذف</button></div></td></tr>`).join("");
      return `<section class="card"><div class="section-head"><div><h2>فهرست اقامتگاه‌ها</h2><p>${fa(data.length)} اقامتگاه؛ ویرایش، تصاویر، نمایش در سایت و حذف</p></div><div class="toolbar"><a class="btn btn-primary btn-sm" href="${esc(url("admin-v2/pages/products/create.html"))}"><i class="fas fa-plus" aria-hidden="true"></i> افزودن اقامتگاه</a><button type="button" class="btn btn-secondary btn-sm" data-action="refresh">به‌روزرسانی</button></div></div>
      <div class="toolbar admin-property-filters"><label class="field" for="admin-property-search"><span>جست‌وجو</span><input class="input" id="admin-property-search" type="search" placeholder="نام، موقعیت یا دسته‌بندی"></label>
      <label class="field" for="admin-property-category"><span>دسته‌بندی</span><select class="select" id="admin-property-category">${options(category, true)}</select></label>
      <label class="field" for="admin-property-active"><span>نمایش در سایت</span><select class="select" id="admin-property-active"><option value="">همه</option><option value="true">فعال</option><option value="false">غیرفعال</option></select></label></div>
      <p id="admin-property-count" role="status"></p>${table(["اقامتگاه", "موقعیت", "دسته", "ظرفیت", "قیمت", "وضعیت", "عملیات"], rows, "admin-property-table")}<p id="admin-property-no-match" class="empty-state" hidden>اقامتگاهی با این فیلترها پیدا نشد.</p></section>`;
    }
    async function categories() {
      const data = await query("properties", "id,category,is_active", 1000);
      return `<section class="card"><div class="section-head"><div><h2>دسته‌بندی اقامتگاه‌ها</h2><p>با انتخاب یک دسته، اقامتگاه‌های آن را مدیریت یا اقامتگاه جدید ثبت کنید.</p></div><a class="btn btn-secondary btn-sm" href="${esc(url("admin-v2/pages/products/index.html"))}">همهٔ اقامتگاه‌ها</a></div>
      <div class="grid grid-2">${Object.entries(LABELS).map(([key, label]) => `<article class="card"><h3>${label}</h3><p>${fa(data.filter(x => x.category === key).length)} اقامتگاه؛ ${fa(data.filter(x => x.category === key && x.is_active).length)} مورد فعال</p><div class="admin-property-actions">
      <a class="btn btn-secondary btn-sm" href="${esc(url(`admin-v2/pages/products/index.html?category=${key}`))}">مدیریت این دسته</a>
      <a class="btn btn-primary btn-sm" href="${esc(url(`admin-v2/pages/products/create.html?category=${key}`))}">افزودن اقامتگاه</a>
      <a class="btn btn-secondary btn-sm" href="${esc(url(`search.html?type=${key}`))}">مشاهده در سایت</a></div></article>`).join("")}</div></section>`;
    }
    async function editor() {
      disposePreviews();
      const params = new URLSearchParams(location.search);
      const id = params.get("edit");
      const record = id ? await getRecord(id) : null;
      if (id && !record) throw new Error("اقامتگاه موردنظر پیدا نشد یا دسترسی ویرایش آن را ندارید.");
      const category = record?.category || params.get("category") || "villa";
      let existing = [], galleryError = "";
      if (record) { try { existing = await gallery(record.id); } catch (e) { galleryError = failText(e); } }
      draft = { id: record?.id || null, persisted: !!record, attempted: false, coverURL: "", pending: [], existing };
      const cover = imageURL(record?.image_url);
      return `<section class="card"><div class="section-head"><div><h2 id="property-form-title">${record ? "ویرایش اقامتگاه" : "افزودن اقامتگاه"}</h2><p>عکس اصلی، گالری و وضعیت نمایش اقامتگاه را از همین فرم مدیریت کنید.</p></div><a class="btn btn-secondary btn-sm" href="${esc(url("admin-v2/pages/products/index.html"))}">فهرست اقامتگاه‌ها</a></div>
      <form id="property-form" class="form-grid"><input name="property_id" type="hidden" value="${esc(record?.id || "")}">
      <label class="field"><span>نام اقامتگاه</span><input class="input" name="title" maxlength="180" required value="${esc(record?.title || "")}"></label>
      <label class="field"><span>موقعیت / شهر</span><input class="input" name="location" maxlength="180" required value="${esc(record?.location || "")}"></label>
      <label class="field"><span>دسته‌بندی</span><select class="select" name="category" required>${options(category)}</select></label>
      <label class="field"><span>ظرفیت</span><input class="input" name="capacity" type="number" min="1" step="1" required value="${esc(record?.capacity ?? 2)}"></label>
      <label class="field"><span>قیمت هر شب (تومان)</span><input class="input" name="price" type="number" min="0" step="1" required value="${esc(record?.price ?? 0)}"></label>
      <label class="field"><span>آدرس عکس اصلی (اختیاری)</span><input class="input" name="image_url" inputmode="url" value="${esc(record?.image_url || "")}" placeholder="https://…"></label>
      <div class="field field-full"><label for="property-image-file">عکس اصلی از دستگاه</label><input class="input" id="property-image-file" name="image_file" type="file" accept="image/jpeg,image/png,image/webp,image/avif"><small id="property-upload-status">JPG، PNG، WEBP یا AVIF؛ حداکثر ۸ مگابایت</small><img id="property-image-preview" class="admin-image-preview" alt="پیش‌نمایش عکس اصلی" ${cover ? `src="${esc(cover)}"` : "hidden"}></div>
      <div class="field field-full"><label for="property-gallery-files">عکس‌های گالری (اختیاری)</label><input class="input" id="property-gallery-files" name="gallery_files" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple><small id="property-gallery-status">حداکثر ۱۰ عکس در هر بار انتخاب؛ هر عکس حداکثر ۸ مگابایت</small><div id="property-gallery-pending" class="admin-gallery-grid" aria-live="polite"></div>
      <div id="property-gallery-existing" class="admin-gallery-grid">${existing.map(x => `<img src="${esc(imageURL(x.image_url))}" alt="عکس گالری اقامتگاه" loading="lazy">`).join("")}</div>${galleryError ? `<p role="alert">دریافت گالری انجام نشد: ${esc(galleryError)}</p>` : ""}</div>
      <label class="field field-full"><span>توضیحات</span><textarea class="input" name="description" rows="5" maxlength="12000">${esc(record?.description || "")}</textarea></label>
      <label class="admin-property-visible field-full"><input name="is_active" type="checkbox" ${record?.is_active !== false ? "checked" : ""}><span>نمایش اقامتگاه در سایت</span></label>
      <div class="form-actions"><button class="btn btn-primary" id="property-save" type="submit">${record ? "ذخیره تغییرات" : "ذخیره اقامتگاه"}</button><button class="btn btn-secondary" id="property-reset" type="button">${record ? "بازنشانی تغییرات فرم" : "پاک‌کردن فرم"}</button><a class="btn btn-secondary" href="${esc(url("admin-v2/pages/products/index.html"))}">انصراف و بازگشت به فهرست</a><a class="btn btn-secondary" id="property-public-link" ${record?.is_active ? `href="${esc(url(`property.html?id=${encodeURIComponent(record.id)}`))}"` : "hidden"}>مشاهده در سایت</a></div>
      <div id="property-form-result" class="field-full" role="status" aria-live="polite"></div></form></section>`;
    }
    async function saveGallery(status) {
      const current = await gallery(draft.id);
      const seen = new Set(current.map(x => x.image_url));
      let sort = current.reduce((n, x) => Math.max(n, Number(x.sort_order) || 0), 0);
      const rows = [];
      for (const item of draft.pending) {
        if (!item.url) item.url = await upload(item.file, status);
        if (!seen.has(item.url)) { rows.push({ property_id: String(draft.id), image_url: item.url, sort_order: ++sort }); seen.add(item.url); }
      }
      if (rows.length) { const { error } = await db().from("property_images").insert(rows); if (error) throw error; }
      return draft.pending.length;
    }
    function bindForm(target) {
      const form = $("#property-form", target); if (!form) return;
      const coverInput = form.elements.image_file, galleryInput = form.elements.gallery_files;
      const status = $("#property-upload-status", target), galleryStatus = $("#property-gallery-status", target);
      let busy = false;
      coverInput.addEventListener("change", async () => {
        draft.coverURL = "";
        try {
          const file = coverInput.files[0]; const preview = $("#property-image-preview", target);
          if (!file) { preview.hidden = !imageURL(form.elements.image_url.value); if (!preview.hidden) preview.src = imageURL(form.elements.image_url.value); return; }
          await validateFile(file); if (busy) return; const u = URL.createObjectURL(file); previewURLs.push(u); preview.src = u; preview.hidden = false;
          status.textContent = `${file.name} انتخاب شد؛ هنگام ذخیره آپلود می‌شود.`;
        } catch (e) { coverInput.value = ""; message(e.message, "error"); }
      });
      form.elements.image_url.addEventListener("input", () => {
        if (coverInput.files.length) return;
        const preview = $("#property-image-preview", target), u = imageURL(form.elements.image_url.value);
        preview.hidden = !u; if (u) preview.src = u;
      });
      galleryInput.addEventListener("change", async () => {
        draft.pending = [];
        const box = $("#property-gallery-pending", target); box.replaceChildren();
        try {
          const files = Array.from(galleryInput.files || []);
          if (files.length > 10) throw new Error("در هر بار حداکثر ۱۰ عکس گالری انتخاب کنید.");
          for (const file of files) await validateFile(file);
          if (busy) return;
          draft.pending = files.map(file => ({ file, url: "" }));
          files.forEach(file => { const img = document.createElement("img"), u = URL.createObjectURL(file); previewURLs.push(u); img.src = u; img.alt = file.name; box.append(img); });
          galleryStatus.textContent = files.length ? `${fa(files.length)} عکس برای گالری انتخاب شد.` : "عکس تازه‌ای برای گالری انتخاب نشده است.";
        } catch (e) { galleryInput.value = ""; message(e.message, "error"); }
      });
      $("#property-reset", target).addEventListener("click", async () => {
        if (busy) return;
        if (draft.persisted) { await refresh(); return; }
        form.reset(); draft = { id: null, persisted: false, attempted: false, coverURL: "", pending: [], existing: [] };
        disposePreviews(); $("#property-image-preview", target).hidden = true; $("#property-gallery-pending", target).replaceChildren(); message("");
      });
      form.addEventListener("submit", async event => {
        event.preventDefault(); if (busy || !form.reportValidity()) return;
        busy = true; message(""); form.setAttribute("aria-busy", "true");
        const button = $("#property-save", target); button.disabled = true; button.textContent = "در حال ذخیره…";
        $("#property-reset", target).disabled = true;
        const value = new FormData(form), cover = coverInput.files[0], chosen = Array.from(galleryInput.files || []);
        const controls = [...form.querySelectorAll("input,select,textarea")]; controls.forEach(x => { x.disabled = true; });
        try {
          await requireAdmin();
          const row = { title: String(value.get("title") || "").trim(), location: String(value.get("location") || "").trim(), category: value.get("category"), capacity: Number(value.get("capacity")), price: Number(value.get("price")), description: String(value.get("description") || "").trim(), image_url: String(value.get("image_url") || "").trim() || null, is_active: form.elements.is_active.checked, updated_at: new Date().toISOString() };
          if (!row.title || !row.location || !Object.hasOwn(LABELS, row.category)) throw new Error("نام، موقعیت و دسته‌بندی اقامتگاه را درست وارد کنید.");
          if (!Number.isSafeInteger(row.capacity) || row.capacity < 1 || row.capacity > 2147483647) throw new Error("ظرفیت باید عدد صحیح بزرگ‌تر از صفر باشد.");
          if (!Number.isSafeInteger(row.price) || row.price < 0) throw new Error("قیمت هر شب باید عدد صحیح صفر یا بیشتر باشد.");
          if (row.image_url && !imageURL(row.image_url)) throw new Error("آدرس عکس اصلی معتبر نیست.");
          if (chosen.length > 10) throw new Error("در هر بار حداکثر ۱۰ عکس گالری انتخاب کنید.");
          if (chosen.length) draft.pending = chosen.map(file => draft.pending.find(x => x.file === file) || { file, url: "" });
          for (const item of draft.pending) await validateFile(item.file);
          if (cover) { if (!draft.coverURL) draft.coverURL = await upload(cover, status); row.image_url = draft.coverURL; }
          const wasNew = !draft.persisted;
          if (!draft.id) draft.id = crypto.randomUUID();
          if (draft.attempted && !draft.persisted) draft.persisted = !!(await getRecord(draft.id));
          draft.attempted = true;
          const request = draft.persisted ? db().from("properties").update(row).eq("id", draft.id) : db().from("properties").insert({ id: draft.id, ...row });
          const { data, error } = await request.select("id").single();
          if (error) throw error;
          if (!data?.id) throw new Error("ذخیره تأیید نشد؛ نشست و مجوز مدیر را بررسی کنید.");
          draft.id = data.id; draft.persisted = true; form.elements.property_id.value = data.id;
          const stateURL = new URL(location.href); stateURL.searchParams.set("edit", draft.id); history.replaceState(null, "", stateURL);
          $("#property-form-title", target).textContent = "ویرایش اقامتگاه";
          const heading = document.querySelector(".page-title h1");
          if (heading) heading.textContent = "ویرایش اقامتگاه";
          document.title = "ویرایش اقامتگاه | پنل افراسفر";
          const publicLink = $("#property-public-link", target); publicLink.href = url(`property.html?id=${encodeURIComponent(data.id)}`); publicLink.hidden = !row.is_active;
          let count = 0;
          if (draft.pending.length) {
            try { count = await saveGallery(galleryStatus); }
            catch (e) { throw new Error(`اقامتگاه ذخیره شده است، اما ذخیره گالری کامل نشد: ${failText(e)} دوباره «ذخیره تغییرات» را بزنید؛ اقامتگاه تکراری ایجاد نمی‌شود.`); }
          }
          status.textContent = cover ? "عکس اصلی ذخیره شد." : "";
          galleryStatus.textContent = count ? `${fa(count)} عکس گالری ذخیره شد.` : "گالری قبلی حفظ شد.";
          draft.pending = []; coverInput.value = ""; galleryInput.value = "";
          $("#property-gallery-pending", target).replaceChildren();
          try { const all = await gallery(draft.id); $("#property-gallery-existing", target).innerHTML = all.map(x => `<img src="${esc(imageURL(x.image_url))}" alt="عکس گالری اقامتگاه" loading="lazy">`).join(""); } catch (_) { /* Saving is complete; refresh can reload thumbnails. */ }
          form.elements.image_url.value = row.image_url || "";
          $("#property-form-title", target).textContent = "ویرایش اقامتگاه";
          message((wasNew ? "اقامتگاه با موفقیت اضافه شد." : "تغییرات اقامتگاه ذخیره شد.") + (count ? ` ${fa(count)} عکس به گالری اضافه شد.` : ""), "success");
        } catch (e) { message(failText(e), "error"); }
        finally { busy = false; controls.forEach(x => { x.disabled = false; }); form.removeAttribute("aria-busy"); button.disabled = false; button.textContent = draft.persisted ? "ذخیره تغییرات" : "ذخیره اقامتگاه"; $("#property-reset", target).disabled = false; }
      });
    }
    function bindList(target) {
      const rows = Array.from(target.querySelectorAll("[data-property-row]"));
      if (!$("#admin-property-table", target)) return;
      const search = $("#admin-property-search", target), category = $("#admin-property-category", target), active = $("#admin-property-active", target);
      const filter = () => {
        const term = search.value.trim().toLocaleLowerCase(); let count = 0;
        rows.forEach(row => { row.hidden = !!((term && !row.textContent.toLocaleLowerCase().includes(term)) || (category.value && row.dataset.category !== category.value) || (active.value && row.dataset.active !== active.value)); if (!row.hidden) count++; });
        $("#admin-property-count", target).textContent = `${fa(count)} اقامتگاه از ${fa(rows.length)} مورد`;
        $("#admin-property-no-match", target).hidden = count > 0 || rows.length === 0;
        const u = new URL(location.href); if (category.value) u.searchParams.set("category", category.value); else u.searchParams.delete("category"); history.replaceState(null, "", u);
      };
      target.querySelectorAll(".admin-property-thumb").forEach(img => img.addEventListener("error", () => { img.src = url("images/afra-hero-forest-villa.webp"); }, { once: true }));
      search.addEventListener("input", filter); category.addEventListener("change", filter); active.addEventListener("change", filter); filter();
      target.querySelectorAll("[data-toggle-property]").forEach(button => button.addEventListener("click", async () => {
        button.disabled = true;
        try { await requireAdmin(); const next = button.dataset.active !== "true"; const { data, error } = await db().from("properties").update({ is_active: next, updated_at: new Date().toISOString() }).eq("id", button.dataset.toggleProperty).select("id").maybeSingle(); if (error) throw error; if (!data) throw new Error("اقامتگاه تغییر کرده یا دسترسی این عملیات وجود ندارد."); toast("وضعیت نمایش اقامتگاه ذخیره شد."); await refresh(); }
        catch (e) { toast(failText(e)); button.disabled = false; }
      }));
      target.querySelectorAll("[data-delete-property]").forEach(button => button.addEventListener("click", async () => {
        const id = button.dataset.deleteProperty, record = records.get(id); if (!record) return;
        button.disabled = true;
        try {
          await requireAdmin();
          const { count, error: countError } = await db().from("reservations").select("id", { count: "exact", head: true }).eq("property_id", id);
          if (countError) throw countError;
          if (!Number.isInteger(count)) throw new Error("تعداد رزروهای وابسته مشخص نشد؛ حذف انجام نشد. دوباره تلاش کنید.");
          const detail = count ? ` این اقامتگاه ${fa(count)} رزرو وابسته دارد که با حذف اقامتگاه حذف خواهند شد. برای حفظ رزروها می‌توانید به‌جای حذف، اقامتگاه را غیرفعال کنید.` : "";
          if (!confirm(`اقامتگاه «${record.title}» برای همیشه حذف شود؟${detail}`)) return;
          const { data, error } = await db().from("properties").delete().eq("id", id).select("id");
          if (error) throw error;
          if (!data?.length) throw new Error("اقامتگاه حذف نشد؛ مجوز مدیر را بررسی کنید.");
          toast("اقامتگاه حذف شد."); await refresh();
        } catch (e) { toast(failText(e)); }
        finally { if (button.isConnected) button.disabled = false; }
      }));
    }
    return Object.freeze({ list, editor, categories, bind(target) { bindList(target); bindForm(target); } });
  } });
})();
