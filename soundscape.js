// Original ambient score. All notes, synthesis and reverberation are local;
// no streaming service, downloaded recording or network connection is needed.
export function setupSoundscape() {
  const button=document.querySelector('#sound-toggle');let context,master,buses=[],enabled=false,world=0,opened=false,timer,nextBar=0,bar=0,analyser;
  const chords=[[50,57,62,65],[46,53,58,62],[48,55,60,64],[45,52,57,62]];
  const frequency=n=>440*2**((n-69)/12);
  function tone(bus,note,start,duration,gain=.055,bell=false){
    const envelope=context.createGain();envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(gain,start+(bell?.015:1.5));envelope.gain.setTargetAtTime(.0001,start+duration*.62,bell?.9:1.9);
    envelope.connect(bus);
    for(const [ratio,level,detune] of bell?[[1,1,0],[2.76,.19,1],[5.4,.045,-2]]:[[1,.75,-4],[1,.55,4],[2,.10,0]]){
      const oscillator=context.createOscillator(),part=context.createGain();oscillator.type='sine';oscillator.frequency.value=frequency(note)*ratio;oscillator.detune.value=detune;part.gain.value=level;oscillator.connect(part);part.connect(envelope);oscillator.start(start);oscillator.stop(start+duration+5);oscillator.onended=()=>{oscillator.disconnect();part.disconnect();};
    }
    setTimeout(()=>envelope.disconnect(),(start-context.currentTime+duration+6)*1000);
  }
  function schedule(){
    if(!context||context.state!=='running')return;
    while(nextBar<context.currentTime+1.5){
      const chord=chords[bar%chords.length];
      for(let scene=0;scene<3;scene++){
        chord.forEach((note,i)=>tone(buses[scene],note+(scene===0?12:0),nextBar+i*.17,15,scene===1?.038:.027));
        const pattern=scene===2?[12,19,24,19]:[24,19,17,12];
        pattern.forEach((interval,i)=>tone(buses[scene],chord[0]+interval,nextBar+2+i*2.2,4.8,scene===2?.018:.025,true));
      }
      nextBar+=12;bar++;
    }
  }
  function mix(){if(!context)return;const now=context.currentTime;master.gain.setTargetAtTime(enabled?(opened?.055:.28):0,now,.6);buses.forEach((bus,i)=>bus.gain.setTargetAtTime(i===world?1:0,now,1.2));}
  function initialize(){
    context=new (window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=0;
    const compressor=context.createDynamicsCompressor();compressor.threshold.value=-22;compressor.ratio.value=3;
    analyser=context.createAnalyser();analyser.fftSize=256;master.connect(compressor);compressor.connect(analyser);analyser.connect(context.destination);
    const reverb=context.createConvolver(),length=Math.floor(context.sampleRate*3.3),impulse=context.createBuffer(2,length,context.sampleRate);
    let seed=81;for(let c=0;c<2;c++){const channel=impulse.getChannelData(c);for(let i=0;i<length;i++){seed=(1664525*seed+1013904223)>>>0;channel[i]=((seed/4294967296)*2-1)*(1-i/length)**3*.28;}}reverb.buffer=impulse;
    const wet=context.createGain();wet.gain.value=.48;reverb.connect(wet);wet.connect(master);
    buses=[0,1,2].map(()=>{const bus=context.createGain();bus.gain.value=0;const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2800;bus.connect(filter);filter.connect(master);filter.connect(reverb);return bus;});
    nextBar=context.currentTime+.12;timer=setInterval(schedule,350);
  }
  button.onclick=async()=>{
    try{if(!context)initialize();enabled=!enabled;if(enabled){await context.resume();schedule();}mix();button.setAttribute('aria-pressed',String(enabled));button.title=enabled?'关闭背景音乐':'开启背景音乐';button.setAttribute('aria-label',button.title);button.dataset.playing=String(enabled);}
    catch(error){enabled=false;button.title='声音暂时无法播放，点击重试';console.warn('Ambient score unavailable',error.message);}
  };
  document.addEventListener('visibilitychange',async()=>{if(!context)return;if(document.hidden)await context.suspend();else if(enabled){await context.resume();schedule();mix();}});
  addEventListener('pagehide',()=>{clearInterval(timer);context?.close();});
  return {update(scene,duck){if(scene!==world||Boolean(duck)!==opened){world=scene;opened=Boolean(duck);mix();}},get state(){
    let rms=0;if(analyser){const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);rms=Math.sqrt(data.reduce((sum,x)=>sum+x*x,0)/data.length);}
    return {enabled,world,ducked:opened,context:context?.state||'uninitialized',rms};
  }};
}
