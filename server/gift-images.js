export function safeGiftImage(value){
 if(typeof value!=='string'||value.length>4096)return '';
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}
}
export function giftCoins(value){const number=Number(value);return value!==null&&value!==undefined&&Number.isSafeInteger(number)&&number>=0?number:null;}
export function catalogGift(gift){
 const images=gift.image?.url_list??gift.image?.urlList??gift.image?.urls??gift.icon?.url_list??[];
 const urls=Array.isArray(images)?images:[];
 return {id:String(gift.id??gift.giftId),name:String(gift.name??gift.giftName??gift.describe??`Presente ${gift.id??gift.giftId}`),coins:giftCoins(gift.diamond_count??gift.diamondCount??gift.coins),imageUrl:urls.map(safeGiftImage).find(Boolean)||safeGiftImage(gift.imageUrl)||safeGiftImage(gift.imageUri)||''};
}
