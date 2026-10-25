export class AudioFX {
 enabled=false;
 async toggle(){this.context??=new AudioContext();await this.context.resume();this.enabled=!this.enabled;return this.enabled;}
 play(special=false){if(!this.enabled||!this.context)return;const c=this.context;[0,1,2,special?3:2].forEach((n,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=[440,554,659,880][n];g.gain.setValueAtTime(0,c.currentTime+i*.09);g.gain.linearRampToValueAtTime(.065,c.currentTime+i*.09+.015);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+i*.09+.3);o.connect(g);g.connect(c.destination);o.start(c.currentTime+i*.09);o.stop(c.currentTime+i*.09+.32);});}
}
