type SoundName='click'|'step'|'success'|'error'|'combat'|'gather'|'level'|'ambient';

/** Browser-only audio feedback. No external assets, autoplay-safe, and disposable. */
export class RealmAudio {
 private context:AudioContext|undefined;
 private master:GainNode|undefined;
 private music:GainNode|undefined;
 private timer:number|undefined;
 private enabled=true;
 private volume=.42;
 private started=false;
 private lastStep=-Infinity;
 private readonly frequencies=[196,246.94,293.66,392,293.66,246.94];
 private getContext(){if(typeof window==='undefined')return;const Audio=window.AudioContext||(window as typeof window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!Audio)return;this.context??=new Audio();this.master??=this.context.createGain();this.master.gain.value=this.volume;this.master.connect(this.context.destination);return this.context;}
 setEnabled(value:boolean){this.enabled=value;if(this.master)this.master.gain.value=value?this.volume:0;}
 setVolume(value:number){if(!Number.isFinite(value)||value<0||value>1)throw new Error('Invalid audio volume');this.volume=value;if(this.master&&this.enabled)this.master.gain.value=value;}
 get isEnabled(){return this.enabled;}
 get currentVolume(){return this.volume;}
 async start(){if(!this.enabled)return;const c=this.getContext();if(!c)return;if(c.state==='suspended')await c.resume();if(this.started)return;this.started=true;this.music=c.createGain();this.music.gain.value=.16;this.music.connect(this.master!);this.scheduleMusic();}
 private scheduleMusic(){if(!this.context||!this.music||!this.started)return;const c=this.context,now=c.currentTime+.04;this.frequencies.forEach((frequency,index)=>{const osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,now+index*.72);gain.gain.linearRampToValueAtTime(.22,now+index*.72+.08);gain.gain.exponentialRampToValueAtTime(.001,now+index*.72+.62);osc.connect(gain);gain.connect(this.music!);osc.start(now+index*.72);osc.stop(now+index*.72+.7);});this.timer=window.setTimeout(()=>this.scheduleMusic(),4300);}
 private tone(frequency:number,duration:number,type:OscillatorType='sine',gainValue=.12,when=0){if(!this.enabled)return;const c=this.getContext();if(!c||!this.master)return;const osc=c.createOscillator(),gain=c.createGain(),start=c.currentTime+when;osc.type=type;osc.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(gainValue,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(this.master);osc.start(start);osc.stop(start+duration+.03);}
 play(sound:SoundName){if(!this.enabled)return;switch(sound){case'click':this.tone(520,.055,'triangle',.08);break;case'step':{const now=performance.now();if(now-this.lastStep<120)return;this.lastStep=now;this.tone(110,.045,'triangle',.035);break;}case'success':this.tone(392,.12,'sine',.1);this.tone(523.25,.2,'sine',.09,.1);break;case'error':this.tone(150,.16,'sawtooth',.07);break;case'combat':this.tone(92,.08,'square',.08);this.tone(180,.12,'triangle',.06,.05);break;case'gather':this.tone(260,.09,'triangle',.07);this.tone(390,.16,'sine',.06,.08);break;case'level':this.tone(523.25,.12,'sine',.1);this.tone(659.25,.2,'sine',.09,.11);this.tone(783.99,.3,'sine',.08,.22);break;case'ambient':this.tone(196,.4,'sine',.025);}}
 dispose(){if(this.timer!==undefined)window.clearTimeout(this.timer);this.timer=undefined;this.started=false;this.music?.disconnect();this.master?.disconnect();this.context?.close();this.music=undefined;this.master=undefined;this.context=undefined;}
}
