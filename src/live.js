export class LiveClient {
 constructor(race,{onInfo,onStatus,onError}){Object.assign(this,{race,onInfo,onStatus,onError});this.connected=false;this.serverDriven=false;this.closed=false;this.local={gift:race.gift.bind(race),reset:race.reset.bind(race),toggle:race.toggle.bind(race)};
  race.gift=(team,kind,quantity=1)=>{if(this.serverDriven){if(quantity!==1)return false;this.control({action:'gift',team,kind});return this.connected;}return this.local.gift(team,kind,quantity);};
  race.reset=()=>{if(this.serverDriven)this.control({action:'reset'});else this.local.reset();};race.toggle=()=>{if(this.serverDriven)this.control({action:'pause'});else this.local.toggle();};
  if(location.protocol==='http:'||location.protocol==='https:')this.connect();else onStatus('Arquivo HTML independente: sem ponte TikTok. Use o servidor local.');
 }
 connect(){if(this.closed)return;const socket=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/live`);this.socket=socket;
  socket.onopen=()=>{this.connected=true;this.serverDriven=true;this.onStatus('Servidor local conectado.');};
  socket.onmessage=event=>{try{const data=JSON.parse(event.data);if(data.type==='state'){const state=data.race;for(const key of ['round','time','ended','paused','winner','restartIn','runners','autoRestart'])this.race[key]=state[key];this.race.config.duration=state.duration;}else if(data.type==='event'){if(data.event==='gift'||data.event==='finish'||data.event==='reset')this.race.emit(data.event,data.detail);}else if(data.type==='connection')this.onInfo(data);}catch{this.onError('Não foi possível interpretar os dados do servidor local.');}};
  socket.onclose=()=>{this.connected=false;this.onStatus('Sem conexão com o servidor local. Mantenha INICIAR-WINDOWS.bat aberto.');this.retry=setTimeout(()=>this.connect(),2500);};socket.onerror=()=>{};
 }
 async request(path,value={}){try{const response=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});const data=await response.json();if(!response.ok)throw new Error(data.error||'Falha no servidor local.');return data;}catch(error){this.onError(error.message);throw error;}}
 control(value){if(!this.connected){this.onError('Servidor local desconectado.');return;}void this.request('control',value).catch(()=>{});}
 close(){this.closed=true;clearTimeout(this.retry);this.socket?.close();}
}
