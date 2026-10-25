const routes={fetchRoomInfoHtmlRoute:'Página pública do TikTok',fetchRoomInfoApiLiveRoute:'API pública do TikTok',fetchRoomIdFromEulerRoute:'Serviço de assinatura',fetchRoomIdRoute:'Localização da sala',fetchWebcastSignatureFromEulerRoute:'Assinatura da conexão'};
const codes=new Set(['ETIMEDOUT','ECONNREFUSED','ECONNRESET','ENOTFOUND','EAI_AGAIN','CERT_HAS_EXPIRED','UNABLE_TO_VERIFY_LEAF_SIGNATURE','SELF_SIGNED_CERT_IN_CHAIN','ERR_TLS_CERT_ALTNAME_INVALID']);
function records(root){const result=[],seen=new Set();const visit=(error,depth=0)=>{if(!error||typeof error!=='object'||seen.has(error)||depth>5||result.length>=24)return;seen.add(error);result.push(error);for(const child of [error.cause,error.exception,error.config?.requestErr])visit(child,depth+1);for(const list of [error.errors,error.config?.requestErrs])if(Array.isArray(list))for(const child of list)visit(child,depth+1);};visit(root);return result;}
function diagnostic(error){
 const name=String(error.name??'')+' '+String(error.constructor?.name??''),text=String(error.message??'')+' '+String(error.reason??'');const rawStatus=Number(error.response?.statusCode??error.response?.status??error.statusCode);const status=rawStatus>=400&&rawStatus<=599?rawStatus:undefined;
 const code=codes.has(error.code)?error.code:undefined;const route=routes[error.config?.routeId]??(/euler|sign|signature/i.test(name+' '+text)?'Serviço de assinatura':'Conexão TikTok');
 let category='unknown',message='O conector não informou uma causa conclusiva.';
 if(/UserOfflineError/.test(name)||/^(User offline|User not live)$/i.test(text.trim())){category='offline';message='A conta foi informada pelo conector como fora do ar.';}
 else if(/rate.?limit/i.test(name+' '+text)||status===429){category='rate-limit';message='O serviço atingiu um limite de requisições. Aguarde antes de tentar novamente.';}
 else if(code&&/CERT|TLS|SIGNATURE/.test(code)){category='tls';message='Falha na validação do certificado. Confira data/hora do computador e a versão do Node.js.';}
 else if(status===401||status===402||(/lack of permission|PremiumFeature|unauthorized/i.test(name+' '+text))){category='access';message='Uma das fontes do conector recusou o acesso. Isso não confirma que a live esteja offline.';}
 else if(status===403||/\b403\b|forbidden/i.test(text)){category='blocked';message='O destino ou a rede recusou a requisição HTTP 403. A conexão não foi estabelecida.';}
 else if(code||/timeout|timed out/i.test(name+' '+text)){category='network';message='Não foi possível alcançar um dos serviços. Verifique a conexão e tente novamente após corrigir a rede.';}
 else if(/SIGI_STATE|extract.*HTML/i.test(text)){category='page-format';message='O conector não conseguiu ler a página pública; pode haver bloqueio ou mudança no TikTok.';}
 else if(/retrieve Room ID|extract Room ID/i.test(text)){category='room';message='Não foi possível localizar a sala. Confirme o @ e se a live pública já começou; a prévia do LIVE Studio não conta como live.';}
 return {route,category,message,...(status?{httpStatus:status}:{}),...(code?{code}:{})};
}
export function connectionFailure(error){
 const entries=records(error).map(diagnostic);const diagnostics=entries.filter((e,i,a)=>a.findIndex(other=>JSON.stringify(other)===JSON.stringify(e))===i);
 const priority=['offline','rate-limit','tls','access','blocked','network','page-format','room','unknown'];let chosen;
 // An explicit root offline result is authoritative; an isolated failing fallback is not.
 if(diagnostics[0]?.category==='offline')chosen=diagnostics[0];else for(const category of priority.filter(x=>x!=='offline')){chosen=diagnostics.find(d=>d.category===category);if(chosen)break;}
 chosen??={category:'unknown',message:'Não foi possível conectar. Confirme o @, a live pública e o acesso à rede.'};
 return {category:chosen.category,message:chosen.category==='offline'?'Esta conta não está ao vivo. Clique em Iniciar LIVE no TikTok, aguarde o início da transmissão e conecte novamente.':chosen.message,diagnostics};
}
