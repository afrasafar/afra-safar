/* Local line icons for static and asynchronously rendered UI. No network dependency. */
(()=>{'use strict';
const paths={
 gift:'M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z',
 pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM9 10a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
 user:'M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 21v-2a8 8 0 0 1 16 0v2',
 users:'M6 7a3 3 0 1 0 6 0 3 3 0 0 0-6 0M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 5v3',
 home:'m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8',
 phone:'M7 3H4a1 1 0 0 0-1 1c0 10 7 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a15 15 0 0 1-7-7l2-2-2-5Z',
 calendar:'M4 5h16v16H4zM8 3v5M16 3v5M4 10h16M8 14h2M14 14h2M8 18h2',
 clock:'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0M12 6v6l4 2',
 wallet:'M3 6h17v15H3zM3 6V4h15v2M15 11h6v5h-6zM17 13h1',
 card:'M3 5h18v14H3zM3 10h18M7 15h4',
 tag:'M3 3h8l10 10-8 8L3 11V3ZM7 7h.01',
 leaf:'M20 3C8 2 2 8 5 15c3 8 15 5 15-12ZM4 21 15 9',
 tree:'m12 2 7 8h-4l6 7h-7v5h-4v-5H3l6-7H5l7-8Z',
 mountain:'m2 21 8-17 5 10 3-5 5 12H2ZM7 10l3 3 2-3',
 waves:'M2 7c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 12c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 17c3-4 5 4 8 0s5 4 8 0 4 0 4 0',
 sun:'M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1',
 moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
 star:'m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z',
 heart:'M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-4 4 1 9 8 15 7-6 12-11 8-15Z',
 search:'M3 10a7 7 0 1 0 14 0 7 7 0 0 0-14 0M15 15l6 6',
 check:'m5 12 4 4L20 5',
 cross:'m6 6 12 12M18 6 6 18',
 info:'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0M12 11v6M12 7h.01',
 warning:'m12 3 10 18H2L12 3ZM12 9v5M12 17h.01',
 lock:'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4M12 14v3',
 message:'M3 3h18v14H9l-6 4V3ZM7 8h10M7 12h7',
 mail:'M3 5h18v14H3zM3 6l9 7 9-7',
 receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2V3ZM8 7h8M8 11h8M8 15h5',
 bed:'M3 9v12M21 9v12M3 17h18M3 9h18v8M6 5h12v4M6 13h4M14 13h4',
 car:'M5 10 7 4h10l2 6M3 10h18v9H3zM6 19v2M18 19v2M6 14h2M16 14h2',
 plane:'m22 2-7 20-4-9-9-4L22 2ZM11 13 22 2',
 bookmark:'M6 3h12v19l-6-4-6 4V3Z',
 bank:'m2 8 10-6 10 6H2ZM4 11v8M9 11v8M15 11v8M20 11v8M2 22h20',
 link:'m10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
 shower:'M5 21V5a3 3 0 0 1 6 0v2M8 10h9l-2-3h-5l-2 3ZM10 14v1M14 14v1M18 14v1M10 18v1M14 18v1M18 18v1',
 cup:'M5 8h12v8a5 5 0 0 1-10 0V8M17 9h2a3 3 0 0 1 0 6h-2M4 22h16M9 2v3M13 2v3',
 clean:'m12 2 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6ZM20 16v6M17 19h6',
 external:'M14 3h7v7M21 3 10 14M21 14v7H3V3h7',
 dot:'M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0'
};
const groups={gift:'🎁',pin:'📍📌⌖',user:'👤',users:'👥👨‍👩‍👧‍👦',home:'🏡🏠',phone:'📞☎',calendar:'📅',clock:'🕒🕓⌛⏳',wallet:'💰',card:'💳',tag:'🏷🔖',leaf:'🌿🍃',tree:'🌲🌳🪵',mountain:'🏞⛰🏔🌄',waves:'🌊🏊🏖',sun:'☀🌅',moon:'🌙',star:'⭐✨🆕',heart:'❤♥♡',search:'🔎🔍👀',check:'✅✓✔',cross:'❌',info:'ℹ',warning:'⚠',lock:'🔐🔒',message:'💬',mail:'✉📩',receipt:'🧾',bed:'🛏',car:'🚗',plane:'✈',bookmark:'🔖',bank:'🏦',link:'🔗',shower:'🚿',cup:'🍳',clean:'🧼',dot:'⚪'};
groups.external='↗';
const match=/(?![©®™])\p{Extended_Pictographic}[\uFE0F\uFE0E]?(?:[\u{1F3FB}-\u{1F3FF}])?(?:\u200d\p{Extended_Pictographic}[\uFE0F\uFE0E]?(?:[\u{1F3FB}-\u{1F3FF}])?)*|[⌖♡✓✔]/gu;
const ignored='script,style,svg,canvas,template,noscript,code,pre';
function type(value){const key=value.replace(/[\uFE0F\uFE0E]/g,'');for(const [name,symbols]of Object.entries(groups))if(symbols.includes(key))return name;return'dot';}
function icon(value){const el=document.createElementNS('http://www.w3.org/2000/svg','svg');el.classList.add('afra-ui-icon');el.dataset.icon=type(value);el.setAttribute('viewBox','0 0 24 24');el.setAttribute('aria-hidden','true');el.setAttribute('focusable','false');el.setAttribute('fill','none');el.setAttribute('stroke','currentColor');const p=document.createElementNS(el.namespaceURI,'path');p.setAttribute('d',paths[el.dataset.icon]);el.append(p);return el;}
function replace(node){const text=node.nodeValue,matches=[...text.matchAll(match)];if(!matches.length||node.parentElement?.closest(ignored))return;
 if(node.parentElement?.closest('option,textarea,title')){const option=node.parentElement.closest('option');if(option&&!option.hasAttribute('value'))option.value=option.textContent;node.nodeValue=text.replace(match,'').trim();return;}
 const fragment=document.createDocumentFragment();let last=0;for(const m of matches){fragment.append(document.createTextNode(text.slice(last,m.index)),icon(m[0]));last=m.index+m[0].length;}fragment.append(document.createTextNode(text.slice(last)));node.replaceWith(fragment);
}
function scan(root){if(root.nodeType===Node.TEXT_NODE){replace(root);return;}if(root.nodeType!==Node.ELEMENT_NODE||root.closest(ignored))return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes)replace(node);
}
function start(){scan(document.body);new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')replace(r.target);else for(const node of r.addedNodes)scan(node);}}).observe(document.body,{subtree:true,childList:true,characterData:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
