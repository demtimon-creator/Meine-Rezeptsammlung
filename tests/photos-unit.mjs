import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {extractRecipe,loadPhoto} from '../supabase/functions/chefkoch-import/extract.mjs';
const require=createRequire(import.meta.url),photos=require('../photos.js');
const source='https://www.chefkoch.de/rezepte/123456/Test.html',image='https://img.chefkoch-cdn.de/rezepte/123456/bilder/987654/crop-960x540/test.jpg';
const recipe={'@type':'Recipe',name:'Test',recipeIngredient:['200 g Reis'],recipeInstructions:'Kochen.'};
const html=x=>'<script type="application/ld+json">'+JSON.stringify(x)+'</script>';
for(const form of [image,{'@type':'ImageObject',url:image},{contentUrl:image},[image]])assert.equal(extractRecipe(html({...recipe,image:form}),source).imageUrl,image);
assert.equal(extractRecipe(html({'@graph':[{...recipe,image:{'@id':'#photo'}},{'@type':'ImageObject','@id':'#photo',url:image}]}),source).imageUrl,image);
assert.equal(extractRecipe(html({'@graph':[{...recipe,image:'#photo'},{'@id':'#photo',contentUrl:image}]}),source).imageUrl,image);
assert.equal(extractRecipe(html({'@graph':[{...recipe,image:'#photo'},{'@id':'#photo',url:'#photo'}]}),source).imageUrl,null);
assert.equal(extractRecipe(html(recipe),source).imageUrl,null);
for(const bad of ['javascript:alert(1)','data:image/svg+xml,xxx','http://img.chefkoch-cdn.de/rezepte/123/bilder/456/a.jpg','https://img.chefkoch-cdn.de.evil.com/rezepte/123/bilder/456/a.jpg','https://user@img.chefkoch-cdn.de/rezepte/123/bilder/456/a.jpg','https://img.chefkoch-cdn.de:123/rezepte/123/bilder/456/a.jpg','https://img.chefkoch-cdn.de/tracker.svg']){assert.equal(photos.url(bad),null);assert.equal(extractRecipe(html({...recipe,image:bad}),source).imageUrl,null);}
assert.equal(photos.url(image+'?tracking=test#fragment'),image);
if(process.env.CHEFKOCH_HTML){const r=extractRecipe(readFileSync(process.env.CHEFKOCH_HTML,'utf8'),'https://www.chefkoch.de/rezepte/141811061122586/Nudelsalat-Klassik.html');assert(r.imageUrl?.includes('/rezepte/141811061122586/bilder/'));console.log('Provided real recipe: dish photograph linked by JSON-LD ImageObject PASS');}
console.log('Photos: direct URLs, ImageObjects, graph references, missing images, cycles, unsafe hosts/protocols, credentials and tracking removal PASS');

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jHTsAAAAASUVORK5CYII=','base64');
assert.equal((await loadPhoto(image,async(u,o)=>{assert.equal(o.redirect,'error');return new Response(png)})).contentType,'image/png');
await assert.rejects(loadPhoto('https://example.com/x.jpg',async()=>new Response(png)));
await assert.rejects(loadPhoto(image,async()=>new Response('<html>not an image</html>')));
await assert.rejects(loadPhoto(image,async()=>new Response(png,{status:403})));
await assert.rejects(loadPhoto(image,async()=>new Response(new Uint8Array(2000001))));
console.log('Authenticated photo delivery helper: binary format validation, target allowlist, redirect prohibition, upstream failure and byte limit PASS');
