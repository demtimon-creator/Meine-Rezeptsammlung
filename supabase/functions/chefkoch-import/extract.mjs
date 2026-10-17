// Public structured Recipe data only; never execute remote scripts or follow redirects.
export function chefkochURL(value) {
  let u; try { u = new URL(value); } catch { throw Error('Bitte einen Chefkoch-Rezeptlink einfügen.'); }
  if (u.protocol !== 'https:' || !['chefkoch.de','www.chefkoch.de'].includes(u.hostname) || u.port || u.username || u.password || !/^\/rezepte\/\d+\/[\w%-]+\.html$/.test(u.pathname)) throw Error('Bitte einen Chefkoch-Rezeptlink einfügen.');
  return 'https://www.chefkoch.de' + u.pathname;
}
function clean(value,limit=1000) {
  return String(value || '').replace(/<[^>]*>/g,' ').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (all,key) => {
    const named = {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '};
    if(key[0]!=='#') return named[key.toLowerCase()] || all;
    const code = key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):parseInt(key.slice(1),10);
    return code>0 && code<=0x10ffff?String.fromCodePoint(code):'';
  }).replace(/\s+/g,' ').trim().slice(0,limit);
}
function instructions(value) {
  const parts=[];
  function walk(v,depth=0){
    if(!v||depth>15)return;
    if(Array.isArray(v)){v.forEach(x=>walk(x,depth+1));return;}
    if(typeof v==='string'){const text=clean(v,25001);if(text)parts.push(text);return;}
    if(typeof v!=='object')return;
    if(v.itemListElement){walk(v.itemListElement,depth+1);return;}
    if(typeof v.text==='string')walk(v.text,depth+1);
  }
  walk(value);const steps=parts.join('\n\n');
  if(steps.length>25000)throw Error('Die Zubereitung ist zu lang für eine sichere Übernahme.');
  return steps;
}
export function extractRecipe(html, source) {
  const sourceUrl=chefkochURL(source), candidates=[];
  function visit(v, depth=0) {
    if(!v || depth>15) return;
    if(Array.isArray(v)) return v.forEach(x=>visit(x,depth+1));
    if(typeof v!=='object') return;
    if([v['@type']].flat().some(t=>t==='Recipe'||t==='https://schema.org/Recipe')) candidates.push(v);
    if(v['@graph']) visit(v['@graph'],depth+1);
    if(v.mainEntity) visit(v.mainEntity,depth+1);
  }
  for(const block of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if(!/\btype\s*=\s*['"]application\/ld\+json['"]/i.test(block[1])) continue;
    try { visit(JSON.parse(block[2])); } catch { /* malformed or unrelated data */ }
  }
  const r=candidates.find(r=>Array.isArray(r.recipeIngredient)&&r.recipeIngredient.length);
  if(!r) throw Error('Keine auslesbare Zutatenliste gefunden. Der gespeicherte Link bleibt erhalten; Zutaten können weiterhin manuell ergänzt werden.');
  const ingredients=r.recipeIngredient.filter(x=>typeof x==='string').map(x=>clean(x)).filter(Boolean);
  if(!ingredients.length || ingredients.length>100) throw Error('Zutatenliste konnte nicht sicher erkannt werden.');
  return {name:clean(r.name).slice(0,180),ingredients,servings:clean([r.recipeYield].flat().filter(Boolean).at(-1)),steps:instructions(r.recipeInstructions),sourceUrl};
}
export async function loadRecipe(value, fetcher=fetch) {
  const url=chefkochURL(value),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try {
    const res=await fetcher(url,{redirect:'error',signal:controller.signal,headers:{Accept:'text/html'}});
    if(!res.ok || !/text\/html/i.test(res.headers.get('content-type')||'')) throw Error('Chefkoch ist gerade nicht auslesbar. Bitte später erneut versuchen.');
    const reader=res.body.getReader(),chunks=[];let size=0;
    try { for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2000000)throw Error('Rezeptseite ist zu groß.');chunks.push(value);} }
    finally { await reader.cancel().catch(()=>{}); }
    const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
    return extractRecipe(new TextDecoder().decode(bytes),url);
  } catch(e) { if(e.name==='AbortError')throw Error('Chefkoch antwortet nicht rechtzeitig. Bitte später erneut versuchen.');throw e; }
  finally {clearTimeout(timer);}
}
