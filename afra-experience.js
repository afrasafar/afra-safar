/* Independent enhancements; does not replace existing auth, search, menus or data flows. */
(()=>{'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function brand(){
 document.querySelectorAll('header.brand,header .logo,header .brand,header .afv-brand,header a:has(>img.afra-brand-img)').forEach(el=>{
  if(el.classList.contains('afra-brand-glass')||!el.querySelector('img.afra-brand-img'))return;
  el.classList.add('afra-brand-glass');
  const leaf=document.createElement('img');leaf.className='afra-leaf-img afra-brand-img';leaf.src='images/afra-safar-logo.png?v=fix20261119';leaf.alt='';leaf.width=36;leaf.height=40;leaf.decoding='async';leaf.setAttribute('aria-hidden','true');
  const copy=document.createElement('span');copy.innerHTML='<strong>افراسفر</strong><small>سفر.آرامش.خاطره</small>';el.replaceChildren(leaf,copy);
 });
}
function motion(){
 if(reduced.matches||!('IntersectionObserver'in window))return;
 const seen=new WeakSet(),selector='.ap-stay,.stay-card,.category-card,.afra-region-card,.ap-linkcard,.stat-card,.ap-stat,.card,.ap-panel,.dashboard-card,.afra-feature-card,.afra-section-heading,.afra-ref-section-title';
 const observer=new IntersectionObserver(entries=>{let order=0;for(const e of entries)if(e.isIntersecting){e.target.style.setProperty('--afra-motion-delay',(order++%4)*65+'ms');e.target.classList.add('afra-motion-enter');observer.unobserve(e.target);}},{threshold:.12});
 function discover(node){if(node.nodeType!==1)return;const nodes=[...(node.matches(selector)?[node]:[]),...node.querySelectorAll(selector)];for(const el of nodes){if(!seen.has(el)){seen.add(el);observer.observe(el);}}}
 discover(document.body);
 new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)discover(node);}).observe(document.body,{childList:true,subtree:true});
 reduced.addEventListener('change',()=>{if(reduced.matches){observer.disconnect();document.querySelectorAll('.afra-motion-enter').forEach(e=>e.classList.remove('afra-motion-enter'));}});
}
function start(){brand();motion();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
