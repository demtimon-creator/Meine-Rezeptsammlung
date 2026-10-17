(function(root){
'use strict';
const fractions={'½':.5,'¼':.25,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125,'⅜':.375,'⅝':.625,'⅞':.875};
function servings(value){if(value===null||value===undefined||String(value).trim()==='')return null;const n=Number(String(value).replace(',','.'));return Number.isFinite(n)&&n>0&&n<=1000?n:null}
function fromYield(value){const s=String(value||'').trim(),m=s.match(/^(\d+(?:[.,]\d+)?)\s*(?:Portion(?:en)?|Person(?:en)?)?$/i);return m?servings(m[1]):null}
function number(s){if(/[½¼¾⅓⅔⅛⅜⅝⅞]/.test(s)){const f=s.at(-1);return Number(s.slice(0,-1).trim()||0)+fractions[f]}const mixed=s.match(/^(\d+)\s+(\d+)\/(\d+)$/);if(mixed)return +mixed[1]+(+mixed[3]?+mixed[2]/+mixed[3]:NaN);if(s.includes('/')){const [a,b]=s.split('/').map(Number);return b?a/b:NaN}return Number(s.replace(',','.'))}
function format(n,rest){const measured=/^(?:g|ml)\b/i.test(rest),digits=measured&&n>=10?0:3;return new Intl.NumberFormat('de-DE',{maximumFractionDigits:digits}).format(n)}
function scale(line,base,wanted){
 const original=String(line||'');base=servings(base);wanted=servings(wanted);
 if(!base||!wanted||base===wanted)return original;
 const m=original.match(/^(\s*(?:ca\.?\s*)?)(\d+\s+\d+\/\d+|\d+\s*[½¼¾⅓⅔⅛⅜⅝⅞]|[½¼¾⅓⅔⅛⅜⅝⅞]|\d+\/\d+|\d+(?:[.,]\d+)?)(\s*)(.+)$/i);
 if(!m||/^[-–/\d.,]/.test(m[4]))return original;
 const n=number(m[2]),scaled=n*wanted/base;if(!Number.isFinite(scaled)||scaled<0||scaled>100000000)return original;
 return m[1]+format(scaled,m[4])+m[3]+m[4];
}
const api={servings,fromYield,scale};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RecipePortions=api;
})(typeof window!=='undefined'?window:globalThis);
