"""Read-only visual regression checks. All backend calls use synthetic local data.
Run with Python + Playwright and AFRA_BROWSER pointing to a Chromium executable.
"""
import functools
import http.server
import json
import os
from pathlib import Path
import sys
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SMOKE = '--smoke' in sys.argv
REPORT = ROOT / 'qa' / ('video-theme-smoke.json' if SMOKE else 'video-theme-pages.json')

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass
    def handle(self):
        try:
            super().handle()
        except (BrokenPipeError, ConnectionResetError):
            pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=ROOT))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{server.server_port}'

MOCK = r"""(mode) => {
 const id='11111111-1111-4111-8111-111111111111';
 const uid='22222222-2222-4222-8222-222222222222';
 const me={id:uid,email:'synthetic.long.email.for.sidebar.layout.check@example.test',phone:'09120000000'};
 const prop={id,title:'کلبهٔ جنگلی آزمایشی',name:'کلبهٔ جنگلی آزمایشی',location:'رامسر',city:'رامسر',province:'مازندران',region:'جنگل',type:'cottage',property_type:'cottage',category:'کلبه',price:2200000,price_per_night:2200000,base_price:2200000,capacity:5,max_guests:5,guest_capacity:5,bedrooms:2,beds:3,bathrooms:1,description:'توضیحات ساختگی برای بررسی خوانایی و چیدمان اقامتگاه.',images:['/images/afra-hero-forest-villa.webp'],image_url:'/images/afra-hero-forest-villa.webp',cover_image:'/images/afra-hero-forest-villa.webp',is_active:true,featured:true,owner_id:uid,host_id:uid,lat:36.923,lng:50.644,latitude:36.923,longitude:50.644,amenities:['parking','wifi'],created_at:'2026-11-19T10:00:00Z'};
 const res={id:'33333333-3333-4333-8333-333333333333',property_id:id,owner_id:uid,guest_user_id:uid,user_id:uid,status:'pending',payment_status:'unpaid',payment_amount:4400000,total_price:4400000,guest_name:'مسافر آزمایشی',guest_phone:'09120000000',guest_count:3,reservation_code:'QA-1001',check_in:'2026-12-10',check_out:'2026-12-12',created_at:'2026-11-19T10:00:00Z'};
 const data={properties:[prop,{...prop,id:'44444444-4444-4444-8444-444444444444',title:'ویلای آزمایشی',type:'villa',property_type:'villa',price:3500000}],reservations:[res,{...res,id:'55555555-5555-4555-8555-555555555555',reservation_code:'QA-1002',status:'confirmed',payment_status:'paid'}],owner_profiles:[{id:uid,user_id:uid,full_name:'میزبان آزمایشی',phone:'09120000000',status:'approved',is_approved:true,created_at:res.created_at}],afra_profiles:[{id:uid,user_id:uid,full_name:'کاربر آزمایشی',email:me.email,phone:me.phone,created_at:res.created_at}],afra_support_tickets:[{id:'ticket-test',user_id:uid,subject:'درخواست آزمایشی',category:'رزرو',message:'متن ساختگی برای بررسی خوانایی تیکت.',status:'open',admin_reply:'',created_at:res.created_at}],afra_reviews:[{id:'review-test',property_id:id,guest_user_id:uid,user_id:uid,score:4,body:'نظر ساختگی برای بررسی ظاهر صفحه.',moderation_status:'pending',created_at:res.created_at}],afra_wallet_transactions:[{id:'ledger-test',user_id:uid,amount:125000,type:'credit',description:'رکورد آزمایشی',created_at:res.created_at}]};
 window.__qaWrites=[];window.__qaReads=[];
 const chain=(table)=>{let single=false;let filters=[];const q=new Proxy({}, {get(_,key){
  if(key==='then'){let rows=[...(data[table]||[])];for(const [k,v] of filters){if(rows.some(x=>k in x))rows=rows.filter(x=>x[k]===v);}window.__qaReads.push(table);return (resolve,reject)=>Promise.resolve({data:single?(rows[0]||null):rows,count:rows.length,error:null}).then(resolve,reject);}
  if(['insert','update','delete','upsert'].includes(key))return ()=>{window.__qaWrites.push(table+':'+key);throw Error('QA forbids data writes');};
  if(key==='single'||key==='maybeSingle')return ()=>{single=true;return q;};
  if(key==='eq')return(k,v)=>{filters.push([k,v]);return q;};
  return ()=>q;
 }});return q;};
 const auth={getUser:async()=>({data:{user:mode==='guest'?null:me},error:null}),getSession:async()=>({data:{session:mode==='guest'?null:{user:me}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({error:null})};
 const db={from:chain,auth,rpc:async(name)=>{if(name==='is_admin')return {data:mode!=='denied',error:null};return {data:[],error:null};},storage:{from:()=>({getPublicUrl:x=>({data:{publicUrl:x}})})},channel:()=>({on(){return this;},subscribe(){return this;},unsubscribe(){}})};
 window.afraSupabase=db;window.supabase={createClient:()=>db};
 window.AFRA_CONTACT_PHONE='09120000000';
 try{localStorage.setItem('afra-coupon-seen','1');sessionStorage.setItem('afra-coupon-session','1');}catch(_){}
}"""

AUDIT = r"""() => {
 const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>.1&&!el.closest('[hidden],[inert]');};
 const rgb=x=>{const m=x.match(/[\d.]+/g);return m?m.slice(0,3).map(Number):[0,0,0];};
 const alpha=x=>{const m=x.match(/[\d.]+/g);return m&&m.length>3?Number(m[3]):1;};
 const lumin=x=>x.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>{const x=lumin(a),y=lumin(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 const bg=el=>{const layers=[];let photos=false;for(let e=el;e;e=e.parentElement){const s=getComputedStyle(e);if(s.backgroundImage.includes('url(')||e.matches('.hero,.afra-region-card,.afra-feature-media,.ap-stay__photo'))photos=true;let c=s.backgroundColor;if(s.backgroundImage.includes('gradient(')){const m=s.backgroundImage.match(/rgba?\([^)]+\)/g);if(m?.length)c=m[m.length-1];}layers.push(c);}let out=[15,15,35];for(const c of layers.reverse()){const a=alpha(c),v=rgb(c);out=out.map((x,i)=>v[i]*a+x*(1-a));}return {color:out,photos};};
 const problems=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;let count=0;
 while(node=walker.nextNode()){const txt=node.textContent.trim(),el=node.parentElement;if(!txt||!el||!visible(el)||el.closest('script,style,svg,noscript,template,pre,code,.afra-poetry-spot,.maplibregl-map'))continue;const s=getComputedStyle(el);if(Number(s.fontSize)<8)continue;const back=bg(el);if(back.photos)continue;const fg=rgb(s.color),a=alpha(s.color);const blended=fg.map((v,i)=>v*a+back.color[i]*(1-a));const contrast=ratio(blended,back.color);const large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700);const min=large?3:4.5;count++;if(contrast<min-.02)problems.push({text:txt.slice(0,95),tag:el.tagName,cls:el.className,color:s.color,bg:back.color,contrast:+contrast.toFixed(2),min});}
 const h=[...document.querySelectorAll('h1,h2,h3,h4')].filter(visible).slice(0,5).map(x=>({text:x.textContent.trim().slice(0,70),color:getComputedStyle(x).color}));
 const logos=[...document.querySelectorAll('img.afra-brand-img,img.afra-leaf-img,img.afra-admin-leaf')].filter(visible);
 const oldColors=['5, 31, 32','11, 43, 38','22, 56, 50','35, 83, 71','218, 241, 222','247, 248, 245'];
 const greenSurfaces=[...document.body.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();if(!visible(e)||r.width<100||r.height<40||e.matches('img,svg,svg *')||e.closest('.maplibregl-map')||e.querySelector(':scope > img'))return false;const s=getComputedStyle(e);return oldColors.some(x=>s.backgroundColor.includes(x)||s.backgroundImage.includes(x));}).slice(0,20).map(e=>({tag:e.tagName,cls:e.className,id:e.id,bg:getComputedStyle(e).backgroundColor,image:getComputedStyle(e).backgroundImage}));
 return {theme:document.documentElement.dataset.afraTheme,font:getComputedStyle(document.body).fontFamily,overflow:document.documentElement.scrollWidth>innerWidth+2,scrollWidth:document.documentElement.scrollWidth,headings:h,contrast:problems,textChecks:count,logoCount:logos.length,brokenLogos:logos.filter(x=>!x.complete||!x.naturalWidth).length,writes:window.__qaWrites||[],rootBg:getComputedStyle(document.body).backgroundColor,greenSurfaces};
}"""

def route_handler(route):
    url=route.request.url
    if url.startswith(BASE):
        if url.split('?')[0].endswith('/supabase.js'):
            route.fulfill(status=200,body='',content_type='application/javascript')
        else:
            route.continue_()
    else:
        route.fulfill(status=200,body='',content_type='text/css' if '.css' in url else 'application/javascript')

names=sorted(str(p.relative_to(ROOT)) for p in ROOT.rglob('*.html'))
if SMOKE:
    names=['index.html','auth.html','search.html','owner-dashboard.html','admin-payments.html','admin-v2/index.html','admin-v2/pages/support.html','admin-v2/pages/products/create.html']
results=[];errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('AFRA_BROWSER'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--disable-client-side-phishing-detection','--enable-unsafe-swiftshader'])
    context=browser.new_context(viewport={'width':390,'height':850},reduced_motion='reduce')
    context.route('**/*',route_handler)
    context.add_init_script('('+MOCK+")('admin');")
    page=context.new_page()
    page.on('pageerror',lambda e:errors.append({'url':page.url.replace(BASE,''),'error':str(e)[:200]}))
    for name in names:
        for width in [390,1440]:
            for theme in ['dark','light']:
                page.set_viewport_size({'width':width,'height':850})
                page.goto(BASE+'/index.html',wait_until='domcontentloaded') if page.url=='about:blank' else None
                page.evaluate('(x)=>localStorage.setItem("afra-theme-preference",x)',theme)
                try:
                    suffix='?id=11111111-1111-4111-8111-111111111111' if name in ['property.html','booking.html','villa.html','cottage.html','luxury-villa.html','manage-property.html','property-settings.html'] else ''
                    page.goto(BASE+'/'+name+suffix,wait_until='load',timeout=15000)
                    page.wait_for_timeout(150)
                    page.evaluate('document.fonts.ready')
                    audit=page.evaluate(AUDIT)
                    results.append({'page':name,'width':width,'expectedTheme':theme,**audit})
                    if name in ['index.html','admin-v2/index.html','search.html'] and theme=='dark':
                        page.screenshot(path=f'/tmp/afra-video-{name.replace("/","-")}-{width}.png',full_page=False)
                except Exception as e:
                    results.append({'page':name,'width':width,'expectedTheme':theme,'error':str(e)[:200]})
        print(name,flush=True)
    browser.close()
server.shutdown()
summary={'cases':len(results),'overflow':[x for x in results if x.get('overflow')], 'brokenLogos':[x for x in results if x.get('brokenLogos')], 'loadErrors':[x for x in results if 'error' in x], 'pageErrors':errors,'contrastFailures':sum(len(x.get('contrast',[])) for x in results),'writes':sum(len(x.get('writes',[])) for x in results)}
REPORT.write_text(json.dumps({'summary':summary,'results':results},ensure_ascii=False,indent=2))
print(json.dumps(summary,ensure_ascii=False,indent=2))
