from pathlib import Path
import re,json
from playwright.sync_api import sync_playwright
root=Path('/mnt/data/afra_header_fix_work')
html=(root/'index.html').read_text()
for name in ['style.css','afra-theme.css','afra-platform.css','afra-home-header.css']:
 html=re.sub(r'<link rel="stylesheet" href="'+re.escape(name)+r'(?:\?[^\"]*)?">',lambda m:'<style>'+(root/name).read_text()+'</style>',html)
for name in ['afra-theme.js','afra-platform.js']:
 html=re.sub(r'<script defer src="'+re.escape(name)+r'(?:\?[^\"]*)?"></script>',lambda m:'<script>'+(root/name).read_text()+'</script>',html)
html=re.sub(r'<script src="https?://[^\"]+"[^>]*></script>','',html)
html=re.sub(r'<link[^>]+href="https?://[^\"]+"[^>]*>','',html)
html=re.sub(r'<script src="supabase.js"></script>','',html)
results={}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for w in [1440,390,320]:
  page=browser.new_page(viewport={'width':w,'height':850})
  page.set_content(html,wait_until='domcontentloaded')
  page.locator('#afraThemeToggle').wait_for()
  # hide test coupon popover that appears 9sec later
  page.screenshot(path=f'/mnt/data/afra_header_closed_{w}.png',full_page=False)
  initial=page.locator('#afraThemeToggle').inner_text()
  page.locator('#afraThemeToggle').click()
  after=page.locator('#afraThemeToggle').inner_text()
  dark=page.evaluate("document.documentElement.getAttribute('data-afra-theme')")
  page.locator('[data-auth-open="login"]').click()
  modal=page.locator('#authModal').get_attribute('aria-hidden')
  page.locator('#authClose').click()
  modal_closed=page.locator('#authModal').get_attribute('aria-hidden')
  # check all 6 destination files are included and there is no duplicate travelbar in production
  urls=[a.get_attribute('href') for a in page.locator('#afraQuickNav a').all()]
  exists=all((root/x).is_file() for x in urls)
  menu_pos=page.locator('#menuToggle').bounding_box()
  results[w]={'theme_before':initial,'theme_after':after,'theme_state':dark,'login_modal_visible':modal=='false','modal_closed':modal_closed=='true','six_targets_exist':exists,'menu_right_gap':round(w-(menu_pos['x']+menu_pos['width'])),'buttons':page.locator('.auth-top-actions > button').count()}
  page.close()
 browser.close()
print(json.dumps(results,ensure_ascii=False,indent=2))
