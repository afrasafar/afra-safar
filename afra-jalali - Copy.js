/* Afra Safar — shared dependency-free Solar Hijri date picker.
   UI: Persian calendar; storage/API values: ISO Gregorian YYYY-MM-DD.
   Supports dynamically inserted forms, real min/max, accessibility & mobile. */
(function(){
'use strict';
const MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const WEEKDAYS=['ش','ی','د','س','چ','پ','ج'];
const digits=s=>String(s??'').replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[+d]);
const parser=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{timeZone:'UTC',year:'numeric',month:'numeric',day:'numeric'});
function fromISO(v){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return null;
 const [y,m,d]=v.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d,12));
 return date.getUTCFullYear()===y&&date.getUTCMonth()+1===m&&date.getUTCDate()===d?date:null;
}
function toISO(d){return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');}
function parts(d){const arr=parser.formatToParts(d),get=k=>Number(arr.find(p=>p.type===k)?.value);return {y:get('year'),m:get('month'),d:get('day')};}
function addDays(d,n){const r=new Date(d.getTime());r.setUTCDate(r.getUTCDate()+n);return r;}
function localToday(){const d=new Date(),y=d.getFullYear(),m=d.getMonth()+1,day=d.getDate();return y+'-'+String(m).padStart(2,'0')+'-'+String(day).padStart(2,'0');}
function formatISO(iso,style='long'){
 const d=fromISO(String(iso||''));if(!d)return iso||'—';
 const p=parts(d);return style==='numeric'?digits(`${p.y}/${String(p.m).padStart(2,'0')}/${String(p.d).padStart(2,'0')}`):digits(p.d)+' '+MONTHS[p.m-1]+' '+digits(p.y);
}
function formatDateTime(v){const d=new Date(v);return isNaN(d.getTime())?String(v??'—'):new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);}
function monthDates(anchor){const p=parts(anchor);let start=addDays(anchor,-35),days=[];
 for(let i=0;i<102;i++){const d=addDays(start,i),z=parts(d);if(z.y===p.y&&z.m===p.m)days.push(d);}
 return days;
}
let portal=null, backdrop=null, active=null, anchor=null, previousFocus=null;
const bindings=new WeakMap();
function ensurePortal(){
 if(portal)return;
 backdrop=document.createElement('div');backdrop.className='afra-jcal-backdrop';backdrop.hidden=true;
 portal=document.createElement('section');portal.id='afra-jcal-dialog';portal.className='afra-jcal-dialog';portal.setAttribute('role','dialog');portal.setAttribute('aria-modal','true');portal.setAttribute('aria-label','انتخاب تاریخ شمسی');portal.dir='rtl';portal.hidden=true;
 document.body.append(backdrop,portal);backdrop.addEventListener('click',()=>close(true));
 portal.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.dataset.move){const days=monthDates(anchor);if(!days.length)return;anchor=addDays(button.dataset.move==='next'?days[days.length-1]:days[0],button.dataset.move==='next'?3:-3);render();}
  if(button.dataset.iso)select(button.dataset.iso);
  if(button.dataset.action==='today'){const today=localToday(),input=active;if(input){const min=input.min||'0001-01-01',max=input.max||'9999-12-31';if(today>=min&&today<=max)select(today);else{anchor=fromISO(today);render();}}}
  if(button.dataset.action==='clear'){if(active&&!active.required){active.value='';active.dispatchEvent(new Event('input',{bubbles:true}));active.dispatchEvent(new Event('change',{bubbles:true}));close(true);}}
  if(button.dataset.action==='close')close(true);
 });
 document.addEventListener('keydown',e=>{
  if(!portal||portal.hidden)return;
  if(e.key==='Escape'){e.preventDefault();close(true);return;}
  if(e.key==='Tab'){const list=[...portal.querySelectorAll('button:not(:disabled)')];if(!list.length)return;
   const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 });
 window.addEventListener('resize',()=>{if(portal&&!portal.hidden)position();},{passive:true});
 window.addEventListener('scroll',()=>{if(portal&&!portal.hidden)position();},{passive:true,capture:true});
}
function position(){if(!active)return;const button=bindings.get(active)?.button;if(!button)return;
 const mobile=innerWidth<=620,rect=button.getBoundingClientRect();
 if(mobile){portal.style.left='50%';portal.style.top='50%';portal.style.transform='translate(-50%,-50%)';portal.style.right='auto';}
 else{const width=Math.min(340,innerWidth-24);let left=rect.right-width;
 left=Math.max(12,Math.min(left,innerWidth-width-12));portal.style.left=left+'px';portal.style.top=Math.max(8,Math.min(rect.bottom+8,innerHeight-398))+'px';portal.style.right='auto';portal.style.transform='none';}
}
function minMax(input){const min=fromISO(input.min)?input.min:null,max=fromISO(input.max)?input.max:null;return {min,max};}
function render(){if(!active)return;const days=monthDates(anchor);if(!days.length)return;
 const p=parts(anchor),selected=active.value,today=localToday(),{min,max}=minMax(active),offset=(days[0].getUTCDay()+1)%7;
 let html='<div class="afra-jcal-head"><button type="button" data-move="next" aria-label="ماه بعد">‹</button><strong id="afra-jcal-title">'+MONTHS[p.m-1]+' '+digits(p.y)+'</strong><button type="button" data-move="prev" aria-label="ماه قبل">›</button></div>';
 html+='<div class="afra-jcal-weekdays">'+WEEKDAYS.map(w=>'<span>'+w+'</span>').join('')+'</div><div class="afra-jcal-days">';
 for(let i=0;i<offset;i++)html+='<span class="afra-jcal-empty" aria-hidden="true"></span>';
 for(const d of days){const iso=toISO(d),day=parts(d).d,disabled=(min&&iso<min)||(max&&iso>max),isSelected=iso===selected;
  html+='<button type="button" data-iso="'+iso+'" class="afra-jcal-day'+(isSelected?' is-selected':'')+(iso===today?' is-today':'')+'" '+(disabled?'disabled':'')+' aria-label="'+digits(day)+' '+MONTHS[p.m-1]+' '+digits(p.y)+'" aria-pressed="'+String(isSelected)+'">'+digits(day)+'</button>';
 }
 html+='</div><div class="afra-jcal-actions"><button type="button" data-action="today">امروز</button>'+(active.required?'':'<button type="button" data-action="clear">پاک کردن</button>')+'<button type="button" data-action="close">بستن</button></div><p class="afra-jcal-caption">تقویم شمسی · ذخیره تاریخ به‌صورت استاندارد برای رزرو</p>';
 portal.innerHTML=html;
 const title=portal.querySelector('#afra-jcal-title');if(title)portal.setAttribute('aria-labelledby','afra-jcal-title');
}
function open(input){if(!input||input.disabled)return;ensurePortal();active=input;previousFocus=document.activeElement;
 anchor=fromISO(input.value)||fromISO(input.min)||fromISO(localToday());
 render();portal.hidden=false;backdrop.hidden=false;document.documentElement.classList.add('afra-jcal-open');position();
 (portal.querySelector('.afra-jcal-day.is-selected:not(:disabled)')||portal.querySelector('button'))?.focus();
}
function close(restore){if(!portal)return;portal.hidden=true;backdrop.hidden=true;document.documentElement.classList.remove('afra-jcal-open');
 const btn=active&&bindings.get(active)?.button;active=null;if(restore)(btn||previousFocus)?.focus();previousFocus=null;
}
function select(iso){if(!active)return;const {min,max}=minMax(active);if((min&&iso<min)||(max&&iso>max))return;
 const input=active;input.value=iso;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));close(true);}
function updateLabel(input){const item=bindings.get(input);if(!item)return;
 const label=item.button.querySelector('.afra-jdate-value');if(label)label.textContent=input.value?formatISO(input.value):'انتخاب تاریخ شمسی';
 item.button.classList.toggle('is-empty',!input.value);item.button.disabled=input.disabled;
}
function pairDates(input){const pairs={'f-in':'f-out','ap-book-in':'ap-book-out','cottageCheckin':'cottageCheckout','luxuryCheckin':'luxuryCheckout','villaCheckin':'villaCheckout'};
 const otherId=pairs[input.id];if(!otherId)return;
 input.addEventListener('change',()=>{const other=document.getElementById(otherId);if(!other)return;
 const next=input.value?toISO(addDays(fromISO(input.value),1)):localToday();other.min=next;
 if(other.value&&other.value<next){other.value='';other.dispatchEvent(new Event('input',{bubbles:true}));other.dispatchEvent(new Event('change',{bubbles:true}));}
 updateLabel(other);
 });
}
function attach(input){if(bindings.has(input)||input.classList.contains('iso-date-input')||input.closest('[data-afra-jalali-skip]'))return;
 if(input.matches('[type="date"]')===false)return;
 const wrap=document.createElement('span');wrap.className='afra-jdate-field';
 input.parentNode.insertBefore(wrap,input);wrap.append(input);input.classList.add('afra-jdate-native');input.tabIndex=-1;input.setAttribute('aria-hidden','true');
 const button=document.createElement('button');button.type='button';button.className='afra-jdate-trigger';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','afra-jcal-dialog');button.setAttribute('aria-label', 'انتخاب تاریخ شمسی');
 button.innerHTML='<span class="afra-jdate-value"></span><svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></svg>';
 wrap.append(button);bindings.set(input,{button});
 button.addEventListener('click',()=>open(input));input.addEventListener('input',()=>updateLabel(input));input.addEventListener('change',()=>updateLabel(input));
 input.addEventListener('invalid',()=>{input.setCustomValidity('');open(input);});
 const form=input.form;if(form&&!form.dataset.afraJalaliReset){form.dataset.afraJalaliReset='1';form.addEventListener('reset',()=>setTimeout(()=>form.querySelectorAll('input.afra-jdate-native').forEach(updateLabel),0));}
 const label= input.id? document.querySelector('label[for="'+CSS.escape(input.id)+'"]'):null;
 if(label)label.addEventListener('click',e=>{e.preventDefault();open(input);});
 updateLabel(input);pairDates(input);
}
let queued=false;
function hydrate(){queued=false;document.querySelectorAll('input[type="date"]:not(.iso-date-input):not(.afra-jdate-native)').forEach(attach);}
function schedule(){if(queued)return;queued=true;queueMicrotask(hydrate);}
function init(){ensurePortal();schedule();new MutationObserver(records=>{
 if(records.some(r=>r.type==='childList'||(r.type==='attributes'&&r.attributeName==='type')))schedule();
 }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['type']});
}
window.AfraJalali=Object.freeze({formatISO,formatDateTime,fromISO,toISO,localToday,refresh:schedule,openById:id=>open(document.getElementById(id)),close:()=>close(true)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
