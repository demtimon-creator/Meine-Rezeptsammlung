const assert=require('node:assert/strict'),p=require('../portions.js');
for(const [line,base,want,result] of [
 ['500 g Nudeln',6,2,'167 g Nudeln'],['500 g Nudeln',6,6,'500 g Nudeln'],['0,5 l Milch',4,2,'0,25 l Milch'],['½ TL Salz',4,2,'0,25 TL Salz'],['1 1/2 EL Öl',2,4,'3 EL Öl'],['1½ EL Öl',2,4,'3 EL Öl'],['1/4 TL Pfeffer',2,4,'0,5 TL Pfeffer'],['2 Eier',4,6,'3 Eier'],['1 Dose/n Mais',6,2,'0,333 Dose/n Mais'],['ca. 200g Käse',4,2,'ca. 100g Käse'],['Salz nach Geschmack',4,2,'Salz nach Geschmack'],['Öl nach Bedarf',4,2,'Öl nach Bedarf'],['2–3 Tomaten',4,2,'2–3 Tomaten'],['7-Kräuter-Mischung',4,2,'7-Kräuter-Mischung'],['1/0 TL Salz',4,2,'1/0 TL Salz'],['200 g Mehl',null,2,'200 g Mehl'],['250 ml Wasser',4,2,'125 ml Wasser'],['0,125 kg Mehl',4,2,'0,063 kg Mehl'],['1 kl. Glas Gurken',6,3,'0,5 kl. Glas Gurken']
])assert.equal(p.scale(line,base,want),result,line);
for(const v of ['',null,undefined,0,-1,'abc',Infinity,1001])assert.equal(p.servings(v),null);
assert.equal(p.servings('2,5'),2.5);assert.equal(p.fromYield('6 Portionen'),6);assert.equal(p.fromYield('4 Personen'),4);assert.equal(p.fromYield('1 Kuchen'),null);assert.equal(p.fromYield('4–6 Portionen'),null);
console.log('Portions: decimals, fractions, mixed fractions, units, estimates, rounding, unquantified/range lines, unchanged originals and invalid inputs PASS');
