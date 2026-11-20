(() => {
  "use strict";

  if (document.body.dataset.appInitialized === "true" || document.querySelector(".app-main")) {
    return;
  }
  document.body.dataset.appInitialized = "true";

  const body = document.body;
  const root = body.dataset.root || "";
  const page = body.dataset.page || "dashboard";
  const title = body.dataset.title || "داشبورد مدیریت";
  const subtitle = body.dataset.subtitle || "مرکز کنترل و مدیریت فروشگاه";

  const nav = [
    { id: "dashboard", label: "داشبورد", icon: "fa-tachometer-alt", href: `${root}index.html` },
    { id: "users", label: "کاربران", icon: "fa-users", children: [
      ["users-list", "مدیریت کاربران", `${root}pages/users/index.html`],
      ["users-create", "افزودن کاربر", `${root}pages/users/create.html`],
      ["users-roles", "نقش‌ها", `${root}pages/users/roles.html`]
    ]},
    { id: "products", label: "محصولات", icon: "fa-box", children: [
      ["products-list", "لیست محصولات", `${root}pages/products/index.html`],
      ["products-create", "افزودن محصول", `${root}pages/products/create.html`],
      ["products-categories", "دسته‌بندی", `${root}pages/products/categories.html`]
    ]},
    { id: "orders", label: "سفارشات", icon: "fa-shopping-cart", children: [
      ["orders-new", "سفارشات جدید", `${root}pages/orders/new.html`],
      ["orders-history", "تاریخچه سفارشات", `${root}pages/orders/history.html`],
      ["orders-reports", "گزارشات", `${root}pages/orders/reports.html`]
    ]},
    { id: "analytics", label: "آمار و تحلیل", icon: "fa-chart-bar", href: `${root}pages/analytics.html` },
    { id: "finance", label: "مالی", icon: "fa-coins", children: [
      ["finance-revenue", "گزارش درآمد", `${root}pages/finance/revenue.html`],
      ["finance-transactions", "تراکنش‌ها", `${root}pages/finance/transactions.html`],
      ["finance-invoices", "صورتحساب", `${root}pages/finance/invoices.html`]
    ]},
    { id: "settings", label: "تنظیمات", icon: "fa-cog", children: [
      ["settings-general", "تنظیمات عمومی", `${root}pages/settings/general.html`],
      ["settings-config", "پیکربندی", `${root}pages/settings/config.html`],
      ["settings-backup", "پشتیبان‌گیری", `${root}pages/settings/backup.html`]
    ]}
  ];

  const activeGroup = nav.find(item => item.children?.some(child => child[0] === page))?.id;
  const navMarkup = nav.map(item => {
    if (item.href) {
      return `<a class="nav-link ${item.id === page ? "active" : ""}" href="${item.href}">
        <i class="fas ${item.icon}" aria-hidden="true"></i><span>${item.label}</span>
      </a>`;
    }
    const open = activeGroup === item.id;
    return `<div class="nav-group ${open ? "open" : ""}">
      <button class="nav-group-toggle" type="button" aria-expanded="${open}" data-nav-group="${item.id}">
        <i class="fas ${item.icon}" aria-hidden="true"></i><span>${item.label}</span>
        <i class="fas fa-chevron-down chevron" aria-hidden="true"></i>
      </button>
      <div class="nav-submenu"><div>
        ${item.children.map(child => `<a class="nav-link ${child[0] === page ? "active" : ""}" href="${child[2]}">${child[1]}</a>`).join("")}
      </div></div>
    </div>`;
  }).join("");

  const shell = document.querySelector("[data-app-shell]");
  if (shell) {
    shell.insertAdjacentHTML("beforebegin", `
      <button class="menu-button" type="button" aria-label="باز کردن منو" aria-controls="app-sidebar" aria-expanded="false">
        <i class="fas fa-bars" aria-hidden="true"></i>
      </button>
      <div class="sidebar-overlay" data-close-sidebar></div>
      <aside class="app-sidebar" id="app-sidebar" aria-label="منوی اصلی">
        <a class="brand" href="${root}index.html">
          <span class="brand-mark"><i class="fas fa-crown" aria-hidden="true"></i></span>
          <span><strong>پنل ادمین</strong><small>مدیریت هوشمند فروشگاه</small></span>
        </a>
        <nav class="sidebar-nav">${navMarkup}</nav>
        <div class="sidebar-profile">
          <img src="${root}assets/images/avatar.svg" alt="تصویر ادمین">
          <span class="profile"><strong>ادمین سیستم</strong><small>مدیر ارشد</small></span>
          <span class="profile-status" title="آنلاین"></span>
        </div>
      </aside>
      <div class="app-main">
        <header class="app-header">
          <div class="page-title"><h1>${title}</h1><p>${subtitle}</p></div>
          <div class="header-actions">
            <button class="icon-button" type="button" aria-label="اعلان‌ها" data-toast-message="۳ اعلان خوانده‌نشده دارید">
              <i class="fas fa-bell" aria-hidden="true"></i><span class="notification-dot">۳</span>
            </button>
            <button class="btn btn-primary header-profile" type="button" data-toast-message="پروفایل ادمین آماده ویرایش است">
              <i class="fas fa-user-circle" aria-hidden="true"></i><span>پروفایل</span>
            </button>
          </div>
        </header>
      </div>
      <div class="toast-stack" aria-live="polite" aria-atomic="true"></div>
    `);
    document.querySelector(".app-main").append(shell);
  }

  const menuButton = document.querySelector(".menu-button");
  const closeSidebar = () => {
    body.classList.remove("sidebar-open");
    menuButton?.setAttribute("aria-expanded", "false");
  };
  menuButton?.addEventListener("click", () => {
    const open = body.classList.toggle("sidebar-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  document.querySelector("[data-close-sidebar]")?.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeSidebar();
      document.querySelectorAll(".modal-backdrop.open").forEach(modal => closeModal(modal));
    }
  });

  document.querySelectorAll("[data-nav-group]").forEach(toggle => {
    toggle.addEventListener("click", () => {
      const group = toggle.closest(".nav-group");
      const willOpen = !group.classList.contains("open");
      document.querySelectorAll(".nav-group.open").forEach(openGroup => {
        if (openGroup !== group) {
          openGroup.classList.remove("open");
          openGroup.querySelector("[data-nav-group]")?.setAttribute("aria-expanded", "false");
        }
      });
      group.classList.toggle("open", willOpen);
      toggle.setAttribute("aria-expanded", String(willOpen));
    });
  });
  document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", closeSidebar));

  function toPersianDigits(value) {
    return String(value).replace(/\d/g, digit => "۰۱۲۳۴۵۶۷۸۹"[digit]);
  }
  document.querySelectorAll("[data-persian-number]").forEach(node => {
    node.textContent = toPersianDigits(node.textContent);
  });

  window.showToast = (message, type = "success") => {
    const stack = document.querySelector(".toast-stack");
    if (!stack) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i class="fas ${type === "danger" ? "fa-exclamation-circle" : "fa-check-circle"}" aria-hidden="true"></i><span>${message}</span>`;
    stack.append(toast);
    setTimeout(() => toast.remove(), 3600);
  };
  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-toast-message]");
    if (trigger) showToast(trigger.dataset.toastMessage);
  });

  function closeModal(modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }
  document.querySelectorAll("[data-modal-open]").forEach(trigger => {
    trigger.addEventListener("click", () => {
      const modal = document.getElementById(trigger.dataset.modalOpen);
      if (!modal) return;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      modal.querySelector("button, input, select, textarea")?.focus();
    });
  });
  document.querySelectorAll("[data-modal-close]").forEach(trigger => {
    trigger.addEventListener("click", () => closeModal(trigger.closest(".modal-backdrop")));
  });
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) closeModal(backdrop);
    });
  });

  document.querySelectorAll("form[data-demo-form]").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      showToast(form.dataset.success || "تغییرات با موفقیت ذخیره شد");
      form.querySelectorAll("[data-clear-after-submit]").forEach(input => { input.value = ""; });
    });
  });

  document.querySelectorAll("[data-table-search]").forEach(input => {
    const table = document.querySelector(input.dataset.tableSearch);
    if (!table) return;
    input.addEventListener("input", () => {
      const query = input.value.trim().toLocaleLowerCase("fa");
      table.querySelectorAll("tbody tr").forEach(row => {
        row.hidden = query && !row.textContent.toLocaleLowerCase("fa").includes(query);
      });
    });
  });
  document.querySelectorAll("[data-table-filter]").forEach(select => {
    const table = document.querySelector(select.dataset.tableFilter);
    if (!table) return;
    select.addEventListener("change", () => {
      table.querySelectorAll("tbody tr").forEach(row => {
        row.hidden = select.value && row.dataset.status !== select.value;
      });
    });
  });

  document.querySelectorAll("[data-confirm]").forEach(button => {
    button.addEventListener("click", () => {
      if (window.confirm(button.dataset.confirm)) {
        button.closest("tr, .list-item")?.remove();
        showToast("عملیات انجام شد");
      }
    });
  });
})();
