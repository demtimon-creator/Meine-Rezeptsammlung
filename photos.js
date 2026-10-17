(function(root){
'use strict';
function url(value){try{const u=new URL(value);if(u.protocol!=='https:'||u.hostname!=='img.chefkoch-cdn.de'||u.username||u.password||u.port||!/^\/rezepte\/\d+\/bilder\/\d+\/[^?#]+\.(?:jpe?g|png|webp|avif)$/i.test(u.pathname))return null;u.hash='';u.search='';return u.href.length<=2000?u.href:null}catch{return null}}
const api={url};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RecipePhotos=api;
})(typeof window!=='undefined'?window:globalThis);
