from pathlib import Path
root=Path(__file__).resolve().parent
page=root/'index.html'
s=page.read_text('utf-8')
old='''            <nav class="nav" id="mainNav">
                <a href="#home" class="nav-link active">صفحه اصلی</a>
                <a href="#stays" class="nav-link">اقامتگاه‌ها</a>
                <a href="#categories" class="nav-link">دسته‌بندی‌ها</a>
                <a href="#regions" class="nav-link">مقصدها</a>
                <a href="#faq" class="nav-link">راهنما</a>
                <a href="#about" class="nav-link">درباره ما</a>
                <a href="my-reservations.html" class="nav-link">پیگیری رزرو</a>
            </nav>

            <div class="header-actions">
                <div class="auth-top-actions">
                    <button type="button" class="auth-top-button" data-auth-open="login">ورود</button>
                    <button type="button" class="auth-top-button" data-auth-open="guest-signup">ثبت نام</button>
                    <button type="button" class="auth-top-button primary" data-auth-open="owner-signup">میزبان شوید</button>
                </div>

                <button class="menu-toggle" id="menuToggle"
                    type="button"
                    aria-label="باز کردن منو"
                    aria-expanded="false"
                    aria-controls="mainNav">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
'''
new='''            <!-- Six direct links: functional without JavaScript; inside hamburger on small screens. -->
            <nav class="afra-quick-nav" id="afraQuickNav" aria-label="دسترسی‌های اصلی افرا سفر">
                <a href="search.html">جست‌وجوی پیشرفته</a>
                <a href="categories.html">دسته‌بندی‌ها</a>
                <a href="map.html">نقشه</a>
                <a href="guest-dashboard.html">حساب مسافر</a>
                <a href="become-host.html">میزبان شوید</a>
                <a href="support.html">پشتیبانی</a>
            </nav>

            <!-- Opened from the same hamburger at every viewport; includes the six links on mobile. -->
            <nav class="nav" id="mainNav" aria-label="منوی کامل افرا سفر">
                <span class="afra-menu-label">دسترسی‌های اصلی</span>
                <a href="search.html" class="nav-link">جست‌وجوی پیشرفته</a>
                <a href="categories.html" class="nav-link">دسته‌بندی‌ها</a>
                <a href="map.html" class="nav-link">نقشه</a>
                <a href="guest-dashboard.html" class="nav-link">حساب مسافر</a>
                <a href="become-host.html" class="nav-link">میزبان شوید</a>
                <a href="support.html" class="nav-link">پشتیبانی</a>
                <span class="afra-menu-label afra-menu-label--more">بخش‌های صفحه اصلی</span>
                <a href="#home" class="nav-link active">ابتدای صفحه</a>
                <a href="#stays" class="nav-link">اقامتگاه‌ها</a>
                <a href="#regions" class="nav-link">مقصدها</a>
                <a href="#faq" class="nav-link">راهنما</a>
                <a href="#about" class="nav-link">درباره ما</a>
                <a href="my-reservations.html" class="nav-link">پیگیری رزرو</a>
            </nav>

            <!-- Four items, stacked in one left-aligned column; theme button is added here by afra-theme.js. -->
            <div class="header-actions">
                <div class="auth-top-actions" aria-label="حساب و تنظیمات ظاهر">
                    <button type="button" class="auth-top-button" data-auth-open="login">ورود</button>
                    <button type="button" class="auth-top-button" data-auth-open="guest-signup">ثبت نام</button>
                    <button type="button" class="auth-top-button primary" data-auth-open="owner-signup">میزبان شوید</button>
                </div>
            </div>
            <!-- A sibling of the action column: fixed right edge, never affected by button wrapping. -->
            <button class="menu-toggle" id="menuToggle"
                type="button"
                aria-label="باز کردن منو"
                aria-expanded="false"
                aria-controls="mainNav">
                <span></span><span></span><span></span>
            </button>
'''
assert s.count(old)==1, f'expected one header block: {s.count(old)}'
s=s.replace(old,new)
old_css='<link rel="stylesheet" href="afra-platform.css?v=20261104p5">'
assert s.count(old_css)==1
s=s.replace(old_css,old_css+'\n  <link rel="stylesheet" href="afra-home-header.css?v=20261105h1">')
page.write_text(s,'utf-8')
js_file=root/'afra-platform.js';js=js_file.read_text('utf-8')
old_nav='''function nav(){
 if($('.ap-travelbar'))return;'''
new_nav='''function nav(){
 // The homepage has its own fully interactive header. Do not overlay a second
 // travel bar over its links and hamburger button (previous mobile click bug).
 if(currentFile==='index.html')return;
 if($('.ap-travelbar'))return;'''
assert js.count(old_nav)==1
js_file.write_text(js.replace(old_nav,new_nav),'utf-8')
js_file=root/'afra-theme.js';js=js_file.read_text('utf-8')
assert "'index.html': '.header-inner'" in js
js=js.replace("'index.html': '.header-inner'","'index.html': '.auth-top-actions'")
js_file.write_text(js,'utf-8')

(root/'afra-home-header.css').write_text('''/* Afra Safar home header patch — 2026-11-05.
   Only the homepage is changed. Other pages and the glass search are untouched.
   These overrides load last to resolve conflicting earlier mobile header rules. */
body[data-afra-page="index.html"] .ap-travelbar { display:none !important; }
body[data-afra-page="index.html"] .header {
  position:absolute !important;
  inset:0 0 auto !important;
  width:100% !important;
  height:64px !important;
  z-index:800 !important;
  overflow:visible !important;
  background:rgba(15,21,19,.87) !important;
  -webkit-backdrop-filter:blur(15px) !important;
  backdrop-filter:blur(15px) !important;
}
body[data-afra-page="index.html"] .header .header-inner {
  position:relative !important;
  display:block !important;
  width:calc(100% - 32px) !important;
  max-width:1500px !important;
  min-height:64px !important;
  height:64px !important;
  margin-inline:auto !important;
  padding:0 !important;
  overflow:visible !important;
}
/* Red: the hamburger is anchored to the same stable header container at all sizes. */
body[data-afra-page="index.html"] #menuToggle {
  position:absolute !important;
  inset:11px 0 auto auto !important;
  display:flex !important;
  width:43px !important;
  height:43px !important;
  padding:0 !important;
  flex-direction:column !important;
  align-items:center !important;
  justify-content:center !important;
  z-index:820 !important;
  transform:none !important;
  margin:0 !important;
}
body[data-afra-page="index.html"] #menuToggle:focus-visible,
body[data-afra-page="index.html"] .afra-quick-nav a:focus-visible,
body[data-afra-page="index.html"] .auth-top-actions button:focus-visible {
  outline:3px solid #d8b777 !important;
  outline-offset:3px !important;
}
body[data-afra-page="index.html"] .header .logo {
  position:absolute !important;
  top:10px !important;
  right:58px !important;
  left:auto !important;
  z-index:815 !important;
  margin:0 !important;
  max-width:190px !important;
}
/* Blue: direct, clickable internal pages, not a second overlapping nav bar. */
body[data-afra-page="index.html"] .afra-quick-nav {
  position:absolute !important;
  top:11px !important;
  right:245px !important;
  left:187px !important;
  z-index:810 !important;
  height:43px !important;
  display:flex !important;
  flex-flow:row nowrap !important;
  justify-content:center !important;
  align-items:center !important;
  gap:clamp(3px,.9vw,17px) !important;
  white-space:nowrap !important;
  direction:rtl !important;
}
body[data-afra-page="index.html"] .afra-quick-nav a {
  display:inline-flex !important;
  flex:0 1 auto !important;
  align-items:center !important;
  justify-content:center !important;
  min-height:39px !important;
  padding:7px clamp(5px,.75vw,12px) !important;
  border-radius:11px !important;
  color:#fff !important;
  text-decoration:none !important;
  font:700 clamp(10px,.85vw,12px)/1.6 'Vazirmatn',Tahoma,sans-serif !important;
  pointer-events:auto !important;
  transition:background .18s ease !important;
}
body[data-afra-page="index.html"] .afra-quick-nav a:hover { background:rgba(255,255,255,.18) !important; }
/* Green: four controls in one vertically aligned left-hand column. */
body[data-afra-page="index.html"] .header .header-actions {
  position:absolute !important;
  top:10px !important;
  left:0 !important;
  right:auto !important;
  width:154px !important;
  height:auto !important;
  z-index:815 !important;
  display:block !important;
  padding:0 !important;
  margin:0 !important;
}
body[data-afra-page="index.html"] .header .auth-top-actions {
  display:flex !important;
  flex-direction:column !important;
  flex-wrap:nowrap !important;
  align-items:stretch !important;
  justify-content:flex-start !important;
  width:100% !important;
  gap:7px !important;
  margin:0 !important;
}
body[data-afra-page="index.html"] .header .auth-top-actions > .auth-top-button,
body[data-afra-page="index.html"] .header .auth-top-actions > #afraThemeToggle {
  display:flex !important;
  width:100% !important;
  min-width:0 !important;
  max-width:none !important;
  height:38px !important;
  min-height:38px !important;
  box-sizing:border-box !important;
  padding:7px 10px !important;
  border-radius:999px !important;
  align-items:center !important;
  justify-content:center !important;
  text-align:center !important;
  line-height:1.5 !important;
  font-size:11px !important;
  overflow:visible !important;
  text-overflow:clip !important;
  white-space:nowrap !important;
  margin:0 !important;
}
body[data-afra-page="index.html"] .header .auth-top-actions > #afraThemeToggle {
  order:-1 !important;
  position:static !important;
  transform:none !important;
  border-color:rgba(255,255,255,.42) !important;
  color:#fff !important;
  background:rgba(255,255,255,.15) !important;
}
body[data-afra-page="index.html"] #afraThemeToggle .afra-theme-switch__label {
  display:inline !important;
}
body[data-afra-page="index.html"] #afraThemeToggle .afra-theme-switch__icon {
  display:inline-grid !important;
}
/* One accessible drop-down for all breakpoints. */
body[data-afra-page="index.html"] #mainNav.nav {
  position:absolute !important;
  top:64px !important;
  right:0 !important;
  left:auto !important;
  width:min(330px,calc(100vw - 32px)) !important;
  max-height:min(77dvh,670px) !important;
  padding:12px !important;
  overflow-y:auto !important;
  overscroll-behavior:contain !important;
  z-index:825 !important;
  border:1px solid rgba(255,255,255,.24) !important;
  border-radius:0 0 17px 17px !important;
  background:rgba(25,28,28,.97) !important;
  -webkit-backdrop-filter:blur(20px) !important;
  backdrop-filter:blur(20px) !important;
  box-shadow:0 18px 45px rgba(0,0,0,.36) !important;
}
body[data-afra-page="index.html"] #mainNav.nav:not(.nav-open) {display:none !important;}
body[data-afra-page="index.html"] #mainNav.nav.nav-open {display:flex !important;}
body[data-afra-page="index.html"] #mainNav .nav-link {
  flex:0 0 auto !important;
  width:100% !important;
  min-height:42px !important;
  font-size:12px !important;
  color:#fff !important;
  padding:10px 13px !important;
}
body[data-afra-page="index.html"] #mainNav .afra-menu-label {
  display:block;
  flex:0 0 auto;
  padding:7px 11px 4px;
  color:#b9c8c1;
  font:700 11px/1.8 'Vazirmatn',Tahoma,sans-serif;
}
body[data-afra-page="index.html"] #mainNav .afra-menu-label--more {
  margin-top:8px;
  border-top:1px solid rgba(255,255,255,.18);
  padding-top:12px;
}
@media(max-width:1150px) {
  body[data-afra-page="index.html"] .afra-quick-nav {display:none !important;}
}
@media(max-width:700px) {
  body[data-afra-page="index.html"] .header {height:62px !important;}
  body[data-afra-page="index.html"] .header .header-inner {
    width:calc(100% - 24px) !important;
    height:62px !important;
    min-height:62px !important;
    display:block !important;
  }
  body[data-afra-page="index.html"] #menuToggle {
    top:10px !important;
    right:0 !important;
    left:auto !important;
    width:42px !important;
    height:42px !important;
  }
  body[data-afra-page="index.html"] .header .logo {
    top:10px !important;
    right:50px !important;
    left:auto !important;
    max-width:min(175px,calc(100vw - 190px)) !important;
  }
  body[data-afra-page="index.html"] .header .logo-text strong {font-size:15px !important;}
  body[data-afra-page="index.html"] .header .logo-text small {display:none !important;}
  body[data-afra-page="index.html"] .header .header-actions {
    top:71px !important;
    left:0 !important;
    right:auto !important;
    width:118px !important;
    z-index:812 !important;
  }
  body[data-afra-page="index.html"] .header .auth-top-actions {gap:6px !important;}
  body[data-afra-page="index.html"] .header .auth-top-actions > .auth-top-button,
  body[data-afra-page="index.html"] .header .auth-top-actions > #afraThemeToggle {
    height:34px !important;
    min-height:34px !important;
    padding:5px 7px !important;
    font-size:10px !important;
  }
  body[data-afra-page="index.html"] #mainNav.nav {
    top:62px !important;
    right:0 !important;
    left:auto !important;
    width:min(340px,calc(100vw - 24px)) !important;
    max-height:calc(100dvh - 72px) !important;
    border-radius:0 0 16px 16px !important;
  }
  body[data-afra-page="index.html"] .hero-content {
    padding-top:245px !important;
  }
}
@media(max-width:360px) {
  body[data-afra-page="index.html"] .header .header-actions {width:104px !important;}
  body[data-afra-page="index.html"] .header .logo-text strong {font-size:14px !important;}
  body[data-afra-page="index.html"] .hero-content {padding-top:230px !important;}
}
''','utf-8')
print('patched index and js, created stylesheet')
