import json
from playwright.sync_api import sync_playwright
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,1200,1024,768,390,320]:
  page=browser.new_page(viewport={'width':width,'height':850})
  page.route('**/*', lambda route: route.continue_() if '127.0.0.1' in route.request.url else route.abort())
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:8799/index.html',wait_until='domcontentloaded')
  page.locator('#afraThemeToggle').wait_for(timeout=6000)
  data=page.evaluate('''() => {const rect=s=>{let r=document.querySelector(s).getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}};
 return {menu:rect('#menuToggle'), quick:rect('#afraQuickNav'), actions:[...document.querySelectorAll('.auth-top-actions > button')].map(b=>{let r=b.getBoundingClientRect();return {text:b.innerText.trim(),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width)}}), barCount:document.querySelectorAll('.ap-travelbar').length, scrollWidth:document.documentElement.scrollWidth, bodyWidth:document.body.scrollWidth, quickLinks:[...document.querySelectorAll('#afraQuickNav a')].map(a=>a.getAttribute('href'))}}
 ''')
  page.locator('#menuToggle').click(timeout=6000)
  opened=page.locator('#mainNav').evaluate('(el)=>el.classList.contains("nav-open")&&getComputedStyle(el).display!=="none"')
  page.screenshot(path=f'/mnt/data/afra_header_{width}.png',full_page=False)
  page.locator('#mainNav a[href="search.html"]').click(timeout=6000)
  page.wait_for_url('**/search.html',timeout=5000)
  results.append(dict(width=width,data=data,opened=opened,nav_click_ok=page.url.endswith('search.html'),errors=errors[:3]))
  page.close()
 browser.close()
print(json.dumps(results,ensure_ascii=False,indent=2))
