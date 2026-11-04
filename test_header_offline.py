from pathlib import Path
import re,json
from playwright.sync_api import sync_playwright
root=Path('/mnt/data/afra_header_fix_work')
html=(root/'index.html').read_text()
# Inline local styles/scripts for preview inside browser network restrictions.
for name in ['style.css','afra-theme.css','afra-platform.css','afra-home-header.css']:
 rx=r'<link rel="stylesheet" href="'+re.escape(name)+r'(?:\?[^\"]*)?">'
 html,n=re.subn(rx,lambda m:'<style data-style="'+name+'">'+(root/name).read_text()+'</style>',html)
 print('inlined style',name,n)
for name in ['afra-theme.js','afra-platform.js']:
 rx=r'<script defer src="'+re.escape(name)+r'(?:\?[^\"]*)?"></script>'
 html,n=re.subn(rx,lambda m:'<script data-script="'+name+'">'+(root/name).read_text()+'</script>',html)
 print('inlined js',name,n)
# Remove remote dependencies and supabase client absent; header logic does not require it.
html=re.sub(r'<script src="https?://[^\"]+"[^>]*></script>','',html)
html=re.sub(r'<link[^>]+href="https?://[^\"]+"[^>]*>','',html)
html=re.sub(r'<script src="supabase.js"></script>','',html)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,1200,1024,768,390,320]:
  page=browser.new_page(viewport={'width':width,'height':850})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded',timeout=15000)
  page.locator('#afraThemeToggle').wait_for(timeout=4000)
  data=page.evaluate('''() => {const rect=s=>{let r=document.querySelector(s).getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}};
   const actions=[...document.querySelectorAll('.auth-top-actions > button')].map(b=>{let r=b.getBoundingClientRect();return {text:b.innerText.trim(),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width)}});
   const quick=[...document.querySelectorAll('#afraQuickNav a')].map(a=>{let r=a.getBoundingClientRect(), node=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {text:a.innerText,href:a.getAttribute('href'),clickable:node===a||a.contains(node),w:Math.round(r.width)}});
   return {menu:rect('#menuToggle'),quick:rect('#afraQuickNav'),actions,quickLinks:quick,barCount:document.querySelectorAll('.ap-travelbar').length,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth};
  }''')
  page.locator('#menuToggle').click(timeout=3000)
  opened=page.locator('#mainNav').evaluate('(el)=>el.classList.contains("nav-open")&&getComputedStyle(el).display!=="none"')
  page.screenshot(path=f'/mnt/data/afra_header_{width}.png',full_page=False)
  page.locator('#mainNav a[href="search.html"]').click(timeout=4000,no_wait_after=True)
  results.append(dict(width=width,data=data,opened=opened,errors=errors[:3]))
  page.close()
 browser.close()
print(json.dumps(results,ensure_ascii=False,indent=2))
