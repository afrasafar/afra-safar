/* Afra Safar — Classic Dark 2.0. Shared across every page; no dependencies.
   Primary click toggles light/dark; Shift+click or long press opens 3-mode menu. */
(function(){
'use strict';
const KEY='afra-theme-preference';
const root=document.documentElement;
const media=typeof matchMedia==='function'?matchMedia('(prefers-color-scheme: dark)'):null;
const moon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.3 14.4A8.5 8.5 0 0 1 9.5 3.7a8.5 8.5 0 1 0 10.8 10.7Z"/></svg>';
const sun='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>';
const monitor='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8m-4-4v4"/></svg>';
function stored(){try{const x=localStorage.getItem(KEY);return ['light','dark','auto'].includes(x)?x:'auto';}catch(_){return 'auto';}}
let preference=stored();
function scheme(){return preference==='auto'?(media?.matches?'dark':'light'):preference;}
function meta(name,value){let el=document.head.querySelector('meta[name="'+name+'"]');if(!el){el=document.createElement('meta');el.name=name;document.head.appendChild(el);}el.content=value;}
function apply(){const active=scheme(),old=root.dataset.afraTheme;
 root.dataset.afraTheme=active;root.dataset.afraThemeChoice=preference;
 root.style.colorScheme=active;meta('color-scheme',active);meta('theme-color',active==='dark'?'#171717':'#f8faf8');
 const button=document.getElementById('afraThemeToggle');if(button){
  button.querySelector('.afra-theme-switch__icon').innerHTML=active==='dark'?sun:moon;
  button.querySelector('.afra-theme-switch__label').textContent=active==='dark'?'حالت روشن':'حالت تاریک';
  button.setAttribute('aria-pressed',String(active==='dark'));
  button.setAttribute('aria-label',active==='dark'?'فعال کردن حالت روشن':'فعال کردن حالت تاریک');
  button.title='برای تغییر حالت کلیک کنید؛ برای تنظیم خودکار Shift+Click بزنید';
 }
 if(old!==active)window.dispatchEvent(new CustomEvent('afra:themechange',{detail:{theme:active,preference}}));
}
function setPreference(next){preference=['auto','light','dark'].includes(next)?next:'auto';try{localStorage.setItem(KEY,preference);}catch(_){}apply();closeMenu();}
function toggle(){setPreference(scheme()==='dark'?'light':'dark');}
function install(){let button=document.getElementById('afraThemeToggle');if(!button){
 button=document.createElement('button');button.id='afraThemeToggle';button.className='afra-theme-switch';button.type='button';
 button.innerHTML='<span class="afra-theme-switch__icon" aria-hidden="true"></span><span class="afra-theme-switch__label"></span>';
 const page=(document.body.dataset.afraPage||location.pathname.split('/').pop()||'index.html').toLowerCase();
 const targets={'index.html':'.auth-top-actions','cottage.html':'.header-actions','villa.html':'.afv-header-inner','luxury-villa.html':'.site-header .header-inner','property.html':'header.nav','my-reservations.html':'header .nav','owner-login.html':'header .header-inner','owner-dashboard.html':'.top-actions','owner-reservations.html':'header','admin.html':'.topbar'};
 const target=page==='owner-register.html'?null:document.querySelector(targets[page]||'header')||document.querySelector('header');
 if(target)target.appendChild(button);else{button.classList.add('afra-theme-switch--floating');document.body.appendChild(button);}
 if(['index.html','owner-login.html','owner-dashboard.html','owner-reservations.html','admin.html'].includes(page))button.classList.add('afra-theme-switch--on-dark');
 }
 if(!button.querySelector('.afra-theme-switch__icon'))button.innerHTML='<span class="afra-theme-switch__icon" aria-hidden="true"></span><span class="afra-theme-switch__label"></span>';
 let longPress=null,wasLong=false;
 button.addEventListener('click',e=>{if(wasLong){wasLong=false;return;}if(e.shiftKey){openMenu(button);return;}toggle();});
 button.addEventListener('contextmenu',e=>{e.preventDefault();openMenu(button);});
 button.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;wasLong=false;longPress=setTimeout(()=>{wasLong=true;openMenu(button);},620);});
 for(const action of ['pointerup','pointercancel','pointerleave'])button.addEventListener(action,()=>{clearTimeout(longPress);});
 button.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();openMenu(button);}});
 apply();
}
let menu=null,anchor=null;
function closeMenu(){if(menu){menu.remove();menu=null;}if(anchor){anchor.setAttribute('aria-expanded','false');anchor=null;}}
function openMenu(button){closeMenu();anchor=button;anchor.setAttribute('aria-expanded','true');
 const choices=[['light','روشن',sun],['dark','تاریک',moon],['auto','هماهنگ با دستگاه',monitor]];
 menu=document.createElement('div');menu.className='afra-appearance-menu';menu.dir='rtl';menu.setAttribute('role','group');menu.setAttribute('aria-label','تنظیم حالت نمایش');
 const title=document.createElement('strong');title.textContent='حالت نمایش سایت';menu.appendChild(title);
 for(const [mode,label,icon] of choices){const b=document.createElement('button');b.type='button';b.dataset.choice=mode;b.setAttribute('aria-pressed',String(preference===mode));b.innerHTML=icon+'<span>'+label+'</span>'+(preference===mode?'<span class="afra-appearance-check" aria-hidden="true">✓</span>':'');b.addEventListener('click',()=>{setPreference(mode);button.focus();});menu.appendChild(b);}
 document.body.appendChild(menu);const rect=button.getBoundingClientRect();const width=menu.getBoundingClientRect().width;
 menu.style.left=Math.max(10,Math.min(rect.right-width,innerWidth-width-10))+'px';menu.style.top=Math.max(10,Math.min(rect.bottom+9,innerHeight-menu.offsetHeight-10))+'px';
 menu.querySelector('button[aria-pressed="true"]')?.focus();
}
document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target)&&!anchor?.contains(e.target))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu){closeMenu();document.getElementById('afraThemeToggle')?.focus();}});
window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null){preference=stored();apply();}});
if(media){const listener=()=>{if(preference==='auto')apply();};if(media.addEventListener)media.addEventListener('change',listener);else media.addListener(listener);}
window.AfraTheme=Object.freeze({get:()=>scheme(),getPreference:()=>preference,setPreference,toggle});
apply();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
