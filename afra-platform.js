/* Afra Safar — platform additions (RTL, accessible, classic dark-mode).
   Existing public booking/auth flows are not replaced. No client-side payment verification. */
(() => {
'use strict';
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const html = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = value => (Number(value)||0).toLocaleString('fa-IR');
const money = v => Number(v)>0?fmt(v)+' تومان':'قیمت اعلام نشده';
const q = (name)=>new URLSearchParams(location.search).get(name)||'';
const db = () => typeof window.afraSupabase!=='undefined' && window.afraSupabase && typeof window.afraSupabase.from==='function' ? window.afraSupabase : null;
const newDate = () => {const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const jDate = value => window.AfraJalali?.formatISO(value) || value || '—';
const safeImg = value => {const s=String(value||'').trim();return (/^https?:\/\/[^\s]+$/i.test(s)||/^images\/[\w.\-/]+$/i.test(s)||/^assets\/[\w.\-/]+$/i.test(s)) ? html(s): 'assets/placeholder.svg';};
const urlProperty = p => `property.html?id=${encodeURIComponent(p.id)}`;
const currentFile = location.pathname.split('/').pop()||'index.html';
const root = $('#ap-root');
const moduleId = root?.getAttribute('data-module')||'';
const toastRoot = document.createElement('div');toastRoot.className='ap-toast';toastRoot.hidden=true;toastRoot.setAttribute('role','status');
function toast(message,error=false){toastRoot.textContent=message;toastRoot.classList.toggle('error',error);toastRoot.hidden=false;clearTimeout(toast._timer);toast._timer=setTimeout(()=>toastRoot.hidden=true,5500);}
function banner(text,kind='notice'){return `<div class="${kind==='error'?'ap-error':kind==='success'?'ap-success':'ap-callout'}">${html(text)}</div>`;}
const menu=[['index.html','خانه'],['search.html','جست‌وجوی پیشرفته'],['categories.html','دسته‌بندی‌ها'],['map.html','نقشه'],['guest-dashboard.html','حساب مسافر'],['become-host.html','میزبان شوید'],['support.html','پشتیبانی']];
function nav(){
 // The homepage has its own fully interactive header. Do not overlay a second
 // travel bar over its links and hamburger button (previous mobile click bug).
 if(currentFile==='index.html')return;
 if($('.ap-travelbar'))return;
 const bar=document.createElement('nav');bar.className='ap-travelbar';bar.setAttribute('aria-label','دسترسی سریع افرا سفر');
 bar.innerHTML=`<a class="ap-travelbar__logo" href="index.html">🌿 افرا سفر</a>${menu.slice(1).map(([href,title])=>`<a href="${href}" ${currentFile===href?'aria-current="page"':''}>${title}</a>`).join('')}`;
 const b=document.body;b.insertBefore(bar,b.firstChild);
}
function foot(){return `<footer class="ap-footer ap-container"><a href="index.html">صفحه اصلی</a><a href="about.html">درباره ما</a><a href="contact.html">تماس</a><a href="rules.html">قوانین</a><a href="privacy.html">حریم خصوصی</a><a href="faq.html">سؤالات متداول</a><p>© افرا سفر · اعتبار قیمت، موجودی و رزرو تنها پس از تأیید سامانه و میزبان مشخص می‌شود.</p></footer>`;}
function shell(title,lead,inner,eyebrow='افرا سفر'){
 root.classList.add('ap-page');root.innerHTML=`<div class="ap-container"><header class="ap-intro"><div><span class="ap-eyebrow">${html(eyebrow)}</span><h1>${html(title)}</h1><p>${html(lead)}</p></div><a href="index.html" class="ap-btn secondary">بازگشت به خانه</a></header>${inner}</div>${foot()}`;
}
function loading(){return `<div class="ap-empty ap-loader">در حال دریافت اطلاعات از سایت…</div>`;}
function missingDb(){return banner('اتصال پایگاه داده در دسترس نیست. فایل supabase.js این بسته باید در کنار صفحات باشد. اتصال اینترنت و تنظیمات پروژه را بررسی کنید.','error');}
async function user(){if(!db())return null;try{const {data,error}=await db().auth.getUser();if(error)throw error;return data?.user||null}catch(e){console.warn('Afra auth:',e);return null}}
function loginNeeded(){return banner('برای دسترسی به این قسمت ابتدا با حساب خود وارد شوید.')+'<p style="margin-top:13px"><a class="ap-btn" href="auth.html?next='+encodeURIComponent(currentFile+location.search)+'">ورود / ثبت‌نام</a></p>';}
function linkList(items){return `<div class="ap-cards">${items.map(([href,title,desc])=>`<a class="ap-linkcard" href="${href}"><strong>${html(title)}</strong><span>${html(desc)}</span></a>`).join('')}</div>`;}
function field(label,id,type='text',value='',extras=''){return `<label class="ap-field">${html(label)}<input id="${id}" name="${id}" type="${type}" value="${html(value)}" ${extras}></label>`;}
function section(title,content){return `<section class="ap-panel ap-section"><h2>${html(title)}</h2>${content}</section>`;}
async function optionalTable(table,fields='*') {if(!db())return null;try{let {data,error}=await db().from(table).select(fields);if(error){console.info(table,'not available:',error.message);return null}return data||[]}catch(e){console.warn(table,e);return null}}
let propertiesCache=null;
async function properties(){
 if(propertiesCache)return propertiesCache;
 if(!db())throw new Error('فایل supabase.js یافت نشد.');
 const {data,error}=await db().from('properties').select('id,title,location,category,capacity,price,description,image_url,is_active,created_at,owner_id').eq('is_active',true).order('created_at',{ascending:false});
 if(error)throw error;
 const list=(data||[]).map(p=>({...p,spec:{},averageRating:0,ratingCount:0}));
 const ids=new Map(list.map((p,i)=>[String(p.id),i]));
 const [specs,reviews]=await Promise.all([optionalTable('afra_property_specs'),optionalTable('afra_reviews','property_id,score,moderation_status')]);
 for(const s of specs||[]){const idx=ids.get(String(s.property_id));if(idx!==undefined)list[idx].spec=s;}
 const sums=new Map();for(const r of reviews||[]){if(r.moderation_status!=='approved')continue;const key=String(r.property_id);const a=sums.get(key)||{total:0,count:0};a.total+=Number(r.score)||0;a.count++;sums.set(key,a);}
 for(const p of list){const s=sums.get(String(p.id));if(s){p.averageRating=s.total/s.count;p.ratingCount=s.count;}}
 propertiesCache=list;return list;
}
const TYPES=[['villa','ویلا'],['pool','استخردار'],['forest','کلبه جنگلی'],['luxury','لوکس'],['apartment','آپارتمان'],['ecolodge','بوم‌گردی']];
const EXTRAS=[['pool','استخر'],['heated_pool','استخر آب گرم'],['outdoor_pool','استخر روباز'],['jacuzzi','جکوزی'],['coastal','ساحلی'],['forest','جنگلی'],['mountain','کوهستانی'],['luxury','لوکس'],['wooden_cottage','کلبه چوبی'],['economic','اقتصادی'],['pets_allowed','ورود حیوان خانگی'],['parking','پارکینگ'],['internet','اینترنت'],['cooling','سرمایش'],['heating','گرمایش'],['instant_booking','رزرو فوری'],['discounted','تخفیف‌دار'],['high_rating','امتیاز بالا']];
const specTruth=(p,key)=>{
 const s=p.spec||{};
 switch(key){
 case 'pool':return !!s.pool||p.category==='pool';case 'heated_pool':return !!s.heated_pool;
 case 'outdoor_pool':return !!s.outdoor_pool;case 'jacuzzi':return !!s.jacuzzi;
 case 'coastal':return !!s.coastal||(s.terrain||'')==='coastal';case 'forest':return !!s.forest||p.category==='forest';
 case 'mountain':return !!s.mountain;case 'luxury':return !!s.luxury||p.category==='luxury';
 case 'wooden_cottage':return !!s.wooden_cottage;case 'economic':return !!s.economic;
 case 'pets_allowed':return !!s.pets_allowed;case 'parking':return !!s.parking;
 case 'internet':return !!s.internet;case 'cooling':return !!s.cooling;
 case 'heating':return !!s.heating;case 'instant_booking':return !!s.instant_booking;
 case 'discounted':return (Number(s.discount_percent)||0)>0;
 case 'high_rating':return p.ratingCount>0&&p.averageRating>=4;
 default:return false;}
};
const labelType=cat=>TYPES.find(([a])=>cat===a)?.[1]||'اقامتگاه';
function stayCard(p){const s=p.spec||{},discount=Number(s.discount_percent)||0;const id=html(p.id);
 return `<article class="ap-stay"><a class="ap-stay__photo" href="${urlProperty(p)}"><img alt="${html(p.title)}" loading="lazy" src="${safeImg(p.image_url)}"><span class="ap-stay__badge">${discount>0?'٪'+fmt(discount)+' تخفیف':html(labelType(p.category))}</span></a><div class="ap-stay__body"><div class="ap-stay__meta">⌖ ${html(p.location||[s.city,s.province].filter(Boolean).join('، ')||'شهر ثبت نشده')}</div><h3><a href="${urlProperty(p)}">${html(p.title)}</a></h3><div class="ap-stay__meta">👤 ${fmt(p.capacity)} نفر ${s.bedrooms?' · 🛏️ '+fmt(s.bedrooms)+' اتاق':''} ${p.ratingCount?' · ⭐ '+html(p.averageRating.toFixed(1)):' · بدون امتیاز ثبت‌شده'}</div><div class="ap-stay__actions"><div><div class="ap-stay__price">${money(p.price)}</div><small class="ap-muted">هر شب</small></div><div class="ap-inline-actions"><button type="button" class="ap-stay__fav" aria-label="افزودن به علاقه‌مندی‌ها" aria-pressed="false" data-fav="${id}">♡</button><a href="${urlProperty(p)}" class="ap-btn small">جزئیات</a></div></div></div></article>`;
}
function safeLocalFavorites(){try{return JSON.parse(localStorage.getItem('afra-platform-favorites')||'[]')}catch{return []}}
function localFavSet(ids){try{localStorage.setItem('afra-platform-favorites',JSON.stringify(ids))}catch(_){}}
async function toggleFavorite(id,btn){const me=await user();if(me&&db()){
 let {data}=await db().from('afra_favorites').select('property_id').eq('user_id',me.id).eq('property_id',id);
 if(data?.length){const {error}=await db().from('afra_favorites').delete().eq('user_id',me.id).eq('property_id',id);if(error){toast('ذخیره علاقه‌مندی ممکن نشد؛ migration را اجرا کنید.',true);return}btn?.setAttribute('aria-pressed','false');toast('از علاقه‌مندی‌ها حذف شد');}
 else{const {error}=await db().from('afra_favorites').insert({user_id:me.id,property_id:id});if(error){toast('ذخیره علاقه‌مندی ممکن نشد؛ migration را اجرا کنید.',true);return}btn?.setAttribute('aria-pressed','true');toast('به علاقه‌مندی‌ها افزوده شد');}
 }else{const f=new Set(safeLocalFavorites());const active=!f.has(id);if(active)f.add(id);else f.delete(id);localFavSet([...f]);btn?.setAttribute('aria-pressed',String(active));toast(active?'به علاقه‌مندی‌های این مرورگر افزوده شد':'از علاقه‌مندی‌ها حذف شد');}}
function bindFavorite(rootEl=document){rootEl.addEventListener('click',e=>{const btn=e.target.closest('[data-fav]');if(btn){e.preventDefault();toggleFavorite(btn.dataset.fav,btn);}});$$('[data-fav]',rootEl).forEach(btn=>{btn.setAttribute('aria-pressed',String(safeLocalFavorites().includes(btn.dataset.fav)))});}
function filtersHTML(){return `<form id="ap-filters" class="ap-panel ap-stack" aria-label="فیلترهای جست‌وجو"><div class="ap-row"><h2 style="margin:0">فیلترها</h2><button type="reset" class="ap-btn small secondary">پاک‌کردن</button></div><div class="ap-form-grid">${field('استان','f-province','text',q('province'),'placeholder="مثلاً مازندران"')}${field('شهر','f-city','text',q('city')||q('destination'),'placeholder="مثلاً رامسر"')}${field('منطقه / روستا','f-area','text',q('area'),'placeholder="نام منطقه"')}${field('نام اقامتگاه','f-title','search',q('name'),'placeholder="جست‌وجوی عنوان"')}${field('حداقل قیمت (تومان)','f-min','number',q('min'),'min="0" step="100000"')}${field('حداکثر قیمت (تومان)','f-max','number',q('max'),'min="0" step="100000"')}${field('تعداد مسافر','f-guests','number',q('guests'),'min="1" max="50"')}${field('حداقل اتاق خواب','f-bedrooms','number',q('bedrooms'),'min="0" max="50"')}${field('حداقل تخت','f-beds','number',q('beds'),'min="0" max="50"')}${field('تاریخ ورود','f-in','date',q('checkin'))}${field('تاریخ خروج','f-out','date',q('checkout'))}</div><label class="ap-field">نوع اقامتگاه<select id="f-type"><option value="">همه انواع</option>${TYPES.map(([v,t])=>`<option value="${v}" ${q('type')===v?'selected':''}>${t}</option>`).join('')}</select></label><div class="ap-filter-section"><h3>امکانات و ویژگی‌ها</h3><div class="ap-check-list">${EXTRAS.map(([v,t])=>`<label class="ap-check"><input data-feature="${v}" type="checkbox" ${q(v)==='1'?'checked':''}>${t}</label>`).join('')}</div></div><div class="ap-callout">نتایج با تغییر هر فیلتر به‌روز می‌شوند. موجود بودن تاریخ پس از بررسی تقویم رزرو قطعی می‌شود.</div></form>`;}
function matches(p,state){const s=p.spec||{},norm=x=>String(x||'').trim().toLocaleLowerCase('fa');
 if(state.province&&!norm(s.province||p.location).includes(norm(state.province))&&!norm(p.location).includes(norm(state.province)))return false;
 if(state.city&&!norm(s.city||p.location).includes(norm(state.city))&&!norm(p.location).includes(norm(state.city)))return false;
 if(state.area&&!norm(s.area||p.location).includes(norm(state.area))&&!norm(p.location).includes(norm(state.area)))return false;
 if(state.title&&!norm(p.title).includes(norm(state.title)))return false;
 if(state.type&&p.category!==state.type)return false;
 if(Number(state.min)>0&&Number(p.price)<Number(state.min))return false;
 if(Number(state.max)>0&&Number(p.price)>Number(state.max))return false;
 if(Number(state.guests)>0&&Number(p.capacity)<Number(state.guests))return false;
 if(Number(state.bedrooms)>0&&Number(s.bedrooms||0)<Number(state.bedrooms))return false;
 if(Number(state.beds)>0&&Number(s.beds||0)<Number(state.beds))return false;
 return state.features.every(f=>specTruth(p,f));
}
function readFilters(){const v=id=>$('#'+id)?.value||'';return {province:v('f-province'),city:v('f-city'),area:v('f-area'),title:v('f-title'),min:v('f-min'),max:v('f-max'),guests:v('f-guests'),bedrooms:v('f-bedrooms'),beds:v('f-beds'),type:v('f-type'),checkin:v('f-in'),checkout:v('f-out'),features:$$('[data-feature]:checked').map(e=>e.dataset.feature),sort:v('ap-sort')};}
function sortList(list,sort){return [...list].sort((a,b)=>{const as=a.spec||{},bs=b.spec||{};switch(sort){case 'cheap':return Number(a.price)-Number(b.price);case 'expensive':return Number(b.price)-Number(a.price);case 'popular':return Number(bs.view_count||0)-Number(as.view_count||0);case 'rating':return b.averageRating-a.averageRating;case 'discount':return Number(bs.discount_percent||0)-Number(as.discount_percent||0);default:return String(b.created_at||'').localeCompare(String(a.created_at||''));}})}
function syncQuery(s){const u=new URL(location.href);for(const key of [...u.searchParams.keys()])u.searchParams.delete(key);
 const vals={province:s.province,city:s.city,area:s.area,name:s.title,min:s.min,max:s.max,guests:s.guests,bedrooms:s.bedrooms,beds:s.beds,type:s.type,checkin:s.checkin,checkout:s.checkout};
 Object.entries(vals).forEach(([k,v])=>{if(v)u.searchParams.set(k,v)});s.features.forEach(f=>u.searchParams.set(f,'1'));try{history.replaceState(null,'',u.pathname+u.search)}catch(_){/* about:blank/embedded previews */}}
// Public map: exact points are used only when the host saved approximate public coordinates.
// When there is no point, a clearly labelled *city centre* is used (not a property address).
// The map itself must remain usable even if the database or location data is unavailable.
const CITY_CENTRES = [
 ['بندر انزلی',37.473,49.463],['انزلی',37.473,49.463],['لاهیجان',37.207,50.003],['رشت',37.281,49.583],
 ['رودسر',37.137,50.287],['لنگرود',37.191,50.154],['فومن',37.224,49.311],['ماسوله',37.156,48.988],
 ['آستارا',38.429,48.872],['تالش',37.802,48.903],['سیاهکل',37.154,49.871],['آملش',37.096,50.189],
 ['چابکسر',36.975,50.575],['کلاچای',37.078,50.392],['رامسر',36.917,50.644],['تنکابن',36.815,50.874],
 ['شهسوار',36.815,50.874],['نوشهر',36.648,51.496],['چالوس',36.655,51.420],['کلاردشت',36.493,51.141],
 ['نمک آبرود',36.662,51.347],['نمک‌آبرود',36.662,51.347],['متل قو',36.704,51.194],
 ['سلمانشهر',36.704,51.194],['سلمان شهر',36.704,51.194],['عباس آباد',36.726,51.111],
 ['عباس‌آباد',36.726,51.111],['محمودآباد',36.632,52.257],['بابلسر',36.703,52.657],
 ['بابل',36.544,52.678],['آمل',36.469,52.352],['ساری',36.563,53.060],['نور',36.571,52.017],
 ['قائمشهر',36.465,52.867],['قائم شهر',36.465,52.867],['سوادکوه',36.08,53.06],
 ['گرگان',36.846,54.433],['بندر ترکمن',36.900,54.066],['تهران',35.689,51.389],
 ['جواهرده',36.856,50.486],['کتالم',36.886,50.711],['گیسوم',37.663,49.023],
 ['چمستان',36.482,52.120],['رویان',36.572,51.961],['ایزدشهر',36.602,52.159],['سرخرود',36.653,52.451],
 ['نشتارود',36.749,51.044],['سادات شهر',36.886,50.699],['سادات‌شهر',36.886,50.699],
 ['چوبر',37.091,49.126],['زیباکنار',37.417,49.792],['رضوانشهر',37.552,49.139]
].sort((a,b)=>b[0].length-a[0].length);
function normalizeMapText(value){return String(value||'').toLocaleLowerCase('fa').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200f\u00a0_\-]/g,' ').replace(/\s+/g,' ').trim();}
function locateForMap(p){
 const s=p.spec||{},lat=Number(s.lat),lng=Number(s.lng);
 if(s.lat!=null&&s.lng!=null&&s.lat!==''&&s.lng!==''&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=24&&lat<=40&&lng>=44&&lng<=64){return {lat,lng,approx:false,key:'property-'+p.id};}
 // A city centre is not a claim about the property's exact position.
 const place=normalizeMapText([s.city,s.area,p.location,s.province].filter(Boolean).join('، '));
 const searchable=' '+place.replace(/[،,؛\/|()]/g,' ').replace(/\s+/g,' ').trim()+' ';
 const found=CITY_CENTRES.find(([city])=>searchable.includes(' '+normalizeMapText(city)+' '));
 return found?{lat:found[1],lng:found[2],approx:true,key:'city-'+normalizeMapText(found[0]),city:found[0]}:null;
}
let activeMap=null, mapSequence=0, leafletLoader=null;
function loadLeaflet(){
 if(window.L?.map)return Promise.resolve(window.L);
 if(leafletLoader)return leafletLoader;
 leafletLoader=new Promise((resolve,reject)=>{
  const bases=['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/','https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/'];
  let index=0;
  function attempt(){
   if(index>=bases.length){reject(new Error('کتابخانه نقشه بارگذاری نشد'));return;}
   const base=bases[index++],css=document.createElement('link');css.rel='stylesheet';css.href=base+'leaflet.css';css.dataset.afraLeaflet='1';document.head.appendChild(css);
   const script=document.createElement('script');script.src=base+'leaflet.js';script.async=true;script.dataset.afraLeaflet='1';
   let done=false;const timer=setTimeout(()=>finish(false),6500);
   function finish(ok){if(done)return;done=true;clearTimeout(timer);if(ok&&window.L?.map)resolve(window.L);else attempt();}
   script.onload=()=>finish(true);script.onerror=()=>finish(false);
   document.head.appendChild(script);
  }
  attempt();
 }).catch(e=>{leafletLoader=null;throw e;});
 return leafletLoader;
}
function hideMap(){mapSequence++;if(activeMap){activeMap.remove();activeMap=null;}const el=$('#ap-map');if(el){el.hidden=true;el.replaceChildren();}}
function mapFallback(el,centre){
 const [lat,lng]=centre;
 const dlat=.55,dlng=.9;
 const bbox=[lng-dlng,lat-dlat,lng+dlng,lat+dlat].map(x=>x.toFixed(4)).join('%2C');
 const iframe=document.createElement('iframe');iframe.className='ap-map ap-map-frame';iframe.title='نقشه عمومی OpenStreetMap';iframe.loading='lazy';iframe.referrerPolicy='no-referrer';
 iframe.src='https://www.openstreetmap.org/export/embed.html?bbox='+bbox+'&layer=mapnik';
 const link=document.createElement('a');link.className='ap-btn secondary ap-map-external';link.href='https://www.openstreetmap.org/?mlat='+lat.toFixed(4)+'&mlon='+lng.toFixed(4)+'#map=10/'+lat.toFixed(4)+'/'+lng.toFixed(4);link.target='_blank';link.rel='noopener noreferrer';link.textContent='بازکردن نقشه عمومی در OpenStreetMap';
 el.append(iframe,link);
}
async function showMap(list){
 const el=$('#ap-map');if(!el)return;
 const ticket=++mapSequence;
 if(activeMap){activeMap.remove();activeMap=null;}
 el.hidden=false;el.replaceChildren();
 const groups=new Map();let noPosition=0,exactCount=0,approxCount=0;
 for(const property of list){
  const pos=locateForMap(property);if(!pos){noPosition++;continue;}
  const groupKey=pos.key;
  if(!groups.has(groupKey))groups.set(groupKey,{...pos,properties:[]});
  groups.get(groupKey).properties.push(property);
  if(pos.approx)approxCount++;else exactCount++;
 }
 const positions=Array.from(groups.values()),centre=positions.length?[positions[0].lat,positions[0].lng]:[36.8,51.3];
 const info=document.createElement('div');info.className='ap-map-status';info.setAttribute('role','status');
 info.textContent=positions.length
  ?`${fmt(exactCount)} اقامتگاه با مختصات تقریبی ثبت‌شده و ${fmt(approxCount)} اقامتگاه با نمایش مرکز شهر. ${noPosition?fmt(noPosition)+' اقامتگاه بدون شهر یا مختصات قابل نمایش است.':''}`
  :(list.length?'موقعیت جغرافیایی این نتایج ثبت نشده است؛ نقشه عمومی نمایش داده می‌شود و جای اقامتگاه‌ها مشخص نیست.':'در حال حاضر نقطه‌ای برای نمایش وجود ندارد؛ نقشه عمومی منطقه نمایش داده می‌شود.');
 const note=document.createElement('p');note.className='ap-geo-note';note.textContent='نشانگرهای دایره‌ای فقط مرکز شهر را مشخص می‌کنند، نه محل اقامتگاه. آدرس دقیق از روی این نقشه قابل تشخیص نیست.';
 const mount=document.createElement('div');mount.id='ap-leaflet';mount.className='ap-map';
 const fallback=document.createElement('div');fallback.className='ap-map-fallback';
 el.append(info,mount,note,fallback);
 let L;
 try{L=await loadLeaflet();}catch(e){
  if(ticket!==mapSequence||el.hidden)return;
  mount.remove();fallback.appendChild(document.createTextNode('کتابخانه نقشه بارگذاری نشد؛ نسخه عمومی جایگزین در پایین قابل استفاده است.'));
  mapFallback(fallback,centre);return;
 }
 if(ticket!==mapSequence||el.hidden)return;
 try{
  const map=L.map(mount,{scrollWheelZoom:false});activeMap=map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:18}).addTo(map);
  const bounds=[];
  for(const group of positions){
   const ll=[group.lat,group.lng];bounds.push(ll);
   const marker=group.approx
    ?L.circleMarker(ll,{radius:10,weight:2,color:'#2f72aa',fillColor:'#71abdc',fillOpacity:.78}).addTo(map)
    :L.marker(ll).addTo(map);
   const popup=document.createElement('div');popup.className='ap-map-popup';
   const title=document.createElement('strong');title.textContent=group.approx?'مرکز شهر '+group.city:'موقعیت تقریبی ثبت‌شده';popup.appendChild(title);
   const sub=document.createElement('p');sub.textContent=group.approx?'موقعیت دقیق این اقامتگاه‌ها مشخص نیست.':'موقعیت تقریبی ثبت‌شده توسط میزبان';popup.appendChild(sub);
   const ul=document.createElement('ul');for(const p of group.properties.slice(0,30)){
    const li=document.createElement('li'),a=document.createElement('a');a.href=urlProperty(p);a.textContent=p.title;li.appendChild(a);ul.appendChild(li);
   }popup.appendChild(ul);
   if(group.properties.length>30){const extra=document.createElement('p');extra.textContent=fmt(group.properties.length-30)+' اقامتگاه دیگر در فهرست نتایج';popup.appendChild(extra);}
   marker.bindPopup(popup,{maxWidth:260});
  }
  if(bounds.length===1)map.setView(bounds[0],10);else if(bounds.length>1)map.fitBounds(bounds,{padding:[45,45],maxZoom:11});else map.setView(centre,7);
  // Leaflet is initialized after the container is visible; force a layout recalculation.
  requestAnimationFrame(()=>{if(ticket===mapSequence&&!el.hidden)map.invalidateSize();});
 }catch(e){
  console.error('Afra map:',e);
  if(activeMap){try{activeMap.remove();}catch(_){/* best effort */}activeMap=null;}
  if(ticket!==mapSequence||el.hidden)return;
  mount.remove();fallback.appendChild(document.createTextNode('بارگذاری نمای تعاملی ناموفق بود؛ نقشه عمومی جایگزین:'));
  mapFallback(fallback,centre);
 }
}
async function searchPage(onlyMap=false){shell(onlyMap?'نقشه اقامتگاه‌ها':'جست‌وجوی پیشرفته اقامتگاه‌ها','مقصد، بودجه، امکانات و شرایط اقامت را تنظیم کن تا گزینه‌های واقعی موجود در سایت نمایش داده شوند.',`<div class="ap-main-layout"><aside class="ap-side" id="ap-side">${filtersHTML()}</aside><section><div class="ap-result-head"><div><h2 id="ap-count" style="margin:0">در حال جست‌وجو…</h2><small class="ap-muted">قیمت هر شب به تومان است.</small></div><div class="ap-inline-actions"><button class="ap-btn secondary ap-mobile-filter" id="ap-toggle-filters" type="button">فیلترها</button><button class="ap-btn secondary" id="ap-toggle-map" type="button" aria-controls="ap-map" aria-pressed="${onlyMap}">${onlyMap?'بستن نقشه':'نمایش روی نقشه'}</button><button class="ap-btn secondary" id="ap-save-search" type="button">ذخیره جست‌وجو</button><label class="ap-field">مرتب‌سازی<select id="ap-sort"><option value="new">جدیدترین</option><option value="cheap">ارزان‌ترین</option><option value="expensive">گران‌ترین</option><option value="popular">محبوب‌ترین</option><option value="rating">بالاترین امتیاز</option><option value="discount">بیشترین تخفیف</option></select></label></div></div><div id="ap-map" hidden aria-label="نمایش نقشه اقامتگاه‌ها"></div><div id="ap-results" class="ap-results-grid">${loading()}</div></section></div>`,'جست‌وجو و فیلترها');
 $('#ap-toggle-filters').addEventListener('click',()=>$('#ap-side').classList.toggle('ap-open'));
 const target=$('#ap-results');let all=[],dataError=null,mapOn=onlyMap;
 try{all=await properties();}catch(e){dataError=e;console.warn('Afra properties:',e);}
 const matching=()=>{const state=readFilters();return sortList(all.filter(p=>matches(p,state)),state.sort);};
 function refresh(){
  const s=readFilters();
  if(s.checkin&&s.checkout&&s.checkout<=s.checkin){$('#ap-count').textContent='تاریخ خروج باید پس از ورود باشد';target.innerHTML=banner('تاریخ خروج را اصلاح کنید.','error');if(mapOn)showMap([]);return;}
  syncQuery(s);
  if(dataError){$('#ap-count').textContent='اطلاعات اقامتگاه‌ها در دسترس نیست';target.innerHTML=banner('بارگذاری اقامتگاه‌ها ناموفق بود: '+dataError.message,'error');if(mapOn)showMap([]);return;}
  const list=matching();$('#ap-count').textContent=fmt(list.length)+' اقامتگاه مطابق فیلترها';
  target.innerHTML=list.length?list.map(stayCard).join(''):banner('اقامتگاهی مطابق این شرایط پیدا نشد. یک یا چند فیلتر را حذف کنید.');
  if(mapOn)showMap(list);
 }
 const form=$('#ap-filters');let deb;
 form.addEventListener('input',()=>{clearTimeout(deb);deb=setTimeout(refresh,170)});
 form.addEventListener('change',refresh);
 form.addEventListener('submit',e=>e.preventDefault());
 form.addEventListener('reset',e=>{e.preventDefault();$$('input',form).forEach(x=>{if(x.type==='checkbox')x.checked=false;else x.value='';});$$('select',form).forEach(x=>x.selectedIndex=0);refresh();});
 $('#ap-sort').addEventListener('change',refresh);
 $('#ap-save-search').addEventListener('click',async()=>{const me=await user();if(!me){toast('برای ثبت تاریخچه، ابتدا وارد حساب شوید.',true);return;}const query=Object.fromEntries(new URLSearchParams(location.search).entries());const {error}=await db().from('afra_search_history').insert({user_id:me.id,query_params:query});toast(error?'ثبت جست‌وجو نیاز به اجرای SQL توسعه دارد.':'جست‌وجوی شما ذخیره شد.',!!error);});
 $('#ap-toggle-map').addEventListener('click',()=>{
  mapOn=!mapOn;const button=$('#ap-toggle-map');button.textContent=mapOn?'بستن نقشه':'نمایش روی نقشه';button.setAttribute('aria-pressed',String(mapOn));
  if(mapOn)showMap(dataError?[]:matching());else hideMap();
 });
 bindFavorite(target);refresh();
}
function cardLanding(title,lead,cards,eyebrow){shell(title,lead,linkList(cards),eyebrow)}
function categoryPage(){cardLanding('انواع اقامتگاه‌ها','دسته‌بندی مورد نظر را انتخاب کن؛ نتایج جست‌وجو متناسب با همان دسته فیلتر می‌شوند.',[...TYPES.map(([key,label])=>['search.html?type='+key,label,'مشاهده اقامتگاه‌های این دسته']),['search.html?pool=1','استخردار','جست‌وجوی استخر'],['search.html?discounted=1','تخفیف‌دار','تخفیف‌های واقعی ثبت‌شده']],'دسته‌بندی اقامتگاه');}
function citiesPage(){cardLanding('شهرها و مقصدهای گردشگری','با انتخاب شهر مستقیماً به فیلتر جست‌وجوی مرتبط برو.',[['search.html?city=رامسر','رامسر','مازندران'],['search.html?city=چالوس','چالوس','مازندران'],['search.html?city=نوشهر','نوشهر','مازندران'],['search.html?city=تنکابن','تنکابن','مازندران'],['search.html?city=رشت','رشت','گیلان'],['search.html?city=لاهیجان','لاهیجان','گیلان'],['search.html?city=نمک‌آبرود','نمک‌آبرود','مازندران'],['search.html?city=متل قو','متل قو','مازندران']],'مقصدها');}
function regionsPage(){cardLanding('مناطق گردشگری','نوع طبیعت و منطقه را انتخاب کن.',[['search.html?coastal=1','نزدیک دریا','ساحلی'],['search.html?forest=1','کنار جنگل','جنگلی'],['search.html?mountain=1','کوهستان','کوهستانی'],['search.html?area=روستا','روستاها','منطقه‌های روستایی']],'مناطق گردشگری');}
function marketingPage(which){const pages={
 'about':['درباره افرا سفر','افرا سفر بستری برای جست‌وجو و ثبت درخواست رزرو اقامتگاه است. اطلاعات اقامتگاه‌ها توسط میزبان‌ها ثبت و پس از بررسی منتشر می‌شوند.'],
 'contact':['تماس با افرا سفر','برای پیگیری رزرو، کد رهگیری را از صفحه سفرهای من همراه داشته باشید. برای درخواست پشتیبانی از فرم زیر استفاده کنید.'],
 'rules':['قوانین و مقررات','ارسال درخواست رزرو به‌تنهایی به معنای قطعی‌شدن اقامت نیست. شرایط کنسلی هر اقامتگاه و وضعیت پرداخت باید پیش از واریز بررسی شوند. تا زمان اعلام قطعی‌شدن، آدرس دقیق اقامتگاه در اختیار مسافر قرار نمی‌گیرد.'],
 'privacy':['حریم خصوصی','اطلاعات تماس و رزرو فقط در بخش‌های ضروری و طبق مجوزهای کاربران استفاده می‌شوند. افرا سفر هرگز اطلاعات کارت بانکی را داخل این صفحات ذخیره نمی‌کند.'],
 'faq':['پرسش‌های پرتکرار','پاسخ به مراحل جست‌وجو، رزرو و لغو درخواست.'],
 'magazine':['مجله سفر','ایده‌ها و راهنمای سفر به مناطق شمال ایران.'],
 'journal':['راهنمای انتخاب اقامتگاه','پیش از رزرو ظرفیت واقعی، موقعیت تقریبی، قوانین لغو، امکانات و ساعت تحویل را بررسی کنید.'],
 'become-host':['میزبان افرا سفر شوید','اقامتگاه خود را ثبت کن تا بعد از بررسی هویت و اطلاعات اقامتگاه امکان رزرو فراهم شود.'],
 'last-minute':['پیشنهادهای لحظه آخری','فهرست تخفیف‌های واقعی ثبت‌شده توسط میزبان‌ها، بدون نمایش پیشنهاد ساختگی.'],
 'discounts':['کدهای تخفیف','تخفیف‌ها در مرحله محاسبه مبلغ نهایی و فقط در صورت اعتبارسنجی سرور اعمال می‌شوند.'],
 'referrals':['معرفی دوستان','کد معرفی و امتیاز وفاداری نیازمند ثبت و اعتبارسنجی سمت سرور است. در این نسخه امکان دریافت تخفیف ساختگی وجود ندارد.']};
 const [title,lead]=pages[which];let body='';
 if(which==='faq')body=`<div class="ap-faq">${[['چطور درخواست رزرو ثبت کنم؟','پس از جست‌وجو، صفحه اقامتگاه را باز کنید؛ تاریخ‌های آزاد و ظرفیت را بررسی و درخواست را ثبت کنید.'],['آیا رزرو بلافاصله قطعی است؟','خیر. درخواست ابتدا توسط میزبان بررسی می‌شود و قطعی‌شدن فقط پس از تأیید پرداخت اعلام می‌شود.'],['پیگیری رزرو چگونه است؟','در صفحه سفرهای من، کد رزرو و شماره موبایل ثبت‌شده را وارد کنید.'],['قوانین کنسلی چیست؟','قوانین و مبلغ استرداد وابسته به شرایط همان اقامتگاه و وضعیت پرداخت است. تا تعیین ضوابط نهایی، لغو آنلاین و بازگشت وجه خودکار فعال نیست.'],['تخفیف‌ها چگونه اعمال می‌شوند؟','کد تخفیف باید توسط سیستم رزرو و در سرور اعتبارسنجی شود.']].map(([a,b])=>`<details><summary>${a}</summary><p>${b}</p></details>`).join('')}</div>`;
 else if(which==='magazine')body=linkList([['journal-villa.html','چک‌لیست رزرو مطمئن','اطلاعات مهم پیش از پرداخت'],['cities.html','شهرهای شمال','انتخاب مقصد براساس شهر'],['regions.html','سبک‌های سفر','اقامتگاه جنگلی و ساحلی']]);
 else if(which==='contact')body=`<p><a class="ap-btn" href="support.html">ثبت درخواست پشتیبانی</a></p><p class="ap-muted">شماره تماس یا نشانی رسمی را در محتوای سایت خودتان درج کنید؛ در این نسخه اطلاعات تماس تأییدنشده ساخته نشده است.</p>`;
 else if(which==='become-host')body=linkList([['owner-register.html','ثبت‌نام میزبان','ورود اطلاعات هویتی و اقامتگاه'],['owner-login.html','ورود میزبان','ورود با حساب فعلی'],['owner-dashboard.html','پنل میزبان','مدیریت اقامتگاه‌ها'],['host-calendar.html','تقویم میزبان','مدیریت تاریخ‌های بسته‌شده']]);
 else if(which==='last-minute')body='<div id="ap-marketing-list" class="ap-results-grid">'+loading()+'</div>';
 else if(which==='discounts')body=linkList([['search.html?discounted=1','اقامتگاه‌های تخفیف‌دار','مشاهده پیشنهادهای موجود'],['my-reservations.html','پیگیری رزرو','نمایش اطلاعات مبلغ و تخفیف ثبت‌شده']]);
 else if(which==='referrals')body=linkList([['guest-dashboard.html','حساب کاربری','مدیریت مشخصات'],['support.html','پشتیبانی','سؤال درباره شرایط جشنواره‌ها']]);
 else if(which==='rules')body=`<div class="ap-faq">${[['مرحله درخواست','درخواست توسط میزبان بررسی می‌شود؛ تا پیش از تأیید نهایی، رزرو قطعی نیست.'],['قیمت و پرداخت','قیمت در زمان ثبت درخواست استعلام می‌شود؛ فقط نتیجه معتبر درگاه و سرور ملاک پرداخت است.'],['کنسلی و بازپرداخت','مبلغ استرداد تابع شرایط اقامتگاه و قرارداد است و باید قبل از پرداخت روشن باشد.'],['حریم خصوصی','جزئیات تماس و آدرس دقیق با کنترل سطح دسترسی ارائه می‌شوند.']].map(([a,b])=>`<details><summary>${a}</summary><p>${b}</p></details>`).join('')}</div>`;
 shell(title,lead,`<section class="ap-panel">${body||'<p class="ap-muted">اطلاعات این صفحه باید بر اساس قوانین و شرایط رسمی کسب‌وکار تکمیل و تأیید شود.</p>'}</section>`,which==='magazine'?'مجله':'راهنما');
 if(which==='last-minute'){properties().then(p=>{const l=p.filter(x=>Number(x.spec?.discount_percent)>0).sort((a,b)=>Number(b.spec.discount_percent)-Number(a.spec.discount_percent));$('#ap-marketing-list').innerHTML=l.length?l.map(stayCard).join(''):banner('در حال حاضر تخفیف ثبت‌شده و قابل نمایش وجود ندارد.');bindFavorite($('#ap-marketing-list'));}).catch(e=>$('#ap-marketing-list').innerHTML=banner(e.message,'error'));}}
async function authPage(){const phoneMode=moduleId==='auth';shell(phoneMode?'ورود به افرا سفر':'ثبت‌نام در افرا سفر','ورود امن با پیامک نیاز به فعال‌سازی ارائه‌دهنده پیامک در تنظیمات Supabase Auth دارد.',`<div class="ap-grid two"><section class="ap-panel"><h2>ورود / ثبت‌نام با موبایل</h2><form id="ap-otp-form" class="ap-stack">${field('شماره موبایل با کد کشور','ap-phone','tel','','required inputmode="tel" placeholder="+989121234567" autocomplete="tel"')}<button class="ap-btn" type="submit">ارسال کد پیامکی</button><p class="ap-muted">کد فقط از طریق سرویس پیامکی متصل به Supabase ارسال می‌شود؛ این صفحه پیامک شبیه‌سازی نمی‌کند.</p><div id="ap-otp-status" role="status"></div></form><form id="ap-verify-form" hidden class="ap-stack" style="margin-top:15px">${field('کد تأیید','ap-otp-token','text','','required inputmode="numeric" autocomplete="one-time-code" maxlength="8"')}<button class="ap-btn" type="submit">تأیید و ورود</button></form></section><section class="ap-panel"><h2>قبلاً با ایمیل ثبت‌نام کرده‌ای؟</h2><p>برای حفظ حساب‌های موجود، ورود ایمیل و رمز عبور هم پشتیبانی می‌شود.</p><form class="ap-stack" id="ap-email-form">${field('ایمیل','ap-email','email','','required autocomplete="email"')}${field('رمز عبور','ap-password','password','','required minlength="6" autocomplete="current-password"')}<button type="submit" class="ap-btn">ورود با ایمیل</button><div id="ap-email-msg" role="status"></div></form><a href="owner-login.html" class="ap-btn ghost">ورود میزبان</a></section></div>`,'احراز هویت');
 const go=()=>{const next=q('next');location.href=next&&/^[a-z0-9_.-]+\.html(?:\?[^#]*)?$/i.test(next)?next:'guest-dashboard.html';};
 $('#ap-otp-form').addEventListener('submit',async e=>{e.preventDefault();const phone=$('#ap-phone').value.trim();const out=$('#ap-otp-status');if(!/^\+\d{9,15}$/.test(phone)){out.innerHTML=banner('شماره را با کد کشور وارد کنید؛ نمونه: ‎+989121234567','error');return;}if(!db()){out.innerHTML=missingDb();return;}const {error}=await db().auth.signInWithOtp({phone});if(error){out.innerHTML=banner('ارسال پیامک انجام نشد: '+error.message,'error');return;}out.innerHTML=banner('اگر سرویس پیامک فعال باشد، کد برای این شماره ارسال شده است.','success');$('#ap-verify-form').hidden=false;});
 $('#ap-verify-form').addEventListener('submit',async e=>{e.preventDefault();const {error}=await db().auth.verifyOtp({phone:$('#ap-phone').value.trim(),token:$('#ap-otp-token').value.trim(),type:'sms'});if(error){$('#ap-otp-status').innerHTML=banner(error.message,'error');return;}go();});
 $('#ap-email-form').addEventListener('submit',async e=>{e.preventDefault();if(!db()){$('#ap-email-msg').innerHTML=missingDb();return;}const {error}=await db().auth.signInWithPassword({email:$('#ap-email').value.trim(),password:$('#ap-password').value});if(error){$('#ap-email-msg').innerHTML=banner('ورود ناموفق بود: '+error.message,'error');return;}go();});
}
async function dashboardPage(){shell('پنل مسافر','حساب خود، علاقه‌مندی‌ها و مسیر پیگیری رزروها را مدیریت کن.',`<div id="ap-dashboard" class="ap-stack">${loading()}</div>`,'حساب کاربری');const me=await user();const box=$('#ap-dashboard');if(!me){box.innerHTML=loginNeeded();return;}
 const rows=await optionalTable('afra_profiles');const profile=rows?.find(x=>x.user_id===me.id)||{};
 box.innerHTML=`<div class="ap-grid four"><div class="ap-stat"><strong>👤</strong><small>حساب فعال</small></div><div class="ap-stat"><strong>♡</strong><small>علاقه‌مندی‌ها</small></div><div class="ap-stat"><strong>🧾</strong><small>پیگیری کد رزرو</small></div><div class="ap-stat"><strong>✉</strong><small>پشتیبانی</small></div></div><section class="ap-panel"><h2>اطلاعات پروفایل</h2><p class="ap-muted">شناسه کاربری: <code dir="ltr">${html(me.id)}</code></p><form id="ap-profile-form" class="ap-form-grid">${field('نام و نام خانوادگی','ap-fullname','text',profile.full_name||me.user_metadata?.full_name||'','maxlength="90"')}${field('شماره تماس','ap-contact','tel',profile.phone||me.phone||'','maxlength="22"')}${field('شهر','ap-profilecity','text',profile.city||'','maxlength="60"')}<div style="align-self:end"><button class="ap-btn" type="submit">ذخیره پروفایل</button></div></form><p id="ap-profile-message" role="status"></p></section>${linkList([['my-searches.html','جست‌وجوهای ذخیره‌شده','فیلترهای اخیر خود'],['my-reviews.html','ثبت نظر پس از اقامت','بازخورد اقامت‌های تکمیل‌شده'],['account-bookings.html','رزروهای حساب','درخواست‌های ثبت‌شده با حساب کاربری'],['notifications.html','اعلان‌های من','پیام‌های داخلی سایت'],['my-reservations.html','سفرهای من','پیگیری رزرو با کد و شماره موبایل'],['favorites.html','علاقه‌مندی‌ها','اقامتگاه‌های نشان‌شده'],['wallet.html','کیف پول','تراکنش‌های معتبر و مانده'],['reviews.html','نظرات من','مشاهده نظرات ثبت‌شده'],['support.html','تیکت پشتیبانی','ارسال درخواست کمک'],['messages.html','پیام‌ها','گفت‌وگوهای دارای دسترسی']])}<button type="button" class="ap-btn secondary" id="ap-signout" style="justify-self:start">خروج از حساب</button>`;
 $('#ap-profile-form').addEventListener('submit',async e=>{e.preventDefault();const payload={user_id:me.id,full_name:$('#ap-fullname').value.trim(),phone:$('#ap-contact').value.trim(),city:$('#ap-profilecity').value.trim()};const {error}=await db().from('afra_profiles').upsert(payload,{onConflict:'user_id'});$('#ap-profile-message').innerHTML=error?banner('ذخیره انجام نشد. ابتدا SQL توسعه را روی دیتابیس اجرا کنید. '+error.message,'error'):banner('اطلاعات پروفایل ذخیره شد.','success');});
 $('#ap-signout').addEventListener('click',async()=>{await db()?.auth.signOut();location.href='index.html';});}
async function favoritePage(){shell('علاقه‌مندی‌های من','اقامتگاه‌های منتخب را برای مقایسه و رزرو سریع پیدا کن.',`<div id="ap-favorites" class="ap-results-grid">${loading()}</div>`,'پنل مسافر');const me=await user();let ids=safeLocalFavorites();if(me&&db()){const {data,error}=await db().from('afra_favorites').select('property_id').eq('user_id',me.id);if(!error)ids=[...new Set([...ids,...(data||[]).map(r=>r.property_id)])];}
 try{const p=(await properties()).filter(x=>ids.includes(x.id));$('#ap-favorites').innerHTML=p.length?p.map(stayCard).join(''):banner('هنوز اقامتگاهی به علاقه‌مندی‌ها اضافه نکرده‌ای.');bindFavorite($('#ap-favorites'));}catch(e){$('#ap-favorites').innerHTML=banner(e.message,'error');}}
async function supportPage(){
 shell('پشتیبانی افرا سفر','درخواست‌ها و پاسخ‌های مدیریت تنها در حساب خودتان نمایش داده می‌شوند.',`<div class="ap-grid two"><section class="ap-panel"><h2>ثبت درخواست</h2><form id="ap-ticket" class="ap-stack">${field('موضوع','ap-ticket-title','text','','required minlength="5" maxlength="120"')}<label class="ap-field">نوع درخواست<select id="ap-ticket-type"><option value="booking">رزرو</option><option value="payment">پرداخت</option><option value="host">میزبانی</option><option value="complaint">شکایت</option><option value="other">سایر</option></select></label><label class="ap-field">شرح<textarea id="ap-ticket-body" required minlength="10" maxlength="4000"></textarea></label><button class="ap-btn" type="submit">ارسال درخواست</button><div id="ap-ticket-msg" role="status"></div></form></section><section class="ap-panel"><div class="ap-row"><h2>درخواست‌های من</h2><button id="ap-ticket-refresh" type="button" class="ap-btn small secondary">تازه‌سازی</button></div><div id="ap-tickets">${loading()}</div></section></div>`,'پشتیبانی');
 const me=await user();if(!me){$('#ap-ticket-msg').innerHTML=loginNeeded();$('#ap-ticket').querySelector('button').disabled=true;$('#ap-tickets').innerHTML=loginNeeded();return;}
 async function reload(){const {data,error}=await db().from('afra_support_tickets').select('id,subject,category,message,status,admin_reply,created_at,updated_at').eq('user_id',me.id).order('created_at',{ascending:false}).limit(100);$('#ap-tickets').innerHTML=error?banner('خواندن درخواست‌ها ممکن نشد: '+error.message,'error'):(data?.length?`<div class="ap-stack">${data.map(t=>`<article class="ap-callout"><div class="ap-row"><strong>${html(t.subject)}</strong><span class="ap-pill">${html(t.status)}</span></div><p>${html(t.message)}</p>${t.admin_reply?`<div class="ap-panel"><strong>پاسخ پشتیبانی</strong><p>${html(t.admin_reply)}</p></div>`:'<small class="ap-muted">هنوز پاسخی ثبت نشده است.</small>'}<small class="ap-muted">${new Date(t.created_at).toLocaleString('fa-IR')}</small></article>`).join('')}</div>`:banner('هنوز درخواستی ثبت نشده است.'));}
 await reload();$('#ap-ticket-refresh').addEventListener('click',reload);
 $('#ap-ticket').addEventListener('submit',async e=>{e.preventDefault();const btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;const payload={user_id:me.id,subject:$('#ap-ticket-title').value.trim(),category:$('#ap-ticket-type').value,message:$('#ap-ticket-body').value.trim()};const {error}=await db().from('afra_support_tickets').insert(payload);btn.disabled=false;$('#ap-ticket-msg').innerHTML=error?banner('ارسال ناموفق: '+error.message,'error'):banner('درخواست ثبت شد.','success');if(!error){e.target.reset();await reload();}});
}
async function walletPage(){shell('کیف پول و تراکنش‌ها','فقط تراکنش‌های واقعی تأییدشده در سرور، اعتبار کیف پول محسوب می‌شوند.',`<div id="ap-wallet">${loading()}</div>`,'مالی مسافر');const me=await user();const box=$('#ap-wallet');if(!me){box.innerHTML=loginNeeded();return;}const {data,error}=await db().from('afra_wallet_entries').select('amount,kind,description,created_at').eq('user_id',me.id).order('created_at',{ascending:false});if(error){box.innerHTML=banner('دریافت اطلاعات کیف پول نیاز به فعال‌سازی جداول SQL دارد.','error');return;}const rows=data||[];const balance=rows.reduce((sum,x)=>sum+Number(x.amount||0),0);box.innerHTML=`<div class="ap-grid two"><div class="ap-stat"><strong>${money(balance)}</strong><small>مانده ثبت‌شده</small></div><div class="ap-stat"><strong>${fmt(rows.length)}</strong><small>تعداد عملیات</small></div></div>${section('سوابق تراکنش',rows.length?`<div class="ap-table-wrap"><table class="ap-table"><thead><tr><th>تاریخ</th><th>شرح</th><th>مبلغ</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${new Date(r.created_at).toLocaleDateString('fa-IR')}</td><td>${html(r.description||r.kind)}</td><td>${money(r.amount)}</td></tr>`).join('')}</tbody></table></div>`:'هنوز تراکنشی ثبت نشده است.')}`;}
async function reviewsPage(){
 shell('نظرات مسافران','فقط نظرهای تأییدشده مربوط به اقامت‌های تأیید و پرداخت‌شده منتشر می‌شوند.',`<div id="ap-reviews">${loading()}</div>`,'اعتماد و شفافیت');
 const el=$('#ap-reviews');if(!db()){el.innerHTML=missingDb();return;}
 const {data,error}=await db().from('afra_reviews').select('id,property_id,score,body,created_at').eq('moderation_status','approved').order('created_at',{ascending:false}).limit(100);
 if(error){el.innerHTML=banner('خواندن نظرات ممکن نشد: '+error.message,'error');return;}
 const rows=data||[];if(!rows.length){el.innerHTML=banner('هنوز نظر تأییدشده‌ای برای نمایش ثبت نشده است.');return;}
 const ids=rows.map(r=>r.id);const replies=await db().from('afra_review_replies').select('review_id,body').in('review_id',ids);
 const byId=new Map((replies.data||[]).map(r=>[r.review_id,r.body]));
 el.innerHTML=`<div class="ap-grid autofit">${rows.map(r=>`<article class="ap-panel"><span class="ap-rating">${'★'.repeat(Math.max(1,Math.min(5,Number(r.score)||1)))}</span><p>${html(r.body)}</p>${byId.has(r.id)?`<div class="ap-callout"><strong>پاسخ میزبان</strong><p>${html(byId.get(r.id))}</p></div>`:''}<small class="ap-muted">${new Date(r.created_at).toLocaleDateString('fa-IR')}</small><p><a class="ap-btn small secondary" href="property.html?id=${encodeURIComponent(r.property_id)}">جزئیات اقامتگاه</a></p></article>`).join('')}</div>`;
}
async function comparePage(){shell('مقایسه اقامتگاه‌ها','برای مقایسه، ابتدا اقامتگاه‌ها را در فهرست علاقه‌مندی‌ها ذخیره کن.',`<div id="ap-compare">${loading()}</div>`,'مقایسه');try{const ids=safeLocalFavorites();const r=(await properties()).filter(x=>ids.includes(x.id)).slice(0,4);$('#ap-compare').innerHTML=r.length?`<div class="ap-table-wrap ap-panel"><table class="ap-table"><thead><tr><th>ویژگی</th>${r.map(x=>`<th>${html(x.title)}</th>`).join('')}</tr></thead><tbody>${[['شهر',x=>x.location],['قیمت هر شب',x=>money(x.price)],['ظرفیت',x=>fmt(x.capacity)+' نفر'],['اتاق خواب',x=>x.spec?.bedrooms||'ثبت نشده'],['استخر',x=>specTruth(x,'pool')?'بله':'ثبت نشده'],['تخفیف',x=>Number(x.spec?.discount_percent||0)?fmt(x.spec.discount_percent)+'٪':'ثبت نشده'],['جزئیات',x=>`<a class="ap-btn small" href="${urlProperty(x)}">مشاهده</a>`]].map(([key,fn])=>`<tr><th>${key}</th>${r.map(x=>`<td>${fn(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:banner('برای مقایسه، ابتدا اقامتگاه‌ها را به علاقه‌مندی‌ها اضافه کنید.');}catch(e){$('#ap-compare').innerHTML=banner(e.message,'error');}}
async function bookingPage(){
 const id=q('id');
 shell('درخواست رزرو با حساب مسافر','این فرم به جدول واقعی reservations و تابع رزرو فعلی متصل است. درخواست ثبت‌شده ممکن است برای میزبان اعلان ارسال کند؛ رزرو تا تأیید و پرداخت قطعی نیست.',`<div id="ap-booking" class="ap-stack">${loading()}</div>`,'رزرو اقامتگاه');
 const box=$('#ap-booking');
 if(!id){box.innerHTML=banner('اقامتگاهی انتخاب نشده است.')+'<a class="ap-btn" href="search.html">جست‌وجوی اقامتگاه</a>';return;}
 if(!db()){box.innerHTML=missingDb();return;}
 const me=await user();if(!me){box.innerHTML=loginNeeded();return;}
 try{
  const {data:p,error}=await db().from('properties').select('id,title,location,capacity,price,is_active').eq('id',id).eq('is_active',true).single();
  if(error)throw error;
  const {data:profile}=await db().from('afra_profiles').select('full_name,phone').eq('user_id',me.id).maybeSingle();
  const initialName=profile?.full_name||me.user_metadata?.full_name||'';
  const initialPhone=profile?.phone||me.phone||me.user_metadata?.phone||'';
  box.innerHTML=`<section class="ap-panel"><h2>${html(p.title)}</h2><p class="ap-muted">${html(p.location||'')} · ظرفیت ${fmt(p.capacity)} نفر · قیمت پایه ${money(p.price)} برای هر شب</p>
    <form id="ap-new-booking" class="ap-form-grid">
    ${field('نام و نام خانوادگی مسافر','ap-book-name','text',initialName,'required minlength="2" maxlength="100" autocomplete="name"')}
    ${field('شماره تماس','ap-book-phone','tel',initialPhone,'required minlength="7" maxlength="20" autocomplete="tel"')}
    ${field('تاریخ ورود (شمسی)','ap-book-in','date',q('checkin'),'required min="'+newDate()+'"')}
    ${field('تاریخ خروج (شمسی)','ap-book-out','date',q('checkout'),'required min="'+newDate()+'"')}
    ${field('تعداد نفرات','ap-book-guests','number',q('guests')||'2','required min="1" max="'+Number(p.capacity)+'"')}
    <label class="ap-field wide">پیام به میزبان (اختیاری)<textarea id="ap-book-note" maxlength="1000" placeholder="درخواست یا توضیحات لازم"></textarea></label>
    <div id="ap-book-quote" class="wide"></div>
    <button class="ap-btn" type="submit">ثبت درخواست واقعی برای میزبان</button><div id="ap-book-result" class="wide" role="status"></div></form>
    <p class="ap-muted">مبلغ نمایش‌داده‌شده صرفاً برآورد بر اساس قیمت پایه است. کارمزد، قیمت ویژه، تخفیف و مبلغ قطعی باید توسط سیستم پرداخت معتبر بررسی شوند.</p></section>`;
  const form=$('#ap-new-booking');
  function quote(){const a=$('#ap-book-in').value,b=$('#ap-book-out').value;const nights=a&&b?Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000):0;$('#ap-book-quote').innerHTML=nights>0?banner('برآورد اولیه '+fmt(nights)+' شب: '+money(Number(p.price)*nights)+' (غیرقطعی)'):'';}
  form.addEventListener('change',quote);quote();
  form.addEventListener('submit',async e=>{
   e.preventDefault();const name=$('#ap-book-name').value.trim(),phone=$('#ap-book-phone').value.trim(),a=$('#ap-book-in').value,b=$('#ap-book-out').value,guests=Number($('#ap-book-guests').value);
   const output=$('#ap-book-result');if(!name||name.length<2||phone.length<7||!a||!b||b<=a||a<newDate()||!Number.isInteger(guests)||guests<1||guests>Number(p.capacity)){output.innerHTML=banner('نام، تماس، تاریخ یا تعداد نفرات معتبر نیست.','error');return;}
   const button=form.querySelector('button[type="submit"]');button.disabled=true;
   try{
    const {data,error}=await db().rpc('create_public_reservation',{p_property_id:p.id,p_guest_name:name,p_guest_phone:phone,p_check_in:a,p_check_out:b,p_guest_count:guests,p_guest_message:$('#ap-book-note').value.trim()||null});
    if(error)throw error;
    const result=Array.isArray(data)?data[0]:data;
    if(!result?.reservation_id)throw new Error('کد ثبت درخواست از سرویس رزرو دریافت نشد. برای جلوگیری از ثبت دوباره، ابتدا حساب رزروها را بررسی کنید.');
    output.innerHTML=banner('درخواست رزرو ثبت شد و در انتظار بررسی میزبان است.','success')+
      `<p>کد پیگیری: <strong dir="ltr">${html(result.reservation_code||'ثبت شده')}</strong></p><div class="ap-inline-actions"><a class="ap-btn small" href="account-bookings.html">رزروهای حساب من</a><a class="ap-btn small secondary" href="messages.html?reservation_id=${encodeURIComponent(result.reservation_id)}">گفت‌وگو با میزبان</a></div>`;
    button.hidden=true;
   }catch(err){output.innerHTML=banner('ثبت درخواست ناموفق: '+(err?.message||'خطای نامشخص'),'error');}
   finally{button.disabled=false;}
  });
 }catch(e){box.innerHTML=banner('امکان دریافت اطلاعات اقامتگاه وجود ندارد: '+e.message,'error')+'<a href="search.html" class="ap-btn">بازگشت به جست‌وجو</a>';}
}
async function accountBookingsPage(){
 shell('رزروهای حساب من','رزروهای واقعی متصل به حساب ورود شما، شامل وضعیت درخواست و پرداخت، در این صفحه نشان داده می‌شوند.',`<div id="ap-accountbookings" class="ap-stack">${loading()}</div>`,'حساب مسافر');
 const me=await user(),box=$('#ap-accountbookings');if(!me){box.innerHTML=loginNeeded();return;}
 const {data,error}=await db().from('reservations').select('id,reservation_code,property_id,check_in,check_out,guest_count,status,payment_status,payment_amount,payment_deadline_at,created_at').eq('guest_user_id',me.id).order('created_at',{ascending:false}).limit(100);
 if(error){box.innerHTML=banner('خواندن رزروها ممکن نشد: '+error.message,'error');return;}
 const rows=data||[];box.innerHTML=rows.length?rows.map(r=>`<article class="ap-panel"><div class="ap-row"><h3>کد ${html(r.reservation_code||r.id)}</h3><span class="ap-pill">${html(r.status)} · ${html(r.payment_status)}</span></div>
 <p>ورود ${html(jDate(r.check_in))} · خروج ${html(jDate(r.check_out))} · ${fmt(r.guest_count)} نفر</p>
 <p>${r.payment_amount!==null&&r.payment_amount!==undefined?'مبلغ ثبت‌شده در سیستم: '+money(r.payment_amount):'مبلغ قطعی هنوز ثبت نشده است.'}</p>
 ${r.payment_deadline_at?`<p class="ap-muted">مهلت پرداخت: ${new Date(r.payment_deadline_at).toLocaleString('fa-IR')}</p>`:''}
 <div class="ap-inline-actions"><a class="ap-btn small secondary" href="property.html?id=${encodeURIComponent(r.property_id)}">اقامتگاه</a>
 <a class="ap-btn small secondary" href="messages.html?reservation_id=${encodeURIComponent(r.id)}">پیام به میزبان</a>
 <a class="ap-btn small secondary" href="my-reservations.html">پیگیری با کد</a>
 <a class="ap-btn small secondary" href="support.html">درخواست لغو / پشتیبانی</a></div></article>`).join(''):banner('درخواستی به این حساب متصل نشده است. رزروهای قدیمی که بدون ورود ثبت شده‌اند را می‌توان از صفحه «پیگیری با کد» دنبال کرد.')+'<p><a class="ap-btn" href="my-reservations.html">پیگیری رزرو قدیمی</a></p>';
}
async function notificationsPage(){
 shell('اعلان‌های من','اعلان‌ها به حساب خودتان متصل‌اند؛ موارد خوانده‌نشده را می‌توانید علامت بزنید.',`<section class="ap-panel"><div class="ap-row"><h2>آخرین اعلان‌ها</h2><button type="button" id="ap-notices-refresh" class="ap-btn secondary small">تازه‌سازی</button></div><div id="ap-notices">${loading()}</div></section>`,'اعلان‌ها');
 const me=await user(),box=$('#ap-notices');if(!me){box.innerHTML=loginNeeded();return;}
 async function refresh(){const {data,error}=await db().from('afra_notifications').select('id,title,body,created_at,read_at').eq('user_id',me.id).order('created_at',{ascending:false}).limit(100);box.innerHTML=error?banner('خواندن اعلان‌ها ممکن نشد: '+error.message,'error'):(data?.length?data.map(r=>`<article class="ap-callout" style="margin-bottom:12px"><div class="ap-row"><h3>${html(r.title)}</h3>${r.read_at?'<span class="ap-muted">خوانده‌شده</span>':`<button type="button" class="ap-btn small secondary" data-read-notice="${html(r.id)}">علامت‌گذاری خوانده‌شده</button>`}</div><p>${html(r.body||'')}</p><small class="ap-muted">${new Date(r.created_at).toLocaleString('fa-IR')}</small></article>`).join(''):banner('اعلانی وجود ندارد.'));}
 await refresh();$('#ap-notices-refresh').addEventListener('click',refresh);
 box.addEventListener('click',async e=>{const btn=e.target.closest('[data-read-notice]');if(!btn)return;btn.disabled=true;const {error}=await db().from('afra_notifications').update({read_at:new Date().toISOString()}).eq('id',btn.dataset.readNotice).eq('user_id',me.id);if(error){toast('ثبت وضعیت خواندن ممکن نشد: '+error.message,true);btn.disabled=false;return;}await refresh();});
}

function paymentPage(kind){const title=kind==='payment'?'پرداخت رزرو':kind==='result'?'نتیجه پرداخت':'سند رزرو';shell(title,'وضعیت پرداخت و سند رزرو فقط باید از داده تأیید‌شده سمت سرور دریافت شوند.',`<section class="ap-panel">${banner(kind==='payment'?'در این بسته هیچ درگاه بانکی به‌صورت نمایشی یا ناامن فعال نشده است. برای پرداخت، ابتدا رزرو تأییدشده و مسیر معتبر درگاه باید در سمت سرور ایجاد شود.':kind==='result'?'از روی پارامترهای مرورگر نمی‌توان موفقیت پرداخت را تأیید کرد. نتیجه معتبر فقط از سرور و گزارش رسمی درگاه است.':'صدور سند معتبر پس از رزرو قطعی و ثبت پرداخت تأییدشده انجام می‌شود.')}<div class="ap-inline-actions"><a class="ap-btn" href="my-reservations.html">بررسی آخرین وضعیت رزرو</a><a class="ap-btn secondary" href="support.html">پشتیبانی</a></div></section>`,'پرداخت امن');}
async function hostCalendarPage(){shell('تقویم میزبان','تاریخ‌های غیرقابل رزرو را فقط برای اقامتگاه‌های متعلق به خودت ثبت کن.',`<div id="ap-hostcal">${loading()}</div>`,'پنل میزبان');const me=await user(),box=$('#ap-hostcal');if(!me){box.innerHTML=loginNeeded();return;}const {data:rows,error}=await db().from('properties').select('id,title').eq('owner_id',me.id);if(error){box.innerHTML=banner(error.message,'error');return;}if(!rows?.length){box.innerHTML=banner('هنوز اقامتگاهی برای این حساب ثبت نشده است.')+'<a href="owner-dashboard.html" class="ap-btn">پنل میزبان</a>';return;}
 box.innerHTML=`<section class="ap-panel"><h2>بستن تاریخ</h2><form class="ap-form-grid" id="ap-block-form"><label class="ap-field">اقامتگاه<select id="ap-block-property">${rows.map(p=>`<option value="${html(p.id)}">${html(p.title)}</option>`).join('')}</select></label>${field('از تاریخ','ap-block-start','date','','required')}${field('تا تاریخ (انحصاری)','ap-block-end','date','','required')}<label class="ap-field wide">علت مسدودکردن<input id="ap-block-reason" maxlength="180" placeholder="مثلاً تعمیرات یا استفاده شخصی"></label><button type="submit" class="ap-btn">ثبت بازه مسدود</button></form><p id="ap-block-msg" role="status"></p></section><section class="ap-panel"><h2>بازه‌های بسته‌شده</h2><div id="ap-block-list">${loading()}</div></section><section class="ap-panel"><h2>قیمت ویژه هر شب</h2><form id="ap-rate-form" class="ap-form-grid">${field('تاریخ','ap-rate-date','date','','required')}${field('قیمت آن شب (تومان)','ap-rate-price','number','','min="0" required step="10000"')}${field('توضیح','ap-rate-note','text','','maxlength="160"')}<button class="ap-btn" type="submit">ذخیره قیمت</button></form><div id="ap-rate-msg" role="status"></div><div id="ap-rate-list" style="margin-top:12px">${loading()}</div></section><section class="ap-panel"><h2>درخواست‌های رزرو با حساب کاربری</h2><div id="ap-host-orders">${loading()}</div></section>`;
 async function reload(){const id=$('#ap-block-property').value;const {data,error}=await db().from('afra_property_blocks').select('id,start_date,end_date,reason').eq('property_id',id).order('start_date',{ascending:false});$('#ap-block-list').innerHTML=error?banner('برای مدیریت تقویم، migration دیتابیس را اجرا کنید.','error'):(data?.length?data.map(b=>`<div class="ap-row" style="padding:9px;border-bottom:1px solid var(--ap-line)"><span>${html(jDate(b.start_date))} تا ${html(jDate(b.end_date))} — ${html(b.reason||'بدون توضیح')}</span><button type="button" class="ap-btn small secondary" data-unblock="${html(b.id)}">بازکردن تاریخ</button></div>`).join(''):banner('بازه‌ای مسدود نشده است.'));}
 $('#ap-block-property').addEventListener('change',()=>{reload();loadRates();});$('#ap-block-form').addEventListener('submit',async e=>{e.preventDefault();const a=$('#ap-block-start').value,b=$('#ap-block-end').value;if(!a||!b||b<=a){$('#ap-block-msg').innerHTML=banner('تاریخ پایان باید پس از شروع باشد.','error');return;}const {error}=await db().from('afra_property_blocks').insert({property_id:$('#ap-block-property').value,start_date:a,end_date:b,reason:$('#ap-block-reason').value.trim()});$('#ap-block-msg').innerHTML=error?banner(error.message,'error'):banner('تاریخ‌ها مسدود شدند.','success');if(!error){e.target.reset();reload();}});$('#ap-block-list').addEventListener('click',async e=>{const b=e.target.closest('[data-unblock]');if(!b)return;if(!confirm('این بازه را دوباره باز می‌کنی؟'))return;const {error}=await db().from('afra_property_blocks').delete().eq('id',b.dataset.unblock);if(error)toast(error.message,true);else reload()});reload();async function loadRates(){const property=$('#ap-block-property').value;const {data,error}=await db().from('afra_special_rates').select('property_id,stay_date,night_price,note').eq('property_id',property).order('stay_date',{ascending:true}).limit(100);$('#ap-rate-list').innerHTML=error?banner('قیمت‌های ویژه بعد از اجرای SQL فعال می‌شوند.','error'):(data?.length?data.map(x=>`<div class="ap-row" style="border-bottom:1px solid var(--ap-line);padding:7px"><span>${html(jDate(x.stay_date))} · ${money(x.night_price)} · ${html(x.note||'')}</span><button class="ap-btn small secondary" data-delete-rate="${html(jDate(x.stay_date))}">حذف</button></div>`).join(''):banner('برای این اقامتگاه، قیمت روزانه ویژه‌ای ثبت نشده است.'));}
$('#ap-rate-form').addEventListener('submit',async e=>{e.preventDefault();const payload={property_id:$('#ap-block-property').value,stay_date:$('#ap-rate-date').value,night_price:Number($('#ap-rate-price').value),note:$('#ap-rate-note').value.trim()};const {error}=await db().from('afra_special_rates').upsert(payload,{onConflict:'property_id,stay_date'});$('#ap-rate-msg').innerHTML=error?banner(error.message,'error'):banner('قیمت ویژه ذخیره شد.','success');if(!error){e.target.reset();loadRates();}});
$('#ap-rate-list').addEventListener('click',async e=>{const btn=e.target.closest('[data-delete-rate]');if(!btn)return;if(!confirm('قیمت ویژه این روز حذف شود؟'))return;const {error}=await db().from('afra_special_rates').delete().eq('property_id',$('#ap-block-property').value).eq('stay_date',btn.dataset.deleteRate);if(error)toast(error.message,true);else loadRates();});loadRates();async function loadHostOrders(){
 const {data,error}=await db().from('reservations').select('id,reservation_code,property_id,check_in,check_out,guest_count,payment_amount,status,payment_status,guest_user_id,created_at').in('property_id',rows.map(x=>x.id)).order('created_at',{ascending:false}).limit(100);
 const panel=$('#ap-host-orders');
 panel.innerHTML=error?banner('خواندن درخواست‌های رزرو ناموفق بود: '+error.message,'error'):(data?.length?data.map(r=>`<article style="padding:12px;border-bottom:1px solid var(--ap-line)">
 <div class="ap-row"><strong>${html(r.reservation_code||r.id)} · ${html(r.status)}</strong><span>${r.payment_amount!==null&&r.payment_amount!==undefined?money(r.payment_amount):'مبلغ نهایی ثبت نشده است'}</span></div>
 <p class="ap-muted">${html(jDate(r.check_in))} تا ${html(jDate(r.check_out))} · ${fmt(r.guest_count)} نفر · پرداخت: ${html(r.payment_status)}</p>
 <div class="ap-inline-actions">${r.guest_user_id?`<a class="ap-btn small secondary" href="messages.html">گفت‌وگو با مسافر</a>`:''}
 ${r.status==='pending'?`<button type="button" class="ap-btn small" data-host-approval="${html(r.id)}" data-yes="1">تأیید امن رزرو</button><button type="button" class="ap-btn small secondary" data-host-approval="${html(r.id)}" data-yes="0">رد درخواست</button>`:''}</div></article>`).join(''):banner('درخواستی برای اقامتگاه‌های شما ثبت نشده است.'));
}
$('#ap-host-orders').addEventListener('click',async e=>{
 const b=e.target.closest('[data-host-approval]');if(!b)return;
 const yes=b.dataset.yes==='1';if(!confirm(yes?'درخواست رزرو تأیید شود؟ تاریخ‌ها در دیتابیس بررسی می‌شوند.':'این درخواست رد شود؟'))return;
 b.disabled=true;let error;
 if(yes)({error}=await db().rpc('confirm_owner_reservation',{p_reservation_id:b.dataset.hostApproval}));
 else ({error}=await db().from('reservations').update({status:'rejected'}).eq('id',b.dataset.hostApproval).eq('status','pending'));
 b.disabled=false;if(error)toast('تغییر وضعیت انجام نشد: '+error.message,true);else{toast('وضعیت رزرو به‌روزرسانی شد');await loadHostOrders();}
});
loadHostOrders();
}
async function hostFinancePage(which='finance'){shell(which==='performance'?'آمار عملکرد میزبان':'درآمد و تسویه میزبان','گزارش‌ها فقط از داده ثبت‌شده و قابل‌خواندن برای میزبان محاسبه می‌شوند.',`<div id="ap-hostfin">${loading()}</div>`,'پنل میزبان');const me=await user(),box=$('#ap-hostfin');if(!me){box.innerHTML=loginNeeded();return;}const {data:p,error}=await db().from('properties').select('id,title').eq('owner_id',me.id);if(error){box.innerHTML=banner(error.message,'error');return;}const ids=(p||[]).map(x=>x.id);if(!ids.length){box.innerHTML=banner('اقامتگاهی متعلق به این حساب ثبت نشده است.');return;}const {data:bookings,error:be}=await db().from('reservations').select('id,property_id,payment_amount,payment_status,status,created_at').in('property_id',ids);if(be){box.innerHTML=banner('گزارش رزروها برای حساب شما قابل خواندن نیست.','error')+linkList([['owner-dashboard.html','پنل میزبان','مدیریت کنونی اقامتگاه‌ها'],['owner-reservations.html','درخواست‌های موجود','سامانه فعلی رزرو']]);return;}
 const rows=bookings||[],paid=rows.filter(x=>x.payment_status==='paid'),total=paid.reduce((s,x)=>s+Number(x.payment_amount||0),0);box.innerHTML=`<div class="ap-grid four"><div class="ap-stat"><strong>${fmt(ids.length)}</strong><small>اقامتگاه‌ها</small></div><div class="ap-stat"><strong>${fmt(rows.length)}</strong><small>درخواست رزرو</small></div><div class="ap-stat"><strong>${fmt(paid.length)}</strong><small>پرداخت‌های تأییدشده</small></div><div class="ap-stat"><strong>${money(total)}</strong><small>مبلغ کل پرداخت‌شده</small></div></div>${section('سوابق رزرو',rows.length?`<div class="ap-table-wrap"><table class="ap-table"><thead><tr><th>تاریخ</th><th>وضعیت رزرو</th><th>پرداخت</th><th>مبلغ</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${new Date(x.created_at).toLocaleDateString('fa-IR')}</td><td>${html(x.status)}</td><td>${html(x.payment_status)}</td><td>${money(x.payment_amount)}</td></tr>`).join('')}</tbody></table></div>`:'هنوز رزروی ثبت نشده است.')}${banner('کارمزد، تسویه و بازپرداخت واقعی نیاز به قرارداد مالی و اتصال امن درگاه/سرویس بانکی در سمت سرور دارد. گزارش فعلی تنها سوابق ثبت‌شده را نشان می‌دهد.')}`;}
function hostRoutePage(which){const pages={add:['افزودن اقامتگاه','ثبت مشخصات، تصاویر و قیمت در پنل میزبان فعلی انجام می‌شود.'],manage:['مدیریت اقامتگاه','ویرایش آگهی، عکس‌ها و غیرفعال‌سازی در پنل میزبان فعلی در دسترس است.']};const [a,b]=pages[which];cardLanding(a,b,[['property-settings.html','تکمیل امکانات اقامتگاه','نوع امکانات و موقعیت تقریبی'],['owner-dashboard.html','ورود به پنل میزبان','مدیریت اقامتگاه‌ها'],['host-calendar.html','تقویم میزبان','مسدودکردن روزها'],['owner-reservations.html','درخواست‌های رزرو','تأیید یا رد درخواست'],['host-finance.html','گزارش مالی','داده‌های پرداخت تأییدشده']],'میزبانی');}
async function adminPage(which){shell('مدیریت '+({'users':'کاربران','hosts':'میزبان‌ها','properties':'اقامتگاه‌ها','bookings':'رزروها','payments':'پرداخت‌ها','discounts':'تخفیف‌ها','content':'محتوا','support':'پشتیبانی','reviews':'نظرات'}[which]||''),'دسترسی مدیر با تابع امن is_admin و سیاست‌های RLS دیتابیس کنترل می‌شود.',`<div id="ap-admin">${loading()}</div>`,'پنل مدیریت');const box=$('#ap-admin'),me=await user();if(!me){box.innerHTML=loginNeeded();return;}const {data:isAdmin,error:adminError}=await db().rpc('is_admin');if(adminError||isAdmin!==true){box.innerHTML=banner('این حساب مجوز مدیریت ندارد. مجوز از جدول admins و تابع is_admin بررسی می‌شود.','error');return;}
 const map={users:['afra_profiles','user_id,full_name,phone,city,created_at'],hosts:['owner_profiles','*'],properties:['properties','id,title,location,category,is_active,created_at'],bookings:['reservations','id,reservation_code,property_id,status,payment_status,created_at'],payments:['reservations','id,reservation_code,payment_status,payment_amount,payment_reference,created_at'],discounts:['afra_discount_codes','id,code,percent,amount,active,expires_at'],support:['afra_support_tickets','id,subject,category,status,created_at'],reviews:['afra_reviews','id,property_id,score,body,moderation_status,created_at']};
 const links=[['admin.html','داشبورد فعلی','مدیریت درخواست‌ها و آگهی‌ها'],['admin-users.html','کاربران','لیست پروفایل'],['admin-hosts.html','میزبان‌ها','تأیید میزبان'],['admin-properties.html','اقامتگاه‌ها','آگهی‌ها'],['admin-bookings.html','رزروها','وضعیت رزرو'],['admin-payments.html','پرداخت‌ها','سوابق درگاه'],['admin-discounts.html','تخفیف‌ها','مدیریت کد'],['admin-support.html','پشتیبانی','درخواست‌ها'],['admin-reviews.html','نظرات','بررسی و تأیید']];
 if(which==='content'){box.innerHTML=linkList([['index.html','بنر و محتوا','متن و چیدمان صفحه اصلی'],['faq.html','سؤالات متداول','محتوای راهنما'],['magazine.html','مجله','مطالب سفر']]);return;}
 if(which==='support'){
  box.innerHTML=`<section class="ap-panel"><div class="ap-row"><h2>تیکت‌های پشتیبانی</h2><button class="ap-btn small secondary" id="ap-admin-refresh" type="button">تازه‌سازی</button></div><div id="ap-admin-tickets">${loading()}</div></section>`;
  async function reloadTickets(){const {data,error}=await db().from('afra_support_tickets').select('id,user_id,subject,category,message,status,admin_reply,created_at').order('created_at',{ascending:false}).limit(100);const target=$('#ap-admin-tickets');if(error){target.innerHTML=banner(error.message,'error');return;}target.innerHTML=data?.length?data.map(t=>`<article class="ap-callout" style="margin:12px 0"><h3>${html(t.subject)} · ${html(t.status)}</h3><small class="ap-muted">کاربر ${html(t.user_id)} · ${new Date(t.created_at).toLocaleString('fa-IR')}</small><p>${html(t.message)}</p><form class="ap-stack" data-ticket="${html(t.id)}"><label class="ap-field">پاسخ مدیریت<textarea name="reply" maxlength="4000" placeholder="پاسخ رسمی پشتیبانی">${html(t.admin_reply||'')}</textarea></label><label class="ap-field">وضعیت<select name="status">${[['open','باز'],['in_progress','در حال بررسی'],['closed','بسته']].map(([v,title])=>`<option value="${v}" ${t.status===v?'selected':''}>${title}</option>`).join('')}</select></label><button class="ap-btn small" type="submit">ذخیره پاسخ و وضعیت</button><div class="ap-ticket-result" role="status"></div></form></article>`).join(''):banner('تیکتی ثبت نشده است.');}
  await reloadTickets();$('#ap-admin-refresh').addEventListener('click',reloadTickets);
  box.addEventListener('submit',async event=>{const form=event.target.closest('form[data-ticket]');if(!form)return;event.preventDefault();const btn=form.querySelector('button[type="submit"]');btn.disabled=true;const {error}=await db().from('afra_support_tickets').update({admin_reply:form.elements.reply.value.trim()||null,status:form.elements.status.value,updated_at:new Date().toISOString()}).eq('id',form.dataset.ticket);btn.disabled=false;form.querySelector('.ap-ticket-result').innerHTML=error?banner('ثبت پاسخ ناموفق: '+error.message,'error'):banner('پاسخ و وضعیت ذخیره شد.','success');});
  return;
 }

 const [table,cols]=map[which];const {data,error}=await db().from(table).select(cols).limit(100);box.innerHTML=`<div class="ap-panel" style="margin-bottom:20px">${linkList(links)}</div>${error?banner('امکان خواندن جدول وجود ندارد: '+error.message,'error'):`<section class="ap-panel"><h2>آخرین رکوردها (حداکثر ۱۰۰)</h2>${(data||[]).length?`<div class="ap-table-wrap"><table class="ap-table"><thead><tr>${Object.keys(data[0]).map(k=>`<th>${html(k)}</th>`).join('')}</tr></thead><tbody>${data.map(r=>`<tr>${Object.values(r).map(v=>`<td>${html(typeof v==='object'?JSON.stringify(v):v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:banner('رکوردی ثبت نشده است.')}</section>`}${which==='reviews'?'<div class="ap-panel"><h2>تأیید / رد نظر</h2><form id="ap-review-mod" class="ap-form-grid"><label class="ap-field">شناسه نظر<input id="ap-mod-id" required placeholder="UUID"></label><label class="ap-field">تصمیم<select id="ap-mod-status"><option value="approved">تأیید</option><option value="rejected">رد</option></select></label><button class="ap-btn" type="submit">ثبت تصمیم</button></form><div id="ap-mod-msg"></div></div>':''}${banner('برای عملیات حساس مانند تأیید پرداخت، احراز هویت و استرداد وجه، فقط ابزارهای امن سروری قابل استفاده‌اند. این صفحات اجازه جعل تراکنش ندارند.')}`;if(which==='reviews'&&!error){$('#ap-review-mod').addEventListener('submit',async e=>{e.preventDefault();const {error}=await db().from('afra_reviews').update({moderation_status:$('#ap-mod-status').value,moderated_at:new Date().toISOString()}).eq('id',$('#ap-mod-id').value.trim());$('#ap-mod-msg').innerHTML=error?banner(error.message,'error'):banner('وضعیت نظر به‌روزرسانی شد.','success');});}}
// Dedicated administrator-only bank transfer verification. No browser-side paid updates.
async function adminPaymentsPage(){
 shell('مدیریت پرداخت‌ها','مرحله اول: ثبت دریافت رسید کارت‌به‌کارت؛ مرحله دوم: بررسی تراکنش بانکی و تأیید واریز.',`<div id="ap-payments-admin" class="ap-payments-admin">${loading()}</div>`,'پنل مدیریت');
 const box=$('#ap-payments-admin');
 if(!db()){box.innerHTML=missingDb();return;}
 const me=await user();if(!me){box.innerHTML=loginNeeded();return;}
 const {data:isAdmin,error:adminError}=await db().rpc('is_admin');
 if(adminError||isAdmin!==true){box.innerHTML=banner('دسترسی به تأیید پرداخت فقط برای مدیر مجاز است.','error');return;}
 box.innerHTML=`<div class="ap-payments-links"><a class="ap-btn secondary small" href="admin.html">داشبورد مدیریت</a><a class="ap-btn secondary small" href="admin-bookings.html">سوابق رزروها</a></div>
 <div class="ap-callout ap-payment-notice"><strong>پرداخت کارت‌به‌کارت؛ ۳۰ دقیقه واریز + ۴۰ دقیقه بررسی</strong><p>مسافر از لحظه تأیید درخواست، ۳۰ دقیقه فرصت واریز و ارسال رسید دارد. وقتی تصویر رسید را در واتس‌اپ/تلگرام دریافت کردید، با دکمه «رسید دریافت شد» دریافت آن را ثبت کنید تا فرصت بررسی ۴۰ دقیقه‌ای شروع شود. رسید به‌تنهایی اثبات واریز نیست؛ بعد از تطبیق با تراکنش واقعی بانک، «تأیید نهایی واریز» را بزنید. اگر بررسی بیش از ۴۰ دقیقه طول بکشد، رزرو دارای رسید منقضی نمی‌شود و برای پیگیری مدیر باقی می‌ماند.</p></div>
 <section class="ap-panel ap-payments-board"><div class="ap-payments-titlebar"><div><h2>بررسی پرداخت رزروها</h2><p class="ap-muted">ثبت رسید و تأیید واریز دو اقدام مجزا هستند و فقط برای مدیر سایت نمایش داده می‌شوند.</p></div><button type="button" class="ap-btn secondary" id="ap-payments-refresh">↻ تازه‌سازی</button></div>
 <div id="ap-payments-stats" class="ap-payments-stats" aria-label="آمار پرداخت‌ها"></div>
 <div class="ap-payments-filter"><label class="ap-field">وضعیت نمایش<select id="ap-payments-filter"><option value="review">اقدام لازم</option><option value="receipt">رسیدهای در انتظار بررسی</option><option value="unpaid">در انتظار دریافت رسید</option><option value="paid">پرداخت‌های تأییدشده</option><option value="all">تمام رزروها</option></select></label><label class="ap-field">جست‌وجوی کد رزرو یا اقامتگاه<input id="ap-payments-search" type="search" autocomplete="off" placeholder="مثلاً AFRA-..."></label></div>
 <div id="ap-payments-list" class="ap-payments-list" aria-live="polite">${loading()}</div></section>
 <div id="ap-payments-feedback" role="status" aria-live="polite"></div>
 <dialog id="ap-receipt-confirm" class="ap-payments-dialog" aria-labelledby="ap-receipt-dialog-title"><form id="ap-receipt-form" class="ap-stack"><div class="ap-payments-dialog-head"><h2 id="ap-receipt-dialog-title">ثبت دریافت رسید</h2><button type="button" class="ap-payments-close" id="ap-receipt-cancel-top" aria-label="بستن پنجره">×</button></div><div id="ap-receipt-selected" class="ap-payment-summary"></div><div class="ap-callout ap-payment-warning">این مرحله فقط دریافت تصویر رسید را ثبت می‌کند و <strong>پرداخت را تأیید نمی‌کند</strong>. مهلت بررسی مدیر از همین لحظه ۴۰ دقیقه خواهد بود؛ حتی پس از پایان این مهلت، رزرو دارای رسید برای تصمیم مدیر باقی می‌ماند.</div><label class="ap-payment-check"><input id="ap-receipt-checked" type="checkbox" required> <span>تصویر رسید مربوط به همین کد رزرو را واقعاً در واتس‌اپ یا تلگرام دریافت و بررسی اولیه کرده‌ام.</span></label><label class="ap-field">برای ثبت دریافت، کد کامل رزرو را وارد کنید<input id="ap-receipt-code" type="text" autocomplete="off" spellcheck="false" dir="ltr" required placeholder="AFRA-..."></label><div id="ap-receipt-dialog-error" role="alert"></div><div class="ap-payments-dialog-actions"><button type="button" class="ap-btn secondary" id="ap-receipt-cancel">انصراف</button><button type="submit" class="ap-btn" id="ap-receipt-submit" disabled>ثبت دریافت رسید و آغاز بررسی ۴۰ دقیقه‌ای</button></div></form></dialog>
 <dialog id="ap-payments-confirm" class="ap-payments-dialog" aria-labelledby="ap-payments-dialog-title"><form id="ap-payments-form" class="ap-stack"><div class="ap-payments-dialog-head"><h2 id="ap-payments-dialog-title">تأیید دریافت وجه</h2><button type="button" class="ap-payments-close" id="ap-payments-cancel-top" aria-label="بستن پنجره">×</button></div><div id="ap-payments-selected" class="ap-payment-summary"></div><div class="ap-callout ap-payment-warning">این عملیات وضعیت پرداخت را در دیتابیس به <code>paid</code> تغییر می‌دهد. تنها بعد از مشاهده تراکنش قطعی در حساب بانکی انجام شود.</div><label class="ap-payment-check"><input id="ap-payments-checked" type="checkbox" required> <span>ورود وجه، کد رزرو و مبلغ را با گردش واقعی حساب بانکی تطبیق داده‌ام.</span></label><label class="ap-field">برای تأیید، کد کامل رزرو را وارد کنید<input id="ap-payments-code" type="text" autocomplete="off" spellcheck="false" dir="ltr" required placeholder="AFRA-..."></label><div id="ap-payments-dialog-error" role="alert"></div><div class="ap-payments-dialog-actions"><button type="button" class="ap-btn secondary" id="ap-payments-cancel">انصراف</button><button type="submit" class="ap-btn" id="ap-payments-submit" disabled>تأیید نهایی واریز</button></div></form></dialog>`;
 const $box=s=>$(s,box);
 const stats=$box('#ap-payments-stats'),list=$box('#ap-payments-list'),feedback=$box('#ap-payments-feedback');
 const selector=$box('#ap-payments-filter'),search=$box('#ap-payments-search');
 const dialog=$box('#ap-payments-confirm'),form=$box('#ap-payments-form'),check=$box('#ap-payments-checked'),typed=$box('#ap-payments-code'),submit=$box('#ap-payments-submit');
 const receiptDialog=$box('#ap-receipt-confirm'),receiptForm=$box('#ap-receipt-form'),receiptCheck=$box('#ap-receipt-checked'),receiptCode=$box('#ap-receipt-code'),receiptSubmit=$box('#ap-receipt-submit');
 let records=[],selected=null,sending=false,selectedReceipt=null,receiptSending=false,requestSeq=0;
 const resName={pending:'در انتظار بررسی',confirmed:'تأییدشده',rejected:'ردشده',cancelled:'لغوشده',expired:'منقضی‌شده'};
 const payName={unpaid:'پرداخت‌نشده',receipt_submitted:'رسید ثبت‌شده',paid:'واریز تأیید شد',failed:'ناموفق'};
 const readableTime=x=>{if(!x)return '—';const d=new Date(x);return Number.isNaN(d.getTime())?'—':d.toLocaleString('fa-IR');};
 const hasPrice=r=>Number.isFinite(Number(r.payment_amount))&&Number(r.payment_amount)>0;
 const timePending=r=>!!r.payment_deadline_at&&new Date(r.payment_deadline_at).getTime()>Date.now();
 const canRecordReceipt=r=>r.status==='confirmed'&&r.payment_status==='unpaid'&&hasPrice(r)&&timePending(r);
 const canConfirmPayment=r=>r.status==='confirmed'&&r.payment_status==='receipt_submitted'&&hasPrice(r);
 const eligible=r=>canRecordReceipt(r)||canConfirmPayment(r);
 const price=r=>Number(r.payment_amount)>0?money(r.payment_amount):'مبلغ ثبت نشده';
 const badge=r=>r.payment_status==='paid'?'ap-payment-paid':eligible(r)?'ap-payment-waiting':'ap-payment-disabled';
 function render(){
  const counts={receipt:records.filter(canConfirmPayment).length,unpaid:records.filter(canRecordReceipt).length,paid:records.filter(r=>r.payment_status==='paid').length,total:records.length};
  stats.innerHTML=`<div class="ap-stat"><strong>${fmt(counts.unpaid)}</strong><small>منتظر ثبت رسید</small></div><div class="ap-stat"><strong>${fmt(counts.receipt)}</strong><small>رسیدهای نیازمند بررسی</small></div><div class="ap-stat"><strong>${fmt(counts.paid)}</strong><small>پرداخت‌های تأییدشده</small></div><div class="ap-stat"><strong>${fmt(counts.total)}</strong><small>رزروهای خوانده‌شده</small></div>`;
  const term=search.value.trim().toLowerCase();const filtered=records.filter(r=>(selector.value==='all'||(selector.value==='paid'?r.payment_status==='paid':selector.value==='receipt'?canConfirmPayment(r):selector.value==='unpaid'?canRecordReceipt(r):eligible(r)))&&(!term||[r.reservation_code,r.property_title,r.guest_name].some(x=>String(x||'').toLowerCase().includes(term))));
  list.innerHTML=filtered.length?filtered.map(r=>{
   const deadline=r.payment_deadline_at?new Date(r.payment_deadline_at).getTime():NaN;
   const reviewDue=r.receipt_review_deadline_at?new Date(r.receipt_review_deadline_at).getTime():NaN;
   const afterDepositDeadline=r.status==='confirmed'&&r.payment_status==='unpaid'&&Number.isFinite(deadline)&&deadline<=Date.now();
   const reviewOverdue=canConfirmPayment(r)&&Number.isFinite(reviewDue)&&reviewDue<=Date.now();
   const receiptAction=canRecordReceipt(r),finalAction=canConfirmPayment(r);
   return `<article class="ap-payment-item" data-payment-id="${html(r.id)}"><div class="ap-payment-item-head"><div><div class="ap-payment-code" dir="ltr">${html(r.reservation_code||r.id)}</div><h3>${html(r.property_title||'اقامتگاه ثبت‌شده')}</h3></div><span class="ap-payment-status ${badge(r)}">${html(payName[r.payment_status]||r.payment_status||'نامشخص')}</span></div>
    <div class="ap-payment-item-grid"><div><small>مبلغ قابل پرداخت</small><strong class="ap-payment-amount">${price(r)}</strong></div><div><small>وضعیت رزرو</small><strong>${html(resName[r.status]||r.status||'—')}</strong></div><div><small>نام مسافر</small><strong>${html(r.guest_name||'—')}</strong></div><div><small>تاریخ ورود تا خروج</small><strong>${html(jDate(r.check_in))} تا ${html(jDate(r.check_out))}</strong></div><div><small>مهلت واریز (۳۰ دقیقه)</small><strong>${html(readableTime(r.payment_deadline_at))}</strong></div><div><small>ثبت دریافت رسید</small><strong>${html(readableTime(r.receipt_submitted_at))}</strong></div><div><small>مهلت بررسی رسید (۴۰ دقیقه)</small><strong class="${reviewOverdue?'ap-payment-urgent':''}">${html(readableTime(r.receipt_review_deadline_at))}</strong></div><div><small>تأیید واریز در سیستم</small><strong>${html(readableTime(r.payment_paid_at))}</strong></div></div>
    ${afterDepositDeadline?'<p class="ap-payment-warning-inline">مهلت ۳۰ دقیقه‌ای ثبت دریافت رسید تمام شده است؛ این رزرو دیگر از مسیر عادی قابل ثبت رسید نیست.</p>':''}
    ${reviewOverdue?'<p class="ap-payment-warning-inline ap-payment-urgent-notice" role="status">⚠️ مهلت ۴۰ دقیقه‌ای بررسی رسید گذشته است. این رزرو خودکار منقضی نمی‌شود؛ لطفاً در اولویت بررسی بانک قرار دهید.</p>':''}
    <div class="ap-payment-item-actions">${receiptAction?`<button type="button" class="ap-btn ap-payment-receipt" data-receipt-payment="${html(r.id)}">📩 رسید دریافت شد</button>`:''}${finalAction?`<button type="button" class="ap-btn ap-payment-review" data-verify-payment="${html(r.id)}">✓ بررسی و تأیید نهایی واریز</button>`:''}${!receiptAction&&!finalAction?`<span class="ap-muted">${r.payment_status==='paid'?'پرداخت قبلاً تأیید شده است.':r.payment_status==='receipt_submitted'?'رسید در صف بررسی قرار دارد.':'این رزرو اکنون قابل اقدام پرداخت نیست.'}</span>`:''}</div></article>`;
  }).join(''):`<div class="ap-empty">${selector.value==='review'?'در حال حاضر رزروی با اقدام قابل انجام وجود ندارد.':'موردی مطابق فیلتر و جست‌وجو پیدا نشد.'}</div>`;
 }
 async function reload(){const seq=++requestSeq;const btn=$box('#ap-payments-refresh');btn.disabled=true;list.innerHTML=loading();feedback.innerHTML='';
  try{
   const {data,error}=await db().from('reservations').select('id,reservation_code,property_id,guest_name,check_in,check_out,status,payment_status,payment_amount,payment_deadline_at,receipt_submitted_at,receipt_review_deadline_at,payment_paid_at,payment_method,created_at').order('created_at',{ascending:false}).limit(150);
   if(error)throw error;
   const rows=data||[],ids=[...new Set(rows.map(r=>r.property_id).filter(Boolean))],titles={};
   if(ids.length){const p=await db().from('properties').select('id,title').in('id',ids);if(!p.error)(p.data||[]).forEach(x=>titles[x.id]=x.title);}
   if(seq!==requestSeq)return;
   records=rows.map(r=>({...r,property_title:titles[r.property_id]||'اقامتگاه'}));render();
  }catch(e){list.innerHTML=banner('دریافت رزروها موفق نبود: '+(e?.message||'خطای ارتباط'),'error');}
  finally{if(seq===requestSeq)btn.disabled=false;}
 }
 function closeReceiptDialog(){if(receiptSending)return;if(receiptDialog.open)receiptDialog.close();selectedReceipt=null;}
 function validReceipt(){const valid=!!selectedReceipt&&receiptCheck.checked&&receiptCode.value.trim().toUpperCase()===String(selectedReceipt.reservation_code||'').toUpperCase()&&!receiptSending;receiptSubmit.disabled=!valid;return valid;}
 $box('#ap-receipt-cancel').addEventListener('click',closeReceiptDialog);$box('#ap-receipt-cancel-top').addEventListener('click',closeReceiptDialog);
 receiptDialog.addEventListener('cancel',e=>{if(receiptSending)e.preventDefault();else selectedReceipt=null;});
 receiptCheck.addEventListener('change',validReceipt);receiptCode.addEventListener('input',validReceipt);
 list.addEventListener('click',e=>{const btn=e.target.closest('[data-receipt-payment]');if(!btn)return;
  const row=records.find(x=>x.id===btn.dataset.receiptPayment);if(!row||!canRecordReceipt(row))return;
  selectedReceipt=row;receiptCheck.checked=false;receiptCode.value='';$box('#ap-receipt-dialog-error').innerHTML='';
  $box('#ap-receipt-selected').innerHTML=`<div>رزرو <b dir="ltr">${html(row.reservation_code)}</b></div><div>اقامتگاه: <strong>${html(row.property_title)}</strong></div><div>مبلغ اعلام‌شده: <strong>${price(row)}</strong></div><div>مهلت دریافت رسید: <strong>${html(readableTime(row.payment_deadline_at))}</strong></div>`;
  validReceipt();receiptDialog.showModal();receiptCheck.focus();
 });
 receiptForm.addEventListener('submit',async e=>{e.preventDefault();if(!validReceipt())return;
  receiptSending=true;receiptSubmit.disabled=true;$box('#ap-receipt-dialog-error').innerHTML='';
  try{
   const {data:latest,error:lookupError}=await db().from('reservations').select('id,reservation_code,status,payment_status,payment_amount,payment_deadline_at').eq('id',selectedReceipt.id).maybeSingle();
   if(lookupError||!latest||!canRecordReceipt(latest)||latest.reservation_code!==selectedReceipt.reservation_code)throw new Error('مهلت ثبت رسید تمام شده یا وضعیت رزرو تغییر کرده است. تازه‌سازی کنید.');
   const {data:ok,error}=await db().rpc('admin_mark_card_transfer_receipt_received',{p_reservation_id:selectedReceipt.id});
   if(error)throw error;if(ok!==true)throw new Error('ثبت دریافت رسید از سوی سرور پذیرفته نشد؛ ممکن است مهلت واریز پایان یافته باشد.');
   receiptDialog.close();selectedReceipt=null;
   await reload();feedback.innerHTML=banner('دریافت رسید ثبت شد و مهلت بررسی ۴۰ دقیقه‌ای شروع شد. این مرحله تأیید پرداخت نیست؛ تراکنش را در بانک بررسی کنید.','success');
  }catch(err){$box('#ap-receipt-dialog-error').innerHTML=banner('ثبت رسید ناموفق بود: '+(err?.message||'خطای سرور'),'error');}
  finally{receiptSending=false;validReceipt();}
 });
 function closeDialog(){if(sending)return;if(dialog.open)dialog.close();selected=null;}
 function validConfirm(){const valid=!!selected&&check.checked&&typed.value.trim().toUpperCase()===String(selected.reservation_code||'').toUpperCase()&&!sending;submit.disabled=!valid;return valid;}
 $box('#ap-payments-cancel').addEventListener('click',closeDialog);$box('#ap-payments-cancel-top').addEventListener('click',closeDialog);
 dialog.addEventListener('cancel',e=>{if(sending)e.preventDefault();else selected=null;});
 check.addEventListener('change',validConfirm);typed.addEventListener('input',validConfirm);
 list.addEventListener('click',e=>{const btn=e.target.closest('[data-verify-payment]');if(!btn)return;
  const row=records.find(x=>x.id===btn.dataset.verifyPayment);if(!row||!canConfirmPayment(row))return;
  selected=row;check.checked=false;typed.value='';$box('#ap-payments-dialog-error').innerHTML='';
  $box('#ap-payments-selected').innerHTML=`<div>رزرو <b dir="ltr">${html(row.reservation_code)}</b></div><div>اقامتگاه: <strong>${html(row.property_title)}</strong></div><div>مبلغ برای تطبیق با بانک: <strong>${price(row)}</strong></div><div>وضعیت کنونی: <strong>${html(payName[row.payment_status]||'—')}</strong></div>`;
  validConfirm();dialog.showModal();check.focus();
 });
 form.addEventListener('submit',async e=>{e.preventDefault();if(!validConfirm())return;
  sending=true;submit.disabled=true;$box('#ap-payments-dialog-error').innerHTML='';
  try{
   const {data:latest,error:lookupError}=await db().from('reservations').select('id,reservation_code,status,payment_status,payment_amount').eq('id',selected.id).maybeSingle();
   if(lookupError||!latest||!canConfirmPayment(latest)||latest.reservation_code!==selected.reservation_code){throw new Error('وضعیت رزرو تغییر کرده است. صفحه را تازه‌سازی و دوباره بررسی کنید.');}
   const {data:ok,error}=await db().rpc('admin_mark_reservation_paid',{p_reservation_id:selected.id});
   if(error)throw error;if(ok!==true)throw new Error('سرور تأیید پرداخت را نپذیرفت؛ ممکن است وضعیت رزرو تغییر کرده باشد.');
   dialog.close();selected=null;feedback.innerHTML=banner('تأیید واریز در Supabase ثبت شد. ارسال پیام نهایی تلگرام به تنظیم مسیر پرداخت‌شده در Make نیاز دارد.','success');
   await reload();feedback.innerHTML=banner('واریز تأیید و در Supabase ثبت شد. برای پیام قطعی‌شدن رزرو، مسیر وضعیت paid را در Make تکمیل کنید.','success');
  }catch(err){$box('#ap-payments-dialog-error').innerHTML=banner('تأیید ناموفق بود: '+(err?.message||'خطای سرور'),'error');}
  finally{sending=false;validConfirm();}
 });
 selector.addEventListener('change',render);search.addEventListener('input',render);$box('#ap-payments-refresh').addEventListener('click',reload);
 // Keep receipt and deposit deadline warnings current while the administration panel remains open.
 const deadlineRefresh=setInterval(()=>{if(!document.hidden&&records.length)render();},30000);
 window.addEventListener('pagehide',()=>clearInterval(deadlineRefresh),{once:true});
 await reload();
}

async function messagesPage(){
 shell('گفت‌وگوی مسافر و میزبان','گفت‌وگوها به رزرو واقعی متصل‌اند و فقط مسافر و میزبان همان رزرو به پیام‌ها دسترسی دارند.',`<div id="ap-msg" class="ap-stack">${loading()}</div>`,'پیام‌ها');
 const me=await user(),el=$('#ap-msg');if(!me){el.innerHTML=loginNeeded();return;}
 let activeId=q('thread'),requestedReservation=q('reservation_id');
 if(requestedReservation){
  if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(requestedReservation)){el.innerHTML=banner('شناسه رزرو نامعتبر است.','error');return;}
  const existing=await db().from('afra_conversations').select('id').eq('reservation_id',requestedReservation).maybeSingle();
  if(!existing.error&&existing.data)activeId=existing.data.id;
  else{
   const r=await db().from('reservations').select('id,property_id,status,guest_user_id').eq('id',requestedReservation).maybeSingle();
   if(r.error||!r.data){el.innerHTML=banner('این رزرو برای حساب شما در دسترس نیست. برای رزروهای قدیمی از صفحه پیگیری رزرو استفاده کنید.','error');return;}
   if(r.data.guest_user_id!==me.id || !['pending','confirmed'].includes(r.data.status)){el.innerHTML=banner('ایجاد گفت‌وگوی جدید فقط برای مسافر صاحب درخواست فعال امکان‌پذیر است.','error');return;}
   const p=await db().from('properties').select('id,owner_id').eq('id',r.data.property_id).maybeSingle();
   if(p.error||!p.data?.owner_id||p.data.owner_id===me.id){el.innerHTML=banner('میزبان معتبری برای این اقامتگاه تعیین نشده است.','error');return;}
   const created=await db().from('afra_conversations').insert({reservation_id:r.data.id,property_id:r.data.property_id,guest_user_id:me.id,owner_user_id:p.data.owner_id}).select('id').single();
   if(created.error){const retry=await db().from('afra_conversations').select('id').eq('reservation_id',requestedReservation).maybeSingle();if(retry.error||!retry.data){el.innerHTML=banner('شروع گفت‌وگو ناموفق بود: '+created.error.message,'error');return;}activeId=retry.data.id;}
   else activeId=created.data.id;
  }
 }
 const {data:threads,error}=await db().from('afra_conversations').select('id,property_id,reservation_id,guest_user_id,owner_user_id,created_at').order('created_at',{ascending:false}).limit(100);
 if(error){el.innerHTML=banner('دریافت گفت‌وگوها ممکن نشد: '+error.message,'error');return;}
 const rows=threads||[];if(!rows.length){el.innerHTML=banner('هنوز گفت‌وگویی در حساب شما موجود نیست. ابتدا یک رزرو با همین حساب ثبت کنید.')+'<p><a href="account-bookings.html" class="ap-btn">رزروهای حساب من</a></p>';return;}
 if(!rows.some(x=>x.id===activeId))activeId=rows[0].id;
 const {data:places}=await db().from('properties').select('id,title').in('id',[...new Set(rows.map(x=>x.property_id))]);
 const titles=new Map((places||[]).map(x=>[x.id,x.title]));
 const threadLinks=rows.map(t=>`<button class="ap-btn ${t.id===activeId?'':'secondary'}" type="button" data-conv="${html(t.id)}" aria-pressed="${String(t.id===activeId)}">${html(titles.get(t.property_id)||'اقامتگاه')} · ${t.guest_user_id===me.id?'گفت‌وگو با میزبان':'گفت‌وگو با مسافر'}</button>`).join('');
 el.innerHTML=`<div class="ap-grid two" style="align-items:start"><section class="ap-panel"><h2>گفت‌وگوهای من</h2><div class="ap-stack" id="ap-threads">${threadLinks}</div><p class="ap-muted">پیام‌ها فقط برای طرفین همین رزرو نمایش داده می‌شوند.</p></section>
 <section class="ap-panel"><h2>پیام‌های گفت‌وگو</h2><div id="ap-message-list" class="ap-stack" aria-live="polite">${loading()}</div><form id="ap-send" class="ap-stack" style="margin-top:14px"><label class="ap-field">متن پیام<textarea id="ap-send-body" required minlength="1" maxlength="3000"></textarea></label><div class="ap-inline-actions"><button class="ap-btn" type="submit">ارسال پیام</button><button class="ap-btn secondary" type="button" id="ap-refresh">به‌روزرسانی پیام‌ها</button></div><div id="ap-send-status" role="status"></div></form></section></div>`;
 async function loadMessages(){
  const target=$('#ap-message-list');if(!target)return;
  const {data,error}=await db().from('afra_messages').select('id,sender_user_id,body,created_at').eq('conversation_id',activeId).order('created_at',{ascending:true}).limit(200);
  if(error){target.innerHTML=banner('خواندن پیام‌ها ممکن نشد: '+error.message,'error');return;}
  target.innerHTML=(data?.length?data.map(m=>`<article class="ap-chat-bubble ${m.sender_user_id===me.id?'mine':''}"><p>${html(m.body)}</p><small>${new Date(m.created_at).toLocaleString('fa-IR')}</small></article>`).join(''):banner('پیامی ثبت نشده است. نخستین پیام را ارسال کنید.'));
 }
 $('#ap-threads').addEventListener('click',e=>{const b=e.target.closest('[data-conv]');if(!b)return;activeId=b.dataset.conv;$$('[data-conv]',$('#ap-threads')).forEach(x=>{x.classList.toggle('secondary',x.dataset.conv!==activeId);x.setAttribute('aria-pressed',String(x.dataset.conv===activeId));});history.replaceState(null,'',`messages.html?thread=${encodeURIComponent(activeId)}`);loadMessages();});
 $('#ap-refresh').addEventListener('click',loadMessages);
 // افزونه تازه‌سازی خودکار: RLS در هر درخواست مجدداً اعمال می‌شود.
 // Polling تا زمانی که صفحه باز و قابل مشاهده است اجرا می‌شود؛ بدون تکیه بر Realtime publication.
 const autoRefresh=setInterval(()=>{if(document.visibilityState==='visible' && !document.hidden)loadMessages();},12000);
 window.addEventListener('pagehide',()=>clearInterval(autoRefresh),{once:true});

 $('#ap-send').addEventListener('submit',async e=>{
  e.preventDefault();const field=$('#ap-send-body'),body=field.value.trim();if(!body||body.length>3000){$('#ap-send-status').innerHTML=banner('متن پیام معتبر نیست.','error');return;}
  const btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;
  const {error}=await db().from('afra_messages').insert({conversation_id:activeId,sender_user_id:me.id,body});btn.disabled=false;
  $('#ap-send-status').innerHTML=error?banner('ارسال پیام انجام نشد: '+error.message,'error'):banner('پیام ثبت شد.','success');if(!error){field.value='';loadMessages();}
 });
 await loadMessages();
}
async function mySearchesPage(){shell('جست‌وجوهای ذخیره‌شده','فیلترهای مورد علاقه خود را دوباره باز کن.',`<div id="ap-searches">${loading()}</div>`,'حساب مسافر');const me=await user(),el=$('#ap-searches');if(!me){el.innerHTML=loginNeeded();return;}const {data,error}=await db().from('afra_search_history').select('id,query_params,created_at').eq('user_id',me.id).order('created_at',{ascending:false}).limit(50);el.innerHTML=error?banner('لیست جست‌وجوها پس از اجرای SQL توسعه فعال می‌شود.','error'):(data?.length?data.map(item=>{const qp=new URLSearchParams(item.query_params||{}).toString();return `<div class="ap-panel ap-row"><div><strong>${new Date(item.created_at).toLocaleString('fa-IR')}</strong><p class="ap-muted">${html(Object.values(item.query_params||{}).join(' • ')||'بدون فیلتر')}</p></div><a class="ap-btn" href="search.html?${html(qp)}">تکرار جست‌وجو</a></div>`;}).join(''):banner('جست‌وجوی ذخیره‌شده‌ای وجود ندارد.'));}
async function myReviewsPage(){
 shell('ثبت نظر پس از اقامت','ثبت نظر فقط پس از اقامت پرداخت‌شده و پایان‌یافته با همان حساب مجاز است.',`<div id="ap-myreviews">${loading()}</div>`,'نظرات مسافر');
 const me=await user(),el=$('#ap-myreviews');if(!me){el.innerHTML=loginNeeded();return;}
 const [r,e]=await Promise.all([
  db().from('reservations').select('id,reservation_code,property_id,check_out').eq('guest_user_id',me.id).eq('status','confirmed').eq('payment_status','paid').lte('check_out',newDate()).order('check_out',{ascending:false}),
  db().from('afra_reviews').select('id,reservation_id,score,body,moderation_status,created_at').eq('guest_user_id',me.id).order('created_at',{ascending:false})
 ]);
 if(r.error||e.error){el.innerHTML=banner('خواندن سوابق نظر یا رزرو انجام نشد: '+(r.error?.message||e.error?.message),'error');return;}
 const reviews=e.data||[];const used=new Set(reviews.map(x=>x.reservation_id));const eligible=(r.data||[]).filter(x=>!used.has(x.id));
 el.innerHTML=eligible.length?`<section class="ap-panel"><h2>نظر جدید</h2><form id="ap-review-form" class="ap-stack">
 <label class="ap-field">اقامت انجام‌شده<select id="ap-r-booking">${eligible.map(x=>`<option value="${html(x.id)}">${html(x.reservation_code||x.id)} · خروج ${html(jDate(x.check_out))}</option>`).join('')}</select></label>
 <div class="ap-form-grid">${[['score','امتیاز کلی'],['cleanliness','تمیزی'],['amenities_score','امکانات'],['location_score','موقعیت'],['host_score','برخورد میزبان'],['value_score','ارزش نسبت به قیمت']].map(([id,label])=>`<label class="ap-field">${label}<select id="ap-r-${id}" ${id==='score'?'required':''}><option value="">${id==='score'?'انتخاب امتیاز':'اختیاری'}</option>${[1,2,3,4,5].map(i=>`<option value="${i}">${fmt(i)} ستاره</option>`).join('')}</select></label>`).join('')}</div>
 <label class="ap-field">توضیح تجربه اقامت<textarea id="ap-r-body" required minlength="10" maxlength="3000"></textarea></label>
 <button class="ap-btn" type="submit">ارسال نظر برای بررسی مدیر</button><div id="ap-r-message" role="status"></div></form></section>`:banner('در حال حاضر اقامت پرداخت‌شده و پایان‌یافته‌ای برای ثبت نظر جدید ندارید.');
 if(reviews.length)el.innerHTML+=section('نظرهای ثبت‌شده',`<div class="ap-stack">${reviews.map(x=>`<article class="ap-callout"><strong>امتیاز ${fmt(x.score)} از ۵ · ${html(x.moderation_status)}</strong><p>${html(x.body)}</p><small>${new Date(x.created_at).toLocaleDateString('fa-IR')}</small></article>`).join('')}</div>`);
 if(!eligible.length)return;
 $('#ap-review-form').addEventListener('submit',async ev=>{
  ev.preventDefault();const booking=eligible.find(x=>x.id===$('#ap-r-booking').value);if(!booking)return;
  const payload={reservation_id:booking.id,property_id:booking.property_id,guest_user_id:me.id,body:$('#ap-r-body').value.trim(),score:Number($('#ap-r-score').value)};
  for(const key of ['cleanliness','amenities_score','location_score','host_score','value_score'])payload[key]=$('#ap-r-'+key).value?Number($('#ap-r-'+key).value):null;
  if(payload.body.length<10||payload.score<1||payload.score>5){$('#ap-r-message').innerHTML=banner('امتیاز کلی و متن نظر را بررسی کنید.','error');return;}
  const btn=ev.target.querySelector('button[type="submit"]');btn.disabled=true;
  const {error}=await db().from('afra_reviews').insert(payload);btn.disabled=false;
  $('#ap-r-message').innerHTML=error?banner('ثبت نظر انجام نشد: '+error.message,'error'):banner('نظر برای بررسی مدیر ثبت شد.','success');if(!error)setTimeout(myReviewsPage,900);
 });
}
async function hostReviewsPage(){
 shell('نظرات اقامتگاه‌های من','نظرات ثبت‌شده برای اقامتگاه‌های شما و امکان پاسخ‌گویی به نظرهای منتشرشده.',`<div id="ap-host-reviews">${loading()}</div>`,'بازخورد میزبان');
 const me=await user(),el=$('#ap-host-reviews');if(!me){el.innerHTML=loginNeeded();return;}
 const {data:p,error}=await db().from('properties').select('id,title').eq('owner_id',me.id);
 if(error){el.innerHTML=banner(error.message,'error');return;}
 const ids=(p||[]).map(x=>x.id);if(!ids.length){el.innerHTML=banner('اقامتگاهی متعلق به این حساب پیدا نشد.');return;}
 const {data:reviews,error:err}=await db().from('afra_reviews').select('id,property_id,body,score,moderation_status,created_at').in('property_id',ids).order('created_at',{ascending:false});
 if(err){el.innerHTML=banner('خواندن نظرات ممکن نشد: '+err.message,'error');return;}
 if(!reviews?.length){el.innerHTML=banner('نظری برای اقامتگاه‌های شما ثبت نشده است.');return;}
 const replies=await db().from('afra_review_replies').select('review_id,body').in('review_id',reviews.map(r=>r.id));
 const replyMap=new Map((replies.data||[]).map(r=>[r.review_id,r.body]));
 el.innerHTML=reviews.map(r=>`<article class="ap-panel"><p><span class="ap-rating">${'★'.repeat(Math.max(1,Math.min(5,r.score)))}</span> · <span class="ap-pill">${html(r.moderation_status)}</span></p><p>${html(r.body)}</p>
 ${replyMap.has(r.id)?`<div class="ap-callout"><strong>پاسخ شما</strong><p>${html(replyMap.get(r.id))}</p></div>`:''}
 ${r.moderation_status==='approved'?`<div class="ap-stack"><label class="ap-field">پاسخ میزبان<textarea data-reply-input="${html(r.id)}" maxlength="2000" minlength="2">${html(replyMap.get(r.id)||'')}</textarea></label><button class="ap-btn small" data-reply="${html(r.id)}" type="button">${replyMap.has(r.id)?'ویرایش پاسخ':'ثبت پاسخ'}</button></div>`:'<p class="ap-muted">پس از تأیید نظر توسط مدیر، امکان پاسخ عمومی فعال می‌شود.</p>'}</article>`).join('');
 el.addEventListener('click',async event=>{
  const btn=event.target.closest('[data-reply]');if(!btn)return;
  const id=btn.dataset.reply,body=el.querySelector('[data-reply-input="'+id+'"]')?.value.trim()||'';
  if(body.length<2||body.length>2000){toast('پاسخ باید بین ۲ تا ۲۰۰۰ نویسه باشد.',true);return;}
  btn.disabled=true;
  const r=replyMap.has(id)?await db().from('afra_review_replies').update({body,updated_at:new Date().toISOString()}).eq('review_id',id):await db().from('afra_review_replies').insert({review_id:id,owner_user_id:me.id,body});
  btn.disabled=false;
  if(r.error)toast('ثبت پاسخ ناموفق: '+r.error.message,true);else{toast('پاسخ ذخیره شد');hostReviewsPage();}
 });
}
async function attachPropertyAddon(){if(currentFile!=='property.html')return;const id=q('id');if(!id||!db())return;const main=$('main.container')||$('main');if(!main)return;const sectionEl=document.createElement('section');sectionEl.className='ap-addon';sectionEl.innerHTML=`<div class="ap-panel"><h2>اطلاعات تکمیلی اقامتگاه</h2><div id="ap-property-addon" class="ap-stack">${loading()}</div></div>`;main.after(sectionEl);
 const [{data:s,error},{data:ratings}]=await Promise.all([db().from('afra_property_specs').select('*').eq('property_id',id).maybeSingle(),db().from('afra_reviews').select('score,body,moderation_status').eq('property_id',id).eq('moderation_status','approved')]);
 const el=$('#ap-property-addon');if(error){el.innerHTML=banner('اطلاعات تکمیلی بعد از اجرای migration و تکمیل مشخصات میزبان فعال می‌شود.');return;}
 const data=s||{};const details=[['استان',data.province],['شهر',data.city],['منطقه',data.area],['آدرس تقریبی',data.approximate_address],['تعداد اتاق',data.bedrooms],['تعداد تخت',data.beds],['سرویس بهداشتی',data.toilets],['حمام',data.bathrooms],['متراژ ساختمان',data.building_area?fmt(data.building_area)+' مترمربع':''],['متراژ زمین',data.land_area?fmt(data.land_area)+' مترمربع':''],['ساعت ورود',data.checkin_time],['ساعت خروج',data.checkout_time]];
 const approved=(ratings||[]).filter(x=>x.moderation_status==='approved');el.innerHTML=`<div class="ap-grid four">${details.filter(([_,v])=>v!==null&&v!==undefined&&v!=='').map(([t,v])=>`<div class="ap-stat"><small>${html(t)}</small><strong style="font-size:15px">${html(v)}</strong></div>`).join('')||'<p>اطلاعات تکمیلی ثبت نشده است.</p>'}</div>${data.video_url&&/^https:\/\//i.test(data.video_url)?`<h3>ویدئوی اقامتگاه</h3><video controls preload="metadata" style="width:100%;max-height:420px;border-radius:14px" src="${html(data.video_url)}"></video>`:''}${data.amenities?.length?`<h3>امکانات</h3><div class="ap-pills">${data.amenities.map(a=>`<span class="ap-pill">${html(a)}</span>`).join('')}</div>`:''}${data.house_rules?`<h3>قوانین اختصاصی</h3><p>${html(data.house_rules)}</p>`:''}${data.cancellation_policy?`<h3>شرایط کنسلی</h3><p>${html(data.cancellation_policy)}</p>`:''}${approved.length?`<h3>نظرات تأیید‌شده (${fmt(approved.length)})</h3>${approved.slice(0,5).map(x=>`<div class="ap-panel"><span class="ap-rating">${'★'.repeat(Number(x.score))}</span><p>${html(x.body)}</p></div>`).join('')}`:'<p class="ap-muted">نظر تأییدشده‌ای وجود ندارد.</p>'}<div class="ap-addon-actions"><a class="ap-btn" href="booking.html?id=${encodeURIComponent(id)}">درخواست رزرو با حساب مسافر</a><button type="button" class="ap-btn secondary" id="ap-share-property">اشتراک‌گذاری</button><a class="ap-btn secondary" href="compare.html">مقایسه اقامتگاه‌ها</a><a class="ap-btn secondary" href="support.html">گزارش مشکل</a></div>`;
 $('#ap-share-property').addEventListener('click',async()=>{try{if(navigator.share)await navigator.share({title:document.title,url:location.href});else{await navigator.clipboard.writeText(location.href);toast('لینک کپی شد')}}catch(_){}});}
function addLegacyLinks(){
 if(currentFile==='index.html'){
  const footer=$('.search-dropdown-footer');if(footer&&!$('#ap-adv-search-link')){const link=document.createElement('a');link.id='ap-adv-search-link';link.href='search.html';link.className='ap-btn secondary';link.textContent='۳۰ فیلتر پیشرفته و نقشه';footer.prepend(link);}
 }
 if(currentFile==='owner-dashboard.html'){
  const main=$('main.container')||$('main');if(main&&!$('#ap-owner-extra')){const block=document.createElement('div');block.id='ap-owner-extra';block.className='ap-addon';block.innerHTML=linkList([['messages.html','گفت‌وگو با مسافران','پیام‌های رزروهای حساب شما'],['host-reviews.html','پاسخ به نظرات','بازخورد اقامتگاه‌ها'],['property-settings.html','جزئیات و امکانات اقامتگاه','تکمیل اطلاعات و قیمت‌های ویژه'],['host-calendar.html','تقویم و محدودیت روزها','مدیریت زمان'],['host-finance.html','گزارش مالی','مشاهده پرداخت‌های معتبر'],['host-performance.html','آمار اقامتگاه','وضعیت عملکرد']]);main.prepend(block)}
 }
 if(currentFile==='admin.html'){const main=$('main')||$('body');const block=document.createElement('div');block.id='ap-admin-extra';block.className='ap-addon';block.innerHTML=linkList([['admin-users.html','مدیریت کاربران','پروفایل‌ها'],['admin-bookings.html','رزروها','سوابق جدید'],['admin-support.html','تیکت‌های پشتیبانی','پیگیری شکایات'],['admin-reviews.html','مدیریت نظرات','بررسی نظرهای واقعی'],['admin-discounts.html','کدهای تخفیف','تنظیم قوانین تخفیف']]);main.prepend(block)}
}
function directLinksPage(){const map={"booking":"booking","payment":"payment","result":"result","voucher":"voucher"};bookingPage();}

async function propertySpecsPage(){shell('تکمیل اطلاعات اقامتگاه','میزبان می‌تواند اطلاعات جست‌وجو، امکانات، قیمت‌های مناسبتی، مختصات تقریبی و قوانین را ثبت و ویرایش کند.',`<div id="ap-specs">${loading()}</div>`,'ویرایش اقامتگاه');
const me=await user(),box=$('#ap-specs');if(!me){box.innerHTML=loginNeeded();return;}const {data, error}=await db().from('properties').select('id,title,owner_id').eq('owner_id',me.id);if(error){box.innerHTML=banner(error.message,'error');return;}const rows=data||[];if(!rows.length){box.innerHTML=banner('هیچ اقامتگاهی برای حساب فعلی یافت نشد.')+'<a class="ap-btn" href="owner-dashboard.html">ثبت اقامتگاه</a>';return;}
const chosen=q('id')&&rows.find(r=>r.id===q('id'))?q('id'):rows[0].id;
const bools=EXTRAS.filter(([v])=>!['discounted','high_rating'].includes(v));
const normal=[['province','استان','text'],['city','شهر','text'],['area','منطقه یا روستا','text'],['approximate_address','آدرس حدودی (بدون پلاک و جزئیات خصوصی)','text'],['lat','عرض جغرافیایی تقریبی','number'],['lng','طول جغرافیایی تقریبی','number'],['bedrooms','اتاق خواب','number'],['beds','تخت','number'],['toilets','سرویس بهداشتی','number'],['bathrooms','حمام','number'],['building_area','متراژ بنا','number'],['land_area','متراژ زمین','number'],['building_type','نوع ساختمان','text'],['video_url','لینک ویدئوی اقامتگاه (HTTPS)','url'],['standard_capacity','ظرفیت استاندارد','number'],['max_capacity','حداکثر ظرفیت','number'],['checkin_time','ساعت ورود','time'],['checkout_time','ساعت خروج','time'],['weekend_price','قیمت آخر هفته به تومان','number'],['holiday_price','قیمت روز تعطیل به تومان','number'],['extra_guest_price','هزینه نفر اضافه به تومان','number'],['discount_percent','درصد تخفیف','number'],['long_stay_discount_percent','تخفیف اقامت طولانی (درصد)','number']];
box.innerHTML=`<section class="ap-panel"><label class="ap-field" style="max-width:420px">انتخاب اقامتگاه<select id="ap-spec-property">${rows.map(r=>`<option value="${html(r.id)}" ${r.id===chosen?'selected':''}>${html(r.title)}</option>`).join('')}</select></label><div id="ap-spec-status" role="status" style="margin-top:12px"></div><form id="ap-spec-form" class="ap-stack"><div class="ap-form-grid">${normal.map(([id,title,type])=>field(title,'ap-spec-'+id,type,'',type==='number'?'min="0" step="any"':'')).join('')}</div><div class="ap-filter-section"><h3>امکانات و ویژگی‌های اقامتگاه</h3><div class="ap-check-list">${bools.map(([key,label])=>`<label class="ap-check"><input type="checkbox" id="ap-spec-${key}">${label}</label>`).join('')}</div></div><label class="ap-field">امکانات دیگر (هر مورد در یک خط)<textarea id="ap-spec-amenities" placeholder="آشپزخانه کامل&#10;باربیکیو&#10;تراس"></textarea></label><label class="ap-field">قوانین اقامتگاه<textarea id="ap-spec-house_rules" placeholder="شرایط پذیرش و ساعت تحویل"></textarea></label><label class="ap-field">قوانین کنسلی<textarea id="ap-spec-cancellation_policy" placeholder="شرایط لغو و استرداد باید قبل از فعال‌سازی پرداخت نهایی و شفاف باشند."></textarea></label><button type="submit" class="ap-btn">ذخیره اطلاعات تکمیلی</button></form></section>`;
const ids=['house_rules','cancellation_policy','amenities'];let current={};
async function load(){const property=$('#ap-spec-property').value;const {data,error}=await db().from('afra_property_specs').select('*').eq('property_id',property).maybeSingle();$('#ap-spec-status').innerHTML=error?banner('جدول afra_property_specs در دیتابیس فعال نیست: '+error.message,'error'):'';current=data||{};
normal.forEach(([k])=>{$('#ap-spec-'+k).value=current[k]??'';});bools.forEach(([k])=>{$('#ap-spec-'+k).checked=!!current[k]});$('#ap-spec-amenities').value=(current.amenities||[]).join('\n');$('#ap-spec-house_rules').value=current.house_rules||'';$('#ap-spec-cancellation_policy').value=current.cancellation_policy||'';}
$('#ap-spec-property').addEventListener('change',load);$('#ap-spec-form').addEventListener('submit',async e=>{e.preventDefault();const payload={property_id:$('#ap-spec-property').value,updated_at:new Date().toISOString()};
normal.forEach(([k,_,type])=>{const raw=$('#ap-spec-'+k).value.trim();payload[k]=type==='number'?(raw?Number(raw):null):(raw||null);});bools.forEach(([k])=>payload[k]=$('#ap-spec-'+k).checked);payload.amenities=$('#ap-spec-amenities').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,80);payload.house_rules=$('#ap-spec-house_rules').value.trim();payload.cancellation_policy=$('#ap-spec-cancellation_policy').value.trim();const {error}=await db().from('afra_property_specs').upsert(payload,{onConflict:'property_id'});$('#ap-spec-status').innerHTML=error?banner('ذخیره ناموفق: '+error.message,'error'):banner('اطلاعات اقامتگاه ذخیره شد.','success');});
await load();}
function init(){document.body.appendChild(toastRoot);nav();addLegacyLinks();if(currentFile==='property.html')attachPropertyAddon();if(!root)return;
 switch(moduleId){case 'search':searchPage();break;case 'map':searchPage(true);break;case 'categories':categoryPage();break;case 'cities':citiesPage();break;case 'regions':regionsPage();break;
 case 'auth':case 'register':authPage();break;case 'guest':dashboardPage();break;case 'account-bookings':accountBookingsPage();break;case 'my-searches':mySearchesPage();break;case 'my-reviews':myReviewsPage();break;case 'host-reviews':hostReviewsPage();break;case 'notifications':notificationsPage();break;case 'favorites':favoritePage();break;case 'support':supportPage();break;case 'wallet':walletPage();break;case 'reviews':reviewsPage();break;case 'compare':comparePage();break;case 'booking':bookingPage();break;case 'payment':case 'result':case 'voucher':paymentPage(moduleId);break;
 case 'spec-editor':propertySpecsPage();break;case 'host-calendar':hostCalendarPage();break;case 'host-finance':hostFinancePage();break;case 'host-performance':hostFinancePage('performance');break;case 'add-property':hostRoutePage('add');break;case 'manage-property':hostRoutePage('manage');break;
 case 'admin-payments':adminPaymentsPage();break;
 case 'messages':messagesPage();break;
 default:if(moduleId.startsWith('admin-'))adminPage(moduleId.slice(6));else if(['about','contact','rules','privacy','faq','magazine','journal','become-host','last-minute','discounts','referrals'].includes(moduleId))marketingPage(moduleId);else cardLanding('افرا سفر','صفحه مورد نظر از منوی زیر قابل دسترسی است.',menu.map(([a,b])=>[a,b,'']));
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
