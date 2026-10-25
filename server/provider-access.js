import EulerStreamApiClient from 'tiktok-live-api-sdk';
export class ProviderAccess {
 constructor(environment=process.env){this.environmentKey=environment.EULER_API_KEY||environment.SIGN_API_KEY||'';this.sessionKey='';}
 get key(){return this.sessionKey||this.environmentKey;}
 setKey(value){if(typeof value!=='string'||!value.trim()||value.length>4096||/[\r\n]/.test(value))throw new Error('Informe uma chave válida do provedor no campo protegido.');this.sessionKey=value.trim();}
 summary(){return {configured:Boolean(this.key),source:this.sessionKey?'session':this.environmentKey?'environment':'none'};}
 client(){return new EulerStreamApiClient({apiKey:this.key||undefined,basePath:'https://api.eulerstream.com',baseOptions:{timeout:10000,validateStatus:()=>true,headers:{'User-Agent':'corrida-planalto/1.0'}}});}
}
