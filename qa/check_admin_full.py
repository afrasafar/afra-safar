"""Exercise admin actions against a local, synthetic backend; no production writes."""
import functools
import http.server
import json
import os
from pathlib import Path
import threading
import traceback
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
MOCK=(ROOT/'qa/admin-full-mock.js').read_text()
PNG=(ROOT/'images/afra-safar-logo.png').read_bytes()
P1='11111111-1111-4111-8111-111111111111'
P2='44444444-4444-4444-8444-444444444444'
R1='33333333-3333-4333-8333-333333333333'
R2='55555555-5555-4555-8555-555555555555'
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
    def translate_path(self,path):return super().translate_path(path[len('/installed'):] if path.startswith('/installed/') else path)
    def handle(self):
        try:super().handle()
        except (BrokenPipeError,ConnectionResetError):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=ROOT))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}'
results=[];failures=[];page_errors=[]
def check(name,condition,detail=None):
    item={'check':name,'ok':bool(condition)}
    if detail is not None:item['detail']=detail
    results.append(item)
    if not condition:failures.append(item)
def run(name,fn):
    try:fn();print(name,'passed',flush=True)
    except Exception as e:check(name,False,str(e)[:450]);print(name,'FAILED',str(e)[:220],flush=True)
def route(r):
    u=r.request.url
    if u.startswith(BASE):
        if '/__qa-storage__/' in u:r.fulfill(body=PNG,content_type='image/png')
        elif urlsplit(u).path.endswith('/supabase.js'):r.fulfill(body='',content_type='application/javascript')
        else:r.continue_()
    elif r.request.resource_type=='image':r.fulfill(body=PNG,content_type='image/png')
    else:r.fulfill(body='',content_type='text/css' if '.css' in u else 'application/javascript')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('AFRA_BROWSER'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--enable-unsafe-swiftshader'])
    def open_page(path='admin-v2/index.html',width=1440,theme='light',mode='admin',prefix=''):
        context=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce')
        context.route('**/*',route)
        context.add_init_script('('+MOCK+')('+json.dumps(mode)+');localStorage.setItem("afra-theme-preference",'+json.dumps(theme)+');')
        page=context.new_page();page.on('pageerror',lambda e:page_errors.append({'page':page.url.replace(BASE,''),'error':str(e)[:180]}))
        page.goto(BASE+prefix+'/'+path,wait_until='load');page.wait_for_timeout(80)
        return context,page
    def save(page):
        page.locator('#property-save').click()
        expect(page.locator('#property-form')).not_to_have_attribute('aria-busy','true',timeout=12000)
    def fill(page,title='اقامتگاه تازهٔ آزمایشی',price='0'):
        page.locator('[name=title]').fill(title);page.locator('[name=location]').fill('رامسر');page.locator('[name=capacity]').fill('6');page.locator('[name=price]').fill(price);page.locator('textarea[name=description]').fill('توضیحات آزمایشی')
    def files(n=2):return [{'name':f'gallery-{i}.png','mimeType':'image/png','buffer':PNG} for i in range(n)]

    def colors():
        for name,selector in [('index.html','h2'),('search.html','h1'),('admin-v2/index.html','.page-title h1')]:
            c,page=open_page(name)
            h=page.locator(selector).first
            check(name+' bright text green',h.evaluate("x=>getComputedStyle(x).color==='rgb(35, 83, 71)'"))
            page.evaluate("AfraTheme.setPreference('dark')")
            check(name+' dark gold retained',h.evaluate("x=>getComputedStyle(x).color==='rgb(255, 215, 0)'"))
            c.close()
    run('light/dark color scope',colors)

    def create_edit():
        c,page=open_page('admin-v2/pages/products/create.html?category=forest')
        check('category passed to new property',page.locator('[name=category]').input_value()=='forest')
        check('legacy active checkbox default',page.locator('[name=is_active]').is_checked())
        fill(page);page.locator('[name=is_active]').uncheck()
        page.locator('[name=image_file]').set_input_files(str(ROOT/'images/afra-safar-logo.png'))
        page.locator('[name=gallery_files]').set_input_files(files())
        expect(page.locator('#property-gallery-pending img')).to_have_count(2)
        save(page);expect(page.locator('#property-form-result')).to_have_attribute('data-kind','success')
        record=page.evaluate("__qa.state.tables.properties.find(x=>x.title==='اقامتگاه تازهٔ آزمایشی')")
        check('create complete data including zero price',record['price']==0 and record['capacity']==6 and record['category']=='forest' and record['is_active'] is False)
        check('cover upload uses current storage',record['image_url'].startswith(BASE+'/__qa-storage__/'))
        check('gallery attached to saved property',page.evaluate('(id)=>__qa.state.tables.property_images.filter(x=>x.property_id===id).length',record['id'])==2)
        check('three independent image uploads',page.evaluate("__qa.state.events.filter(x=>x.kind==='upload'&&x.table==='property-images'&&x.payload.upsert===false).length")==3)
        check('inactive record has no public link',not page.locator('#property-public-link').is_visible())
        check('saved editor has stable URL',page.url.endswith('edit='+record['id']))
        check('saved editor shows edit mode',page.locator('.page-title h1').inner_text()=='ویرایش اقامتگاه')
        page.locator('[name=title]').fill('اقامتگاه ویرایش‌شده');save(page)
        expect(page.locator('#property-form-result')).to_have_attribute('data-kind','success')
        check('save again updates rather than duplicates',page.evaluate("__qa.state.tables.properties.length===3 && __qa.state.events.filter(x=>x.kind==='insert'&&x.table==='properties').length===1"))
        check('no duplicate gallery on repeat save',page.evaluate('(id)=>__qa.state.tables.property_images.filter(x=>x.property_id===id).length',record['id'])==2)
        page.goto(BASE+'/admin-v2/pages/products/create.html?edit='+P1,wait_until='load')
        page.locator('textarea[name=description]').fill('شرح تازه');save(page)
        check('editing preserves property owner',page.evaluate('(id)=>__qa.state.tables.properties.find(x=>x.id===id).owner_id===__qa.U',P1))
        page.screenshot(path='/tmp/afra-admin-full-editor-1440.png',full_page=True)
        c.close()
    run('full property create and edit',create_edit)

    def partial_gallery():
        c,page=open_page('admin-v2/pages/products/create.html');fill(page,'ذخیرهٔ ناقص گالری')
        page.locator('[name=gallery_files]').set_input_files(files());expect(page.locator('#property-gallery-pending img')).to_have_count(2)
        page.evaluate('__qa.failGallery=1');save(page)
        expect(page.locator('#property-form-result')).to_have_attribute('data-kind','error')
        check('gallery failure explicitly reports saved property','اقامتگاه ذخیره شده است' in page.locator('#property-form-result').inner_text())
        check('partial save retains edit URL','edit=' in page.url)
        save(page);expect(page.locator('#property-form-result')).to_have_attribute('data-kind','success')
        check('gallery retry creates property once',page.evaluate("__qa.state.events.filter(x=>x.kind==='insert'&&x.table==='properties').length")==1)
        check('gallery retry reuses uploaded files',page.evaluate("__qa.state.events.filter(x=>x.kind==='upload').length")==2)
        check('gallery retry commits both records',page.evaluate('__qa.state.tables.property_images.length')==3)
        c.close()
    run('partial gallery recovery',partial_gallery)

    def upload_failure():
        c,page=open_page('admin-v2/pages/products/create.html');fill(page,'آزمایش خطای آپلود')
        page.locator('[name=image_file]').set_input_files(str(ROOT/'images/afra-safar-logo.png'))
        page.evaluate('__qa.failStorage=1');save(page)
        expect(page.locator('#property-form-result')).to_have_attribute('data-kind','error')
        check('failed cover upload does not create property',page.evaluate("__qa.state.events.filter(x=>x.table==='properties').length")==0)
        check('failed cover upload re-enables save',page.locator('#property-save').is_enabled())
        save(page);expect(page.locator('#property-form-result')).to_have_attribute('data-kind','success')
        check('cover retry creates exactly one property',page.evaluate("__qa.state.events.filter(x=>x.kind==='insert'&&x.table==='properties').length")==1)
        c.close()
    run('storage failure retry',upload_failure)

    def validation():
        c,page=open_page('admin-v2/pages/products/create.html');fill(page)
        page.locator('[name=image_file]').set_input_files({'name':'bad.svg','mimeType':'image/svg+xml','buffer':b'<svg/>'})
        expect(page.locator('#property-form-result')).to_have_attribute('data-kind','error')
        check('SVG upload rejected',page.locator('[name=image_file]').evaluate('x=>x.files.length')==0)
        check('light validation error readable',page.locator('#property-form-result').evaluate("x=>getComputedStyle(x).color==='rgb(154, 38, 58)'"))
        page.locator('[name=image_file]').set_input_files({'name':'bad.png','mimeType':'image/png','buffer':b'not an image'})
        expect(page.locator('#property-form-result')).to_contain_text('معتبر')
        check('corrupt image rejected',page.locator('[name=image_file]').evaluate('x=>x.files.length')==0)
        page.locator('[name=gallery_files]').set_input_files(files(11))
        expect(page.locator('#property-form-result')).to_contain_text('۱۰')
        check('gallery batch limit enforced',page.locator('[name=gallery_files]').evaluate('x=>x.files.length')==0)
        page.locator('[name=image_file]').set_input_files({'name':'huge.png','mimeType':'image/png','buffer':PNG+b'0'*(8*1024*1024)})
        expect(page.locator('#property-form-result')).to_contain_text('۸')
        check('oversize image rejected',page.locator('[name=image_file]').evaluate('x=>x.files.length')==0)
        page.locator('[name=capacity]').fill('0');save(page)
        check('invalid capacity produces no write',page.evaluate('__qa.state.events.length')==0)
        page.locator('[name=capacity]').fill('4');page.locator('[name=image_url]').fill('javascript:alert(1)');save(page)
        expect(page.locator('#property-form-result')).to_have_attribute('data-kind','error')
        check('invalid image URL produces no write',page.evaluate('__qa.state.events.length')==0)
        page.locator('[name=image_url]').fill('');page.evaluate("__qa.role='denied'");save(page)
        check('revoked admin cannot save',page.evaluate('__qa.state.events.length')==0 and 'مدیر' in page.locator('#property-form-result').inner_text())
        c.close()
    run('validation and revoked permission',validation)

    def listing():
        c,page=open_page('admin-v2/pages/products/index.html?category=forest',width=390)
        check('category-linked list filtered',page.locator('[data-property-row]:visible').count()==1)
        check('escaped property text stays text',page.locator('strong img').count()==0 and page.evaluate('window.__qaInjected===undefined'))
        page.locator('#admin-property-search').fill('غیرموجود');expect(page.locator('#admin-property-no-match')).to_be_visible()
        page.locator('#admin-property-search').fill('کلبه');page.locator('#admin-property-active').select_option('true')
        check('search and filters combine',page.locator('[data-property-row]:visible').count()==0)
        page.locator('#admin-property-active').select_option('false');check('matching combined filters restore rows',page.locator('[data-property-row]:visible').count()==1)
        page.locator('[data-toggle-property]').filter(has_text='فعال‌کردن').last.click()
        expect(page.locator('#admin-property-table')).to_be_visible()
        check('activation updates real property field',page.evaluate('(id)=>__qa.state.tables.properties.find(x=>x.id===id).is_active',P2))
        page.screenshot(path='/tmp/afra-admin-full-list-390.png',full_page=True)
        page.goto(BASE+'/admin-v2/pages/products/index.html',wait_until='load')
        dialogs=[]
        def cancel(d):dialogs.append(d.message);d.dismiss()
        page.on('dialog',cancel);page.locator(f'[data-delete-property="{P1}"]').click()
        check('delete confirmation reports dependent bookings',any('۲' in x and 'رزرو' in x for x in dialogs))
        check('cancelled delete retains property',page.evaluate('(id)=>__qa.state.tables.properties.some(x=>x.id===id)',P1))
        page.remove_listener('dialog',cancel);page.on('dialog',lambda d:d.accept())
        page.locator(f'[data-delete-property="{P2}"]').click()
        expect(page.locator(f'[data-delete-property="{P2}"]')).to_have_count(0)
        check('confirmed delete targets chosen property',page.evaluate('(id)=>!__qa.state.tables.properties.some(x=>x.id===id)',P2))
        check('deleting one preserves other properties',page.evaluate('(id)=>__qa.state.tables.properties.some(x=>x.id===id)',P1))
        c.close()
    run('listing filters status delete',listing)

    def bookings():
        c,page=open_page('admin-v2/pages/orders/new.html');page.on('dialog',lambda d:d.accept())
        page.locator('[data-booking-decision=confirmed]').click()
        expect(page.locator('[data-booking-decision=confirmed]')).to_have_count(0)
        check('admin confirmation changes booking status',page.evaluate('(id)=>__qa.state.tables.reservations.find(x=>x.id===id).status',R1)=='confirmed')
        check('confirmation never marks payment paid',page.evaluate('(id)=>__qa.state.tables.reservations.find(x=>x.id===id).payment_status',R1)=='unpaid')
        page.goto(BASE+'/admin-v2/pages/orders/history.html',wait_until='load')
        page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:async x=>{window.__copied=x;}}})")
        page.locator(f'[data-copy-booking="{R2}"]').click()
        check('full booking message copied',page.evaluate("window.__copied.includes('QA-1002')&&window.__copied.includes('شماره کارت')&&window.__copied.includes('تاریخ ورود')&&window.__copied.includes('تخفیف')"))
        share=page.locator('a[href^="https://t.me/share/url"]').first
        check('Telegram remains a prepared share link',share.get_attribute('target')=='_blank' and 'text=' in share.get_attribute('href'))
        page.locator('#admin-search').fill('QA-1002');page.locator('#booking-filter').select_option('confirmed')
        check('booking search combines status',page.locator('#admin-bookings-table tbody tr:visible').count()==1)
        page.locator(f'[data-booking-decision=rejected][data-booking-id="{R2}"]').click()
        expect(page.locator('#admin-bookings-table')).to_be_visible()
        check('confirmed booking can be rejected',page.evaluate('(id)=>__qa.state.tables.reservations.find(x=>x.id===id).status',R2)=='rejected')
        page.goto(BASE+f'/my-reservations.html?code=QA-1001&phone=09120000000',wait_until='load')
        check('tracking link pre-fills correct form',page.locator('#reservationCode').input_value()=='QA-1001' and page.locator('#guestPhone').input_value()=='09120000000')
        c.close()
    run('reservation decisions messages and tracking',bookings)

    def conflicts():
        c,page=open_page('admin-v2/pages/orders/new.html');page.on('dialog',lambda d:d.accept())
        page.evaluate('(id)=>{const r=__qa.state.tables.reservations.find(x=>x.id===id);r.check_in="2027-02-02";r.check_out="2027-02-04";__qa.persist();}',R1)
        page.reload(wait_until='load');page.locator('[data-booking-decision=confirmed]').click()
        expect(page.locator('.toast').last).to_contain_text('تداخل')
        check('overlap rejection does not confirm booking',page.evaluate('(id)=>__qa.state.tables.reservations.find(x=>x.id===id).status',R1)=='pending')
        check('failed confirmation re-enables button',page.locator('[data-booking-decision=confirmed]').is_enabled())
        page.evaluate('(id)=>{__qa.state.tables.reservations.find(x=>x.id===id).status="rejected";__qa.persist();}',R1)
        page.locator('[data-booking-decision=confirmed]').click()
        expect(page.locator('.toast').last).to_contain_text('قبلاً')
        check('stale decision does not overwrite another admin',page.evaluate('(id)=>__qa.state.tables.reservations.find(x=>x.id===id).status',R1)=='rejected')
        c.close()
    run('database conflict response',conflicts)

    def other_actions():
        c,page=open_page('admin-v2/pages/users/create.html');page.on('dialog',lambda d:d.accept())
        page.locator('[data-host-status]').select_option('approved');expect(page.locator('[data-host-status]')).to_have_value('approved')
        check('host approval updates expected field',page.evaluate('__qa.state.tables.owner_profiles[0].approval_status')=='approved')
        page.goto(BASE+'/admin-v2/pages/reviews.html',wait_until='load');page.locator('[data-review-status=approved]').click();expect(page.locator('[data-review-status=approved]')).to_have_count(0)
        check('review moderation connected',page.evaluate('__qa.state.tables.afra_reviews[0].moderation_status')=='approved')
        page.goto(BASE+'/admin-v2/pages/support.html',wait_until='load');page.locator('[name=reply]').fill('پاسخ آزمایشی');page.locator('[name=status]').select_option('closed');page.locator('.ticket-form button[type=submit]').click()
        expect(page.locator('.ticket-form [role=status]')).to_contain_text('ذخیره')
        check('support save connected',page.evaluate('__qa.state.tables.afra_support_tickets[0].status')=='closed')
        page.goto(BASE+'/admin-v2/pages/settings/backup.html',wait_until='load')
        with page.expect_download() as dl:page.locator('[data-action=export]').click()
        exported=json.loads(Path(dl.value.path()).read_text())
        check('backup includes gallery metadata','property_images' in exported['tables'])
        page.locator('[data-action=signout]').click();expect(page.locator('#admin-login')).to_be_visible()
        check('signout returns to admin login',page.locator('#admin-login').is_visible())
        c.close()
    run('host reviews support backup logout',other_actions)

    def auth_and_routes():
        for mode in ['guest','denied']:
            c,page=open_page('admin.html',mode=mode)
            check(mode+' cannot see data shell',page.locator('#admin-content').count()==0)
            check(mode+' cannot write',page.evaluate('__qa.state.events.length')==0)
            c.close()
        c,page=open_page('admin.html',mode='guest')
        page.locator('#admin-login [name=email]').fill('admin@example.test')
        page.locator('#admin-login [name=password]').fill('wrong-test-password')
        page.locator('#admin-login button[type=submit]').click()
        expect(page.locator('#login-message')).to_contain_text('ورود انجام نشد')
        check('invalid login stays outside data shell',page.locator('#admin-content').count()==0)
        page.locator('#admin-login [name=password]').fill('test-only-password')
        page.locator('#admin-login button[type=submit]').click()
        expect(page.locator('#admin-content')).to_be_visible()
        check('admin login reaches current dashboard',page.locator('.page-title h1').inner_text()=='داشبورد افراسفر')
        c.close()
        c,page=open_page('admin-v2/pages/products/categories.html',prefix='/installed',width=320)
        check('four category creation actions',page.locator('a[href*="products/create.html?category="]').count()==4)
        check('public category links use correct query',page.locator('a[href*="search.html?type="]').count()==4)
        page.locator('a[href*="products/create.html?category=forest"]').click();expect(page.locator('[name=category]')).to_have_value('forest')
        check('subdirectory installation keeps editor path','/installed/admin-v2/pages/products/create.html' in page.url)
        check('mobile editor stays inside viewport',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
        page.screenshot(path='/tmp/afra-admin-full-editor-320.png',full_page=True)
        c.close()
    run('authorization category links and subdirectory install',auth_and_routes)
    browser.close()
server.shutdown()
report={'checks':len(results),'failures':failures,'pageErrors':page_errors,'results':results,'backend':'synthetic in-memory only','productionWrites':0}
(ROOT/'qa/admin-full-functional.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'checks':len(results),'failures':failures,'pageErrors':page_errors},ensure_ascii=False,indent=2))
