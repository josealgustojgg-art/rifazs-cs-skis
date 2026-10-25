import {catalogGift} from './gift-images.js';
import {connectionFailure} from './connection-errors.js';
function listItems(value){const items=Array.isArray(value)?value:value?.gifts??value?.data?.gifts;return Array.isArray(items)?items:null;}
function normalize(items){return items.map(catalogGift).filter(g=>/^\d+$/.test(g.id)&&Number(g.id)>0);}
export async function referenceCatalog(client){
 const api=client.apiClient?.gifts;if(typeof api?.listWebcastGifts!=='function')throw new Error('Consulta alternativa indisponível nesta versão do conector.');
 const map=new Map();let totalPages=1;
 for(let page=1;page<=Math.min(totalPages,3);page++){
  const response=await api.listWebcastGifts(100,page,undefined,true,{timeout:10000});const data=response.data;if(response.status>=400){const error=new Error('O provedor recusou o catálogo de referência.');error.statusCode=response.status;if([401,403].includes(response.status))error.name='CatalogAuthorizationError';throw error;}
  if(Number(data?.code)>=400){const error=new Error('O provedor recusou o catálogo de referência.');error.statusCode=Number(data.code);if([401,403].includes(error.statusCode))error.name='CatalogAuthorizationError';throw error;}
  const items=listItems(data);if(!items?.length){if(page===1)throw new Error('O catálogo de referência veio vazio.');break;}
  for(const gift of normalize(items))map.set(gift.id,gift);
  const pages=Number(data.totalPages);totalPages=Number.isSafeInteger(pages)&&pages>0?pages:1;
 }
 if(!map.size)throw new Error('O catálogo não contém IDs válidos.');return {items:[...map.values()],source:'reference'};
}
export async function loadGiftCatalog(client,{live=false}={}){
 if(live){try{const raw=await client.fetchAvailableGifts();const items=listItems(raw);if(!items?.length)throw new Error('Catálogo da sala vazio.');return {items:normalize(items),source:'room'};}catch(error){if(connectionFailure(error).category!=='signature-missing')throw error;try{return await referenceCatalog(client);}catch(fallback){const combined=new Error('Os dois métodos de catálogo falharam.');combined.cause=fallback;combined.errors=[error];throw combined;}}}
 // This is the SDK's documented reference catalog, not an unsigned TikTok request.
 return referenceCatalog(client);
}
