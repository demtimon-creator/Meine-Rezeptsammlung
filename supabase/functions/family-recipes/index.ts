import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors={'Access-Control-Allow-Origin':'https://demtimon-creator.github.io','Access-Control-Allow-Headers':'content-type,authorization,apikey','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('')}
function reply(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors})}
Deno.serve(async req=>{
if(req.method==='OPTIONS')return new Response(null,{headers:cors});
if(req.method!=='POST')return reply({error:'Method not allowed'},405);
try{
const origin=req.headers.get('origin');if(origin&&origin!=='https://demtimon-creator.github.io')return reply({error:'Origin not allowed'},403);
if(Number(req.headers.get('content-length')||0)>100000)return reply({error:'Anfrage zu groß'},413);
const raw=await req.text();if(raw.length>100000)return reply({error:'Anfrage zu groß'},413);const data=JSON.parse(raw);const action=String(data.action||'');
if(action==='create'){
const familyCode=random(),deviceToken=random(),hid=crypto.randomUUID();
const a=await client.from('recipe_households').insert({id:hid,name:'Unsere Rezeptsammlung',created_by:null});
if(a.error)throw a.error;
const fc=await client.from('recipe_family_codes').insert({code_hash:await hash(familyCode),household_id:hid});
const dv=await client.from('recipe_devices').insert({token_hash:await hash(deviceToken),household_id:hid});if(fc.error||dv.error)throw Error('Einrichtung fehlgeschlagen');
return reply({familyCode,deviceToken});
}
if(action==='join'){
const familyCode=String(data.familyCode||'');if(!/^[a-f0-9]{64}$/.test(familyCode))return reply({error:'Ungültiger Familiencode'},400);
const {data:family}=await client.from('recipe_family_codes').select('household_id').eq('code_hash',await hash(familyCode)).eq('active',true).maybeSingle();
if(!family)return reply({error:'Code nicht gefunden'},403);
const deviceToken=random();const add=await client.from('recipe_devices').insert({token_hash:await hash(deviceToken),household_id:family.household_id});if(add.error)throw add.error;
return reply({deviceToken});
}
const token=String(data.deviceToken||'');if(!/^[a-f0-9]{64}$/.test(token))return reply({error:'Gerät nicht verbunden'},401);
const {data:device}=await client.from('recipe_devices').select('household_id').eq('token_hash',await hash(token)).maybeSingle();if(!device)return reply({error:'Zugang ungültig'},401);
const family=device.household_id;
if(action==='list'){const q=await client.from('shared_recipes').select('*').eq('household_id',family).order('updated_at',{ascending:false});if(q.error)throw q.error;const shop=await client.from('recipe_shopping').select('id,text,done,updated_at').eq('household_id',family).order('updated_at');if(shop.error)throw shop.error;return reply({recipes:q.data,items:shop.data})}
if(action==='delete'){const id=String(data.id||'');const q=await client.from('shared_recipes').delete().eq('id',id).eq('household_id',family);if(q.error)throw q.error;return reply({ok:true})}

if(action==='rotate'){const familyCode=random();const q=await client.from('recipe_family_codes').update({active:false}).eq('household_id',family);if(q.error)throw q.error;const n=await client.from('recipe_family_codes').insert({code_hash:await hash(familyCode),household_id:family});if(n.error)throw n.error;return reply({familyCode})}
if(action==='revoke'){const q=await client.from('recipe_devices').delete().eq('household_id',family).neq('token_hash',await hash(token));if(q.error)throw q.error;const c=await client.from('recipe_family_codes').update({active:false}).eq('household_id',family);if(c.error)throw c.error;return reply({ok:true})}
if(action==='shop-delete'){const q=await client.from('recipe_shopping').delete().eq('household_id',family).eq('id',String(data.id));if(q.error)throw q.error;return reply({ok:true})}
if(action==='shop-save'){const item=data.item||{},id=String(item.id||'');if(!/^[a-f0-9-]{36}$/.test(id))return reply({error:'Ungültige Artikel-ID'},400);const text=String(item.text||'').trim().slice(0,1000);if(!text)return reply({error:'Artikel fehlt'},400);const row={household_id:family,text,done:!!item.done,updated_at:new Date().toISOString()};const q=await client.from('recipe_shopping').update(row).eq('id',id).eq('household_id',family).select().maybeSingle();if(q.error)throw q.error;if(!q.data){const ins=await client.from('recipe_shopping').insert({...row,id});if(ins.error)return reply({error:'Artikel konnte nicht gespeichert werden'},409)}return reply({ok:true})}
if(action==='save'){
const r=data.recipe||{};const title=String(r.title||'').slice(0,180).trim();if(!title)return reply({error:'Name fehlt'},400);
const row={household_id:family,title,category:String(r.category||'Sonstiges').slice(0,80),source_url:r.source_url?String(r.source_url).slice(0,2000):null,ingredients:String(r.ingredients||'').slice(0,20000),instructions:String(r.instructions||'').slice(0,25000),notes:String(r.notes||'').slice(0,10000),favorite:!!r.favorite,updated_at:new Date().toISOString()};
if(r.id){const q=await client.from('shared_recipes').update(row).eq('id',String(r.id)).eq('household_id',family).select().maybeSingle();if(q.error)throw q.error;if(q.data)return reply({recipe:q.data});const ins=await client.from('shared_recipes').insert({...row,id:String(r.id),created_by:null}).select().single();if(ins.error)return reply({error:'Rezept konnte nicht gespeichert werden'},409);return reply({recipe:ins.data})}
const q=await client.from('shared_recipes').insert({...row,created_by:null}).select().single();if(q.error)throw q.error;return reply({recipe:q.data});
}
return reply({error:'Aktion unbekannt'},400)
}catch(e){return reply({error:'Vorgang fehlgeschlagen'},500)}
});
