import {validateRules} from './gifts.js';
const normalized=name=>String(name??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
export function balancedGiftSelection(catalog){
 const items=catalog.filter(g=>/^\d+$/.test(g.id)&&Number.isSafeInteger(g.coins)&&g.coins>0);
 const rose=items.find(g=>['rosa','rose'].includes(normalized(g.name)));
 if(!rose)throw new Error('A rosa não foi encontrada com preço confirmado no catálogo desta live.');
 const counterpart=items.find(g=>g.id!==rose.id&&g.coins===rose.coins&&!['rosa','rose'].includes(normalized(g.name)));
 if(!counterpart)throw new Error('Não há outro presente confirmado com o mesmo valor da rosa neste catálogo.');
 const unused=items.filter(g=>g.id!==rose.id&&g.id!==counterpart.id&&g.coins>rose.coins).sort((a,b)=>a.coins-b.coins||a.name.localeCompare(b.name,'pt-BR'));
 let specials;for(const gift of unused){const match=unused.find(other=>other.id!==gift.id&&other.coins===gift.coins&&normalized(other.name)!==normalized(gift.name));if(match){specials=[gift,match];break;}}
 if(!specials)throw new Error('O catálogo não contém dois especiais distintos de mesmo valor acima da rosa. Configure os especiais manualmente com preços confirmados.');
 const values=[rose,counterpart,...specials];return validateRules(values.map((gift,i)=>({...gift,team:i%2===0?'r':'g',slot:i<2?'normal':'special',kind:i<2?'rose':'special'})));
}
