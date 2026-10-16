// Ingredient extraction endpoint; authenticates existing device tokens. Does not write to any database table.
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { loadRecipe } from './extract.mjs';
const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const headers={'Access-Control-Allow-Origin':'https://demtimon-creator.github.io','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response(null,{headers});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  try {
    const body=await req.text();if(body.length>4096)return reply({error:'Anfrage zu groß'},413);
    const data=JSON.parse(body),token=String(data.deviceToken||'');
    if(!/^[a-f0-9]{64}$/.test(token))return reply({error:'Bitte zuerst bei eurer Schublade anmelden.'},401);
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
    const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    const {data:device,error}=await client.from('recipe_devices').select('household_id').eq('token_hash',hash).maybeSingle();
    if(error)return reply({error:'Zugang konnte nicht geprüft werden.'},503);
    if(!device)return reply({error:'Bitte zuerst bei eurer Schublade anmelden.'},401);
    return reply(await loadRecipe(String(data.url||'')));
  }catch(e){return reply({error:e instanceof SyntaxError?'Ungültige Anfrage.':e.message||'Zutaten konnten nicht geladen werden.'},422);}
});
