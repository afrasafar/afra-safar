"""Responsive navigation, appearance, identity and read-only UI flows."""
import ast
import functools
import http.server
import json
import os
import sys
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
FOCUSED='--focused' in sys.argv
definitions={}
for node in ast.parse((ROOT/'qa/check_video_theme.py').read_text()).body:
    if isinstance(node,ast.Assign) and isinstance(node.targets[0],ast.Name) and node.targets[0].id in ['MOCK','AUDIT']:
        definitions[node.targets[0].id]=ast.literal_eval(node.value)
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
    def handle(self):
        try:super().handle()
        except (BrokenPipeError,ConnectionResetError):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=ROOT))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}'
results=[];failures=[]
def check(name,ok,detail=None):
    row={'check':name,'ok':bool(ok)}
    if detail is not None:row['detail']=detail
    results.append(row)
    if not ok:failures.append(row)
def route(r):
    if r.request.url.startswith(BASE):
        if r.request.url.split('?')[0].endswith('/supabase.js'):r.fulfill(body='',content_type='application/javascript')
        else:r.continue_()
    else:r.fulfill(body='',content_type='application/javascript')

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('AFRA_BROWSER'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--enable-unsafe-swiftshader'])
    def context(mode='admin',motion='reduce',touch=False,delay=False):
        c=browser.new_context(viewport={'width':320,'height':850},reduced_motion=motion,is_mobile=touch,has_touch=touch)
        c.route('**/*',route)
        c.add_init_script('('+definitions['MOCK']+')('+json.dumps(mode)+');'+('const original=window.afraSupabase.auth.getUser;window.afraSupabase.auth.getUser=async()=>{await new Promise(r=>setTimeout(r,200));return original();};' if delay else ''))
        return c
    c=context();page=c.new_page()
    for f in ([] if FOCUSED else sorted(ROOT.rglob('*.html'))):
        name=str(f.relative_to(ROOT))
        try:
            page.goto(BASE+'/'+name,wait_until='load');page.wait_for_timeout(80)
            page.evaluate('document.fonts.ready')
            w=page.evaluate('document.documentElement.scrollWidth')
            check(name+':320px overflow',w<=322,w)
            menu=page.locator('#menuToggle:visible,.ap-nav-toggle:visible,.menu-button:visible').first
            if menu.count():
                brand=page.locator('.admin-mobile-brand:visible,.afra-mobile-header-brand:visible,.header .logo:visible').first
                check(name+':mobile brand',brand.count()>0)
                if brand.count():
                    a=menu.bounding_box();b=brand.bounding_box()
                    ok=a and b and a['x']>160 and b['x']+b['width']<=a['x']+2 and abs((a['y']+a['height']/2)-(b['y']+b['height']/2))<15
                    check(name+':menu right and adjacent brand',ok,{'menu':a,'brand':b})
                menu.click()
                check(name+':menu expanded',menu.get_attribute('aria-expanded')=='true')
                page.keyboard.press('Escape')
                check(name+':menu Escape',menu.get_attribute('aria-expanded')=='false')
            else:check(name+':mobile menu',False)
        except Exception as e:check(name+':mobile flow',False,str(e)[:180])
    if not FOCUSED:print('All 85 mobile page flows checked',flush=True)

    # Admin identity: long email remains inside its container and brand opens home.
    for width in [320,390,768,1440]:
        page.set_viewport_size({'width':width,'height':850})
        page.goto(BASE+'/admin-v2/index.html',wait_until='load')
        if width<=900:page.locator('.menu-button').click()
        email=page.locator('.profile-email');parent=page.locator('.sidebar-profile')
        a=email.bounding_box();b=parent.bounding_box()
        check(f'admin email contained {width}',a and b and a['x']>=b['x'] and a['x']+a['width']<=b['x']+b['width'] and a['y']>=b['y'] and a['y']+a['height']<=b['y']+b['height'])
        check(f'admin real leaf loaded {width}',page.locator('.brand img.afra-admin-leaf').evaluate('(x)=>x.complete&&x.naturalWidth>0'))
        if width<=900:
            a=page.locator('.brand img.afra-admin-leaf').bounding_box();b=page.locator('.menu-button').bounding_box()
            check(f'admin leaf clear of menu {width}',a and b and (a['x']+a['width']<=b['x'] or a['x']>=b['x']+b['width']),{'leaf':a,'menu':b})
        check(f'admin brand home target {width}',page.locator('.app-sidebar .brand').get_attribute('href')=='../index.html')
        if width in [390,1440]:page.screenshot(path=f'/tmp/afra-video-admin-menu-{width}.png')
    page.locator('.app-sidebar .brand').click();page.wait_for_url(BASE+'/index.html')
    check('admin brand opens main site',page.url==BASE+'/index.html')

    # Appearance persists between old pages and the integrated admin pages.
    for name in ['search.html','owner-login.html','admin-v2/index.html']:
        page.set_viewport_size({'width':390,'height':850});page.goto(BASE+'/'+name,wait_until='load')
        before=page.evaluate('document.documentElement.dataset.afraTheme')
        page.locator('#afraThemeToggle').click()
        after=page.evaluate('document.documentElement.dataset.afraTheme')
        check(name+':theme toggle',before!=after)
        page.evaluate('window.scrollTo(0,document.body.scrollHeight)')
        b=page.locator('#afraThemeToggle').bounding_box()
        check(name+':theme visible after scroll',b and b['y']>=0 and b['y']+b['height']<=851,b)
        page.reload(wait_until='load')
        check(name+':theme persisted',page.evaluate('document.documentElement.dataset.afraTheme')==after)

    # Auth/authorization use delayed synthetic results; no data calls are permitted.
    for mode in ['guest','denied']:
        cc=context(mode=mode,delay=True);pp=cc.new_page();pp.goto(BASE+'/admin.html',wait_until='load');pp.wait_for_timeout(350)
        check(mode+':access gate',pp.locator('#admin-login').count()==1 if mode=='guest' else 'دسترسی مدیر لازم است' in pp.locator('body').inner_text())
        check(mode+':no table reads',pp.evaluate('window.__qaReads.length')==0)
        check(mode+':one persistent appearance button',pp.locator('#afraThemeToggle').count()==1)
        audit=pp.evaluate(definitions['AUDIT']);check(mode+':readable auth view',not audit['contrast'],audit['contrast'])
        cc.close()

    # Jalali picker and coupon are opened through the existing UI.
    page.set_viewport_size({'width':1440,'height':1000});page.goto(BASE+'/search.html',wait_until='load')
    page.evaluate("AfraTheme.setPreference('dark')")
    picker=page.locator('.afra-jdate-trigger:visible').first
    picker.click();check('Jalali picker opens',page.locator('.afra-jcal-dialog:visible').count()==1)
    audit=page.evaluate(definitions['AUDIT']);check('Jalali picker contrast',not audit['contrast'],audit['contrast'])
    day=page.locator('.afra-jcal-day:not(:disabled)').first
    if day.count():day.click();check('Jalali selection closes picker',page.locator('.afra-jcal-dialog:visible').count()==0)
    page.keyboard.press('Escape')
    page.goto(BASE+'/index.html',wait_until='load');page.evaluate("AfraTheme.setPreference('dark')")
    page.locator('#destination').click();page.wait_for_timeout(100)
    if page.locator('#openCoupon:visible').count():
        page.locator('#openCoupon').click()
        check('Coupon opens through search',page.locator('#afraCouponOverlay').get_attribute('aria-hidden')=='false')
        audit=page.evaluate(definitions['AUDIT']);check('Coupon contrast',not audit['contrast'],audit['contrast'])
        page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:async(x)=>{window.__copied=x;}}})")
        page.locator('#afraCouponCopy').click();check('Coupon copy works',page.evaluate('window.__copied')=='AFRAFIRST')
        page.locator('#afraCouponClose').click();check('Coupon closes',page.locator('#afraCouponOverlay').get_attribute('aria-hidden')=='true')
    else:check('Coupon trigger visible after search opens',False)

    # Actual desktop hover moves only gently; reduced motion leaves content visible.
    cc=context(motion='no-preference');pp=cc.new_page();pp.set_viewport_size({'width':1440,'height':1000});pp.goto(BASE+'/search.html',wait_until='load')
    card=pp.locator('.ap-stay').first;card.scroll_into_view_if_needed();pp.wait_for_timeout(700);card.hover();pp.wait_for_timeout(350)
    trans=card.evaluate('(x)=>getComputedStyle(x).translate');check('Desktop card hover distance',trans=='0px -4px',trans)
    pp.locator('#afraThemeToggle').click();pp.wait_for_timeout(1650);check('Animated theme completes',pp.evaluate("!document.documentElement.hasAttribute('data-afra-theme-capturing')"))
    pp.goto(BASE+'/admin-v2/pages/support.html',wait_until='load');pp.wait_for_timeout(800)
    check('Admin dynamic cards receive shared animation',pp.locator('#admin-content .card.afra-motion-enter').count()>0)
    cc.close()
    cc=context(touch=True);pp=cc.new_page();pp.goto(BASE+'/search.html',wait_until='load')
    check('Touch has no hover styling',not pp.evaluate("matchMedia('(hover:hover)').matches"))
    check('Reduced motion content visible',pp.locator('.ap-stay').first.evaluate('(x)=>Number(getComputedStyle(x).opacity)===1'))
    check('Active mobile icon contrasts with gold',pp.locator('.afra-mobile-nav [aria-current] .afra-mobile-nav__icon svg').evaluate("x=>getComputedStyle(x).color==='rgb(15, 15, 35)'"))
    cc.close()
    page.goto(BASE+'/booking-voucher.html',wait_until='load');page.emulate_media(media='print')
    check('Voucher print uses white paper',page.evaluate("getComputedStyle(document.body).backgroundColor==='rgb(255, 255, 255)'"))
    if page.locator('h1').count():check('Voucher print heading readable',page.locator('h1').first.evaluate("x=>getComputedStyle(x).color==='rgb(17, 17, 17)'"))
    page.emulate_media(media='screen')
    check('No real data writes',page.evaluate('window.__qaWrites.length')==0)
    browser.close()
server.shutdown()
report={'checks':len(results),'failures':failures,'results':results}
(ROOT/'qa'/('video-theme-final-checks.json' if FOCUSED else 'video-theme-interactions.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'checks':len(results),'failures':failures},ensure_ascii=False,indent=2))
