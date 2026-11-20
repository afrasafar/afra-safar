"""Verify real admin navigation targets, bound controls and local dependencies."""
from pathlib import Path
import functools,http.server,threading,json,os,subprocess
from urllib.parse import urlsplit,unquote
from html.parser import HTMLParser
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
errors=[];results=[]
class Dependencies(HTMLParser):
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        for key in ['href','src']:
            u=a.get(key,'')
            if not u or u.startswith(('#','http:','https:','mailto:','tel:','data:','blob:','javascript:')) or '${' in u:continue
            name=unquote(urlsplit(u).path)
            if name and not (ROOT/name.lstrip('/') if name.startswith('/') else self.file.parent/name).exists():errors.append({'page':str(self.file.relative_to(ROOT)),'missing':u})
for file in ROOT.rglob('*.html'):
    p=Dependencies();p.file=file;p.feed(file.read_text())
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
    def handle(self):
        try:super().handle()
        except (BrokenPipeError,ConnectionResetError):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=ROOT));threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}'
mock=(ROOT/'qa/admin-full-mock.js').read_text();png=(ROOT/'images/afra-safar-logo.png').read_bytes()
def route(r):
    if r.request.url.startswith(BASE):
        if urlsplit(r.request.url).path.endswith('/supabase.js'):r.fulfill(body='',content_type='application/javascript')
        else:r.continue_()
    elif r.request.resource_type=='image':r.fulfill(body=png,content_type='image/png')
    else:r.fulfill(body='',content_type='application/javascript')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('AFRA_BROWSER'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--enable-unsafe-swiftshader'])
    context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce');context.route('**/*',route)
    context.add_init_script('('+mock+")('admin');"+r'''
      window.__bindings=new WeakMap();
      const original=EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener=function(type,listener,options){
        if(this instanceof Element){const events=window.__bindings.get(this)||[];events.push(type);window.__bindings.set(this,events);}
        return original.call(this,type,listener,options);
      };
    ''')
    page=context.new_page();links=set();button_count=0
    for f in sorted((ROOT/'admin-v2').rglob('*.html')):
        name=str(f.relative_to(ROOT));page.goto(BASE+'/'+name,wait_until='load');page.wait_for_timeout(80)
        inventory=page.evaluate(r'''()=>({
          links:[...document.querySelectorAll('body[data-page] a[href]')].filter(e=>!e.hidden).map(e=>({href:e.href,text:e.textContent.trim()})),
          buttons:[...document.querySelectorAll('body[data-page] button')].map(e=>({text:e.textContent.trim()||e.getAttribute('aria-label'),bound:(window.__bindings.get(e)||[]).includes('click')||['refresh','signout','export'].includes(e.dataset.action)||(e.type==='submit'&&e.form&&(window.__bindings.get(e.form)||[]).includes('submit'))}))
        })''')
        unbound=[x for x in inventory['buttons'] if not x['bound']]
        if unbound:errors.append({'page':name,'unboundButtons':unbound})
        for x in inventory['links']:
            if x['href'].startswith(BASE):
                path=unquote(urlsplit(x['href']).path).lstrip('/')
                if not (ROOT/path).is_file():errors.append({'page':name,'badDestination':x})
                else:links.add(x['href'].replace(BASE,''))
            elif not x['href'].startswith(('https://t.me/share/url','mailto:','tel:')):errors.append({'page':name,'unexpectedExternalLink':x})
        button_count+=len(inventory['buttons']);results.append({'page':name,'links':len(inventory['links']),'buttons':len(inventory['buttons']),'unbound':unbound})
    for path in sorted(links):
        response=context.request.get(BASE+path)
        if response.status!=200:errors.append({'destination':path,'status':response.status})
    browser.close()
server.shutdown()
javascript=[]
for f in ROOT.rglob('*.js'):
    if f.name=='tailwindcss.js':continue
    result=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
    if result.returncode:errors.append({'javascript':str(f.relative_to(ROOT)),'error':result.stderr[:180]})
    javascript.append(str(f.relative_to(ROOT)))
report={'pages':len(results),'buttonsBound':button_count,'uniqueDestinations':len(links),'javascriptChecked':len(javascript),'errors':errors,'results':results,'destinations':sorted(links)}
(ROOT/'qa/admin-full-links.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k not in ['results','destinations']},ensure_ascii=False,indent=2))
