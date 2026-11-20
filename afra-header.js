/* One mobile brand next to the right-hand menu; restore original DOM on desktop. */
(()=>{'use strict';
function start(){
 const mobile=matchMedia('(max-width:767px)'),page=location.pathname.split('/').pop()||'index.html';
 if(page==='index.html')return;
 let bar=document.querySelector('.ap-travelbar');
 if(!bar){
  bar=document.createElement('nav');bar.className='ap-travelbar afra-mobile-only-header';bar.setAttribute('aria-label','منوی افراسفر');
  bar.innerHTML='<button type="button" class="ap-nav-toggle" aria-expanded="false" aria-controls="ap-navigation-links"><span>منو</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><div id="ap-navigation-links" class="ap-nav-links"></div>';
  const links=bar.querySelector('.ap-nav-links');
  for(const [href,label] of [['index.html','خانه'],['search.html','جست‌وجوی پیشرفته'],['categories.html','دسته‌بندی‌ها'],['map.html','نقشه'],['guest-dashboard.html','حساب مسافر'],['become-host.html','میزبان شوید'],['support.html','پشتیبانی']]){const a=document.createElement('a');a.href=href;a.textContent=label;links.append(a);}
  const toggle=bar.querySelector('.ap-nav-toggle'),open=value=>{bar.classList.toggle('ap-nav-open',value);toggle.setAttribute('aria-expanded',String(value));links.inert=!value;};
  toggle.addEventListener('click',()=>open(toggle.getAttribute('aria-expanded')!=='true'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){open(false);toggle.focus();}});
  document.addEventListener('click',e=>{if(!bar.contains(e.target))open(false);});open(false);
  document.body.prepend(bar);
 }
 bar.classList.add('afra-header-aligned');
 const toggle=bar.querySelector('.ap-nav-toggle');
 const legacyMenu=document.querySelector('header #mainNav'),legacyToggle=document.querySelector('header #menuToggle');
 if(legacyMenu&&legacyToggle){
  const links=bar.querySelector('.ap-nav-links'),destinations=new Set(Array.from(links.querySelectorAll('a')).map(a=>a.getAttribute('href')));
  for(const link of legacyMenu.querySelectorAll('a[href]'))if(!destinations.has(link.getAttribute('href'))){const copy=link.cloneNode(true);copy.removeAttribute('id');links.append(copy);destinations.add(link.getAttribute('href'));}
  legacyMenu.classList.add('afra-mobile-superseded-menu');legacyToggle.classList.add('afra-mobile-superseded-menu');
 }
 const native=Array.from(document.querySelectorAll('header.brand,header .afra-brand-glass,header .logo,header .brand,header .afv-brand,.topbar>.brand')).find(el=>el.querySelector('img.afra-brand-img')&&!el.closest('.ap-travelbar,footer'));
 let brand=bar.querySelector('.afra-brand-glass'),placeholder=null,hidden=[];
 if(native){placeholder=document.createComment('Original brand position');native.before(placeholder);brand=native;}
 if(!brand){brand=document.createElement('a');brand.href='index.html';brand.className='afra-brand-glass';brand.setAttribute('aria-label','صفحه اصلی افراسفر');brand.innerHTML='<img class="afra-leaf-img afra-brand-img" src="images/afra-safar-logo.png?v=fix20261119" width="36" height="40" alt="" aria-hidden="true"><span><strong>افراسفر</strong><small>سفر.آرامش.خاطره</small></span>';toggle.after(brand);}
 function sync(){
  hidden.forEach(el=>el.classList.remove('afra-mobile-empty-chrome'));hidden=[];
  if(mobile.matches){
   const oldParent=brand.parentElement;
   brand.classList.add('afra-mobile-header-brand');toggle.after(brand);
   if(native&&oldParent!==bar){let p=oldParent;while(p&&p!==document.body&&p.matches('header,.header-inner,.afv-header-inner,.nav,.topbar')){if(p.textContent.trim()||p.querySelector('a,button,input,img'))break;p.classList.add('afra-mobile-empty-chrome');hidden.push(p);p=p.parentElement;}}
  }else{
   brand.classList.remove('afra-mobile-header-brand');
   if(native&&placeholder?.parentNode)placeholder.after(brand);
  }
 }
 mobile.addEventListener('change',sync);sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
