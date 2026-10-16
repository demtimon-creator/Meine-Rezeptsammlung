(function(root){
'use strict';
const normalize=s=>String(s||'').trim().toLocaleLowerCase('de').replace(/\s+/g,' ');
function canonical(value){try{const u=new URL(value);if(!['http:','https:'].includes(u.protocol))return '';u.hash='';for(const k of [...u.searchParams.keys()])if(/^utm_/i.test(k)||['igsh','igshid','fbclid','mibextid','ref','refsrc'].includes(k))u.searchParams.delete(k);u.hostname=u.hostname.toLowerCase();if(/(^|\.)instagram\.com$/.test(u.hostname)){u.hostname='www.instagram.com';u.pathname=u.pathname.replace(/^\/reels\//,'/reel/')}return u.href.replace(/\/$/,'')}catch(e){return ''}}
function extract(text){const links=String(text||'').match(/https?:\/\/[^\s<>"'\u200b]+/gi)||[];const valid=links.map(s=>canonical(s.replace(/[),.;!?]+$/,''))).filter(Boolean);return valid.find(s=>/(^|\.)(instagram\.com|facebook\.com|fb\.watch|fb\.com)$/.test(new URL(s).hostname))||valid[0]||''}
function parse(text){
const source=String(text||'').replace(/https?:\/\/[^\s<>]+/gi,'').replace(/\r/g,'');
let mode='',ingredients=[],steps=[];
const amount=/^(?:(?:\d+(?:[.,]\d+)?(?:\s*[-–/]\s*\d+(?:[.,]\d+)?)?|[½¼¾⅓⅔⅛⅜⅝⅞])\s*)+/;
const measured=/^(?:ca\.?\s*)?(?:(?:\d+(?:[.,]\d+)?(?:\s*[-–/]\s*\d+(?:[.,]\d+)?)?|[½¼¾⅓⅔⅛⅜⅝⅞])\s*)+(?:kg|mg|g|ml|cl|dl|l|TL|EL|Teelöffel|Esslöffel|Prisen?|Päckchen|Packungen?|Dosen?|Becher|Tassen?|Stück|Zehen?|Bund|Eier?|Ei|Tomaten?|Zwiebeln?|Zitronen?|Kartoffeln?|Paprika|Karotten?|Möhren?|Bananen?|Äpfel|Apfel|Gurken?|Knoblauchzehen?|Vanilleschoten?)\b/i;
const prep=/^(?:\d+[.)]\s*)?(?:alles|alle zutaten|anschließend|danach|nun|dann|zuerst|zum schluss|vermischen|verrühren|mischen|backen|den backofen|die zutaten)\b/i;
const lines=source.split(/\n/).flatMap(s=>s.split(/[;•●▪]/)).map(s=>s.trim().replace(/^[-*–]\s*/, '').replace(/^\d+[.)]\s+(?=\d)/,'')).filter(Boolean);
for(let line of lines){
let h=line.match(/^(?:zutaten|ingredients)(?:\s+(?:für|for)\b[^:]*)?\s*:\s*(.*)$/i);
if(h||/^(zutaten|ingredients)$/i.test(line)){mode='ingredients';line=h?h[1]:'';if(!line)continue}
const step=line.match(/^(?:zubereitung|anleitung|zubereitungsschritte|instructions|preparation)\s*:?\s*(.*)$/i);
if(step){mode='steps';if(step[1])steps.push(step[1]);continue}
if(/^(?:#|werbung\b|anzeige\b|folgt?\b|speichern\b|guten appetit\b|nährwerte\b)/i.test(line)){mode='';continue}
if(mode==='steps'){steps.push(line);continue}
if(/^\d+(?:[.,]\d+)?\s*(?:Minuten?|Sekunden?|Stunden?|Grad|°)\b/i.test(line)){mode='steps';steps.push(line);continue}
if(/^\d+\s+(?:Kommentare|Likes|Aufrufe)\b/i.test(line)){mode='';continue}
if(/^(?:für (?:den|die|das)\b|ergibt\b|portionen\b|\d+\s+portionen\b)/i.test(line)&&!measured.test(line))continue;
if(prep.test(line)){mode='steps';steps.push(line);continue}
if(mode==='ingredients'&&(measured.test(line)||amount.test(line)||/^(?:salz|pfeffer|öl|wasser|butter|etwas|nach geschmack)\b/i.test(line))){ingredients.push(line);continue}
if(measured.test(line)){ingredients.push(line);mode='ingredients'}
}
return {ingredients:[...new Map(ingredients.map(s=>[normalize(s),s])).values()],steps:steps.join('\n')};
}
function payload(search,hash){const p=new URLSearchParams(search||'');const h=new URLSearchParams(String(hash||'').replace(/^#/,''));const text=[p.get('text'),p.get('url'),h.get('share')].filter(Boolean).join('\n').slice(0,30000);const url=extract(text);return url?{url,text,title:(p.get('title')||'').trim().slice(0,180)}:null}
const api={normalize,canonical,extract,parse,payload};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.RecipeShare=api;
})(typeof window!=='undefined'?window:globalThis);
