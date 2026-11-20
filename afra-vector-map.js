/* MapLibre GL JS + OpenFreeMap. No requests to the blocked OSM raster tile server. */
(()=>{'use strict';let loader=null;
const dark=()=>document.documentElement.dataset.afraTheme==='dark';
const style=()=> 'https://tiles.openfreemap.org/styles/'+(dark()?'dark':'liberty');
function load(){
 if(window.maplibregl)return Promise.resolve();if(loader)return loader;
 loader=new Promise((resolve,reject)=>{
 const css=document.createElement('link');css.rel='stylesheet';css.href='assets/vendor/maplibre/maplibre-gl.css';document.head.appendChild(css);
 const script=document.createElement('script');script.src='assets/vendor/maplibre/maplibre-gl.js';
 const timer=setTimeout(()=>reject(new Error('map library timeout')),12000);
 script.onload=()=>{clearTimeout(timer);window.maplibregl?resolve():reject(new Error('map library unavailable'));};script.onerror=()=>{clearTimeout(timer);reject(new Error('map library unavailable'));};document.head.appendChild(script);
 }).catch(e=>{loader=null;throw e;});return loader;
}
function mount(container,groups,centre){
 const lib=window.maplibregl;
 if(lib.getRTLTextPluginStatus()==='unavailable')lib.setRTLTextPlugin(new URL('assets/vendor/maplibre/rtl-text.js',location.href).href,true).catch(()=>{});
 const map=new lib.Map({container,style:style(),center:[centre[1],centre[0]],zoom:7,attributionControl:true,cooperativeGestures:true,locale:{'CooperativeGesturesHandler.WindowsHelpText':'برای بزرگ‌نمایی Ctrl را نگه دارید','CooperativeGesturesHandler.MacHelpText':'برای بزرگ‌نمایی ⌘ را نگه دارید','CooperativeGesturesHandler.MobileHelpText':'برای حرکت نقشه از دو انگشت استفاده کنید','NavigationControl.ZoomIn':'بزرگ‌نمایی','NavigationControl.ZoomOut':'کوچک‌نمایی','NavigationControl.ResetBearing':'نمایش شمال','FullscreenControl.Enter':'تمام‌صفحه','FullscreenControl.Exit':'خروج از تمام‌صفحه'},maxZoom:18});
 map.addControl(new lib.NavigationControl({visualizePitch:true}),'top-right');
 map.addControl(new lib.FullscreenControl(),'top-right');
 map.addControl(new lib.ScaleControl({unit:'metric'}),'bottom-left');
 const alert=document.createElement('div');alert.className='afra-map-alert';alert.hidden=true;alert.setAttribute('role','status');alert.textContent='دریافت زمینهٔ نقشه ناموفق بود؛ نشانگرهای اقامتگاه‌ها همچنان قابل انتخاب هستند.';container.appendChild(alert);
 const toolbar=document.createElement('div');toolbar.className='afra-map-toolbar';
 const fit=document.createElement('button');fit.type='button';fit.className='ap-btn secondary';fit.textContent='نمایش همهٔ نتایج';toolbar.appendChild(fit);
 const retry=document.createElement('button');retry.type='button';retry.className='ap-btn secondary';retry.textContent='بارگذاری دوبارهٔ نقشه';toolbar.appendChild(retry);container.before(toolbar);
 const bounds=new lib.LngLatBounds();let count=0,activePopup=null;
 map.on('click',e=>{if(!e.originalEvent?.target?.closest?.('.afra-map-point,.maplibregl-popup'))activePopup?.remove();});
 for(const g of groups){bounds.extend([g.lng,g.lat]);count++;
 const button=document.createElement('button');button.type='button';button.className='afra-map-point'+(g.approx?' is-approx':'');
 button.textContent=g.properties.length>1?g.properties.length.toLocaleString('fa-IR')+' اقامتگاه':'اقامتگاه';button.setAttribute('aria-label',(g.approx?'مرکز شهر '+g.city:'موقعیت تقریبی')+'، '+button.textContent);
 const popup=document.createElement('div');popup.className='ap-map-popup';
 const heading=document.createElement('strong');heading.textContent=g.approx?'مرکز شهر '+g.city:'موقعیت تقریبی ثبت‌شده';popup.appendChild(heading);
 const note=document.createElement('p');note.textContent=g.approx?'این نشانگر موقعیت دقیق اقامتگاه نیست.':'موقعیت تقریبی ثبت‌شده توسط میزبان';popup.appendChild(note);
 const ul=document.createElement('ul');for(const p of g.properties.slice(0,30)){const li=document.createElement('li'),a=document.createElement('a');a.href='property.html?id='+encodeURIComponent(p.id);a.textContent=p.title||'مشاهده اقامتگاه';li.appendChild(a);ul.appendChild(li);}popup.appendChild(ul);
 const marker=new lib.Marker({element:button,anchor:'bottom'}).setLngLat([g.lng,g.lat]).addTo(map);
 const details=new lib.Popup({maxWidth:'280px',focusAfterOpen:true,closeOnClick:false}).setDOMContent(popup);
 button.addEventListener('click',e=>{
  e.stopPropagation();if(details.isOpen()){details.remove();return;}
  activePopup?.remove();activePopup=details;details.setLngLat([g.lng,g.lat]).addTo(map);
 });

 }
 function fitAll(){if(!count){map.easeTo({center:[centre[1],centre[0]],zoom:7,duration:500});return;}if(count===1){map.easeTo({center:bounds.getCenter(),zoom:10,duration:500});return;}map.fitBounds(bounds,{padding:50,maxZoom:11,duration:500});}
 fit.addEventListener('click',fitAll);retry.addEventListener('click',()=>{alert.hidden=true;map.setStyle(style());});
 let loaded=false;const timeout=setTimeout(()=>{if(!loaded)alert.hidden=false;},18000);
 map.on('load',()=>{loaded=true;clearTimeout(timeout);fitAll();});
 map.on('error',()=>{alert.hidden=false;});map.on('idle',()=>{if(map.isStyleLoaded()){loaded=true;alert.hidden=true;clearTimeout(timeout);}});
 function theme(){map.setStyle(style());}window.addEventListener('afra:themechange',theme);
 const resize=new ResizeObserver(()=>map.resize());resize.observe(container);
 const remove=map.remove.bind(map);map.remove=()=>{clearTimeout(timeout);window.removeEventListener('afra:themechange',theme);resize.disconnect();toolbar.remove();remove();};
 return map;
}
window.AfraVectorMap=Object.freeze({load,mount});
})();
