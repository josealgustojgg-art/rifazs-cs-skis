export function directGiftChoice(team,slot,rules){
 const rule=rules.find(r=>r.team===team&&(r.slot??(r.kind==='special'?'special':'normal'))===slot);
 return {team,kind:rule?.kind??(slot==='special'?'special':'rose')};
}
export function bindGiftButtons(race,getRules){
 for(const button of document.querySelectorAll('[data-gift-team]'))button.onclick=()=>{const gift=directGiftChoice(button.dataset.giftTeam,button.dataset.giftSlot,getRules());race.gift(gift.team,gift.kind);};
}
