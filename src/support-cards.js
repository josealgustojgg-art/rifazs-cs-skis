import {FACE_ATLAS} from './faces.js';
export function initSupportCards(){for(const portrait of document.querySelectorAll('.candidate-portrait'))portrait.style.backgroundImage=`url("${FACE_ATLAS}")`;}
export function renderSupportCards(rules,catalog){
 for(const team of ['r','g']){
  const rule=rules.find(r=>r.team===team),item=rule&&(catalog.find(g=>g.id===rule.id)??rule);
  const image=document.getElementById('mapped-gift-image-'+team),placeholder=document.getElementById('mapped-gift-placeholder-'+team),name=document.getElementById('mapped-gift-name-'+team),cost=document.getElementById('mapped-gift-cost-'+team);
  name.textContent=rule?.name??'Presente não configurado';document.getElementById('gift-call-'+team).textContent=rule?'ENVIE ESTE PRESENTE':'PRESENTE DESTE CORREDOR';
  cost.textContent=rule?(item?.coins!=null?`${item.coins} ${item.coins===1?'moeda':'moedas'}`:'Valor não informado pelo catálogo'):'Escolha no painel abaixo';
  const url=item?.imageUrl||rule?.imageUrl||'';
  if(url&&image.dataset.url!==url){image.dataset.url=url;image.hidden=true;placeholder.hidden=false;image.alt=`Presente ${rule.name} para ${team==='r'?'Lula':'Flávio'}`;image.onload=()=>{if(image.dataset.url===url){image.hidden=false;placeholder.hidden=true;}};image.onerror=()=>{if(image.dataset.url===url){image.hidden=true;placeholder.hidden=false;cost.textContent='Imagem indisponível · confira o nome';}};image.src=url;
  }else if(!url){image.dataset.url='';image.removeAttribute('src');image.hidden=true;placeholder.hidden=false;image.alt='';}
 }
}
