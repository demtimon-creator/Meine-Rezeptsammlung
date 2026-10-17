import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chefkochURL,extractRecipe,loadRecipe} from '../supabase/functions/chefkoch-import/extract.mjs';
const url='https://www.chefkoch.de/rezepte/123456/Test-Rezept.html';
const recipe={'@type':['Recipe'],name:'Test &amp; Gemüse',recipeYield:['4','4 Portionen'],recipeIngredient:['250 g Möhren','½ TL Salz','Öl nach Bedarf']};
const html=r=>'<script type="application/ld+json">'+JSON.stringify(r)+'</script>';
assert.equal(chefkochURL(url+'?utm_source=sharing#abc'),url);
for(const bad of ['http://www.chefkoch.de/rezepte/123456/Test-Rezept.html','https://www.chefkoch.de.evil.com/rezepte/123456/Test-Rezept.html','https://127.0.0.1/','https://www.chefkoch.de:123/rezepte/123456/Test-Rezept.html','https://user@www.chefkoch.de/rezepte/123456/Test-Rezept.html','https://www.chefkoch.de/redirect?url=http://localhost'])assert.throws(()=>chefkochURL(bad));
const r=extractRecipe(html({'@graph':[{'@type':'WebPage'},recipe]}),url);
assert.equal(r.name,'Test & Gemüse');assert.equal(r.servings,'4 Portionen');assert.deepEqual(r.ingredients,recipe.recipeIngredient);
assert.throws(()=>extractRecipe('<html>Keine Zutaten</html>',url));
assert.throws(()=>extractRecipe(html({...recipe,recipeIngredient:[]}),url));
assert.equal(extractRecipe(html({'@type':'WebPage',mainEntity:recipe}),url).ingredients.length,3);
assert.equal((await loadRecipe(url,async (u,opts)=>{assert.equal(opts.redirect,'error');return new Response(html(recipe),{headers:{'content-type':'text/html'}})})).ingredients.length,3);
await assert.rejects(loadRecipe(url,async()=>new Response('blocked',{status:403,headers:{'content-type':'text/html'}})));
await assert.rejects(loadRecipe(url,async()=>new Response('x'.repeat(2000001),{headers:{'content-type':'text/html'}})));
if(process.env.CHEFKOCH_HTML){const real=extractRecipe(readFileSync(process.env.CHEFKOCH_HTML,'utf8'),'https://www.chefkoch.de/rezepte/141811061122586/Nudelsalat-Klassik.html');assert.equal(real.ingredients.length,10);assert.equal(real.servings,'6 Portionen');assert.equal(real.ingredients[0],'500 g Nudeln (Spiralnudeln)');assert.equal(real.ingredients.at(-1),'Gurkenflüssigkeit');console.log('Provided Chefkoch page: 10 ingredients, quantities, servings, canonical URL PASS');}
console.log('Chefkoch structured data, graph/array/mainEntity, umlauts, quantities, invalid input, SSRF restrictions, blocked page, size limit PASS');

for(const [value,expected] of [
 ['Einfach umrühren.','Einfach umrühren.'],
 [['Schneiden.','Kochen.'],'Schneiden.\n\nKochen.'],
 [[{'@type':'HowToSection',name:'Zubereitung',itemListElement:[{'@type':'HowToStep',text:'<b>Öl</b> erhitzen.'},{'@type':'HowToStep',text:'Gemüse &amp; Nudeln zugeben.'}]}],'Öl erhitzen.\n\nGemüse & Nudeln zugeben.'],
 [undefined,''],[{'@type':'HowToStep',text:'A'.repeat(1800)},'A'.repeat(1800)]
])assert.equal(extractRecipe(html({...recipe,recipeInstructions:value}),url).steps,expected);
assert.throws(()=>extractRecipe(html({...recipe,recipeInstructions:'A'.repeat(25001)}),url));
console.log('Instructions: strings, step arrays, nested sections, HTML/entities, missing steps and length bounds PASS');
