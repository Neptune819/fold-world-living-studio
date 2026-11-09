import {measureHand} from './hand-mapping.js';

const $ = selector => document.querySelector(selector);
if(new URLSearchParams(location.search).get('embedded')==='1')document.body.classList.add('embedded');
const canvas = $('#tides'), ctx = canvas.getContext('2d', {alpha:false});
const video = $('#webcam'), overlay = $('#hand-overlay'), overlayContext = overlay.getContext('2d');
const cameraButton = $('#camera-toggle'), cameraPanel = $('#camera-panel'), previewWrap = $('#preview-wrap');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = {camera:'off', source:'pointer', hand:false, pinching:false, pointerDown:false, paused:false,
  x:0.62, y:0.43, targetX:0.62, targetY:0.43, gather:0, targetGather:0, waves:[], frames:0, detections:0, lastHand:0};
let width=1, height=1, dpr=1, clock=0, lastFrame=0, lastInference=0, lastVideoTime=-1;
let stream=null, detector=null, modelPromise=null, cameraGeneration=0, cameraWanted=false, pointerMovedAt=0;
let userPaused=false, parentPaused=false, visible=true, animationFrame=0;
let cameraConnections=[];
const stars = [], motes = [];
let seed=3127;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<156;i++)stars.push({x:random(),y:random()*.7,r:random()*.9+.25,a:random()*.65+.2,phase:random()*6.28});
for(let i=0;i<390;i++)motes.push({angle:random()*6.28,radius:random()**.65,speed:random()*.6+.2,size:random()*1.2+.45,phase:random()*6.28,band:random()});

function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.8);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(state.paused)draw(0);}
function status(kind,label,gesture){$('#status-dot').dataset.state=kind;$('#mode-label').textContent=label;if(gesture!==undefined)$('#gesture-label').textContent=gesture;}
function message(text=''){$('#camera-message').textContent=text;}
function ripple(x=state.x,y=state.y,strength=1){state.waves.push({x,y,r:0,life:1,strength});if(state.waves.length>12)state.waves.shift();if(state.paused)draw(0);}
function releaseGather(){if(state.targetGather>.4||state.pinching)ripple(state.targetX,state.targetY,1.4);state.targetGather=0;state.pinching=false;}
function pointerPosition(event){if(state.hand&&state.camera==='on')return;pointerMovedAt=performance.now();state.source='pointer';state.targetX=event.clientX/width;state.targetY=event.clientY/height;}
canvas.addEventListener('pointermove',pointerPosition);
canvas.addEventListener('pointerdown',event=>{pointerPosition(event);if(state.hand&&state.camera==='on')return;canvas.setPointerCapture?.(event.pointerId);state.pointerDown=true;state.targetGather=1;$('#gesture-label').textContent='Gathering light';});
function pointerRelease(event){if(event&&canvas.hasPointerCapture?.(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(!state.pointerDown)return;state.pointerDown=false;releaseGather();if(!state.hand)$('#gesture-label').textContent='Release a wave';}
canvas.addEventListener('pointerup',pointerRelease);canvas.addEventListener('pointercancel',pointerRelease);addEventListener('pointerup',pointerRelease);
$('#release-wave').onclick=()=>ripple(width<700?.66:.62,.58,1.4);

async function loadModel(){
  if(detector)return detector;
  if(!modelPromise)modelPromise=(async()=>{
    const {HandLandmarker,FilesetResolver}=await import('./vendor/vision_bundle.mjs');
    const vision=await FilesetResolver.forVisionTasks(new URL('./vendor/wasm/',import.meta.url).href);
    const created=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:new URL('./models/hand_landmarker.task',import.meta.url).href,delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.55,minHandPresenceConfidence:.55,minTrackingConfidence:.55});
    cameraConnections=HandLandmarker.HAND_CONNECTIONS;
    detector=created;return created;
  })().catch(error=>{modelPromise=null;throw error;});
  return modelPromise;
}
async function startCamera(){
  if(cameraWanted)return;
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){state.camera='error';status('error','Camera unavailable','Pointer mode is ready');message('Open this work using HTTPS in a browser with camera support. You can still use your pointer.');return;}
  cameraWanted=true;const generation=++cameraGeneration;
  state.camera='loading';cameraButton.disabled=true;cameraButton.textContent='Opening camera…';status('loading','Opening camera','Approve the browser request');message('Camera access is optional. Frames stay in your browser.');
  try{
    // Ask for the camera before downloading the model, so refusal does not incur the ML download.
    const requested=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}},audio:false});
    if(generation!==cameraGeneration||!cameraWanted){requested.getTracks().forEach(track=>track.stop());return;}
    stream=requested;video.srcObject=stream;await video.play();
    status('loading','Loading hand model','First use may take a moment');cameraButton.textContent='Stop camera';cameraButton.disabled=false;cameraButton.dataset.active='true';cameraPanel.hidden=false;
    await loadModel();
    if(generation!==cameraGeneration||!cameraWanted)return;
    state.camera='on';state.source='camera';lastVideoTime=-1;lastInference=0;status('pointer','Camera ready','Show one hand');message('Move one hand · Pinch thumb and index finger · Open to release');$('#instruction').textContent='Move your hand · Pinch to gather · Open to ripple';
    stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{if(cameraWanted)stopCamera('Camera connection ended. Pointer mode is ready.');},{once:true}));
  }catch(error){
    if(generation!==cameraGeneration)return;
    const denied=error.name==='NotAllowedError'||error.name==='PermissionDeniedError';
    stopCamera();state.camera='error';status('error',denied?'Camera permission declined':'Camera unavailable','Pointer mode is ready');
    message(denied?'Camera access was not granted. Use your pointer, or enable permission in your browser and try again.':error.name==='NotFoundError'?'No camera was found. You can use your pointer instead.':'The camera or hand model could not start. Use your pointer, or check the connection and try again.');
    console.warn('Moon Tides camera:',error.name,error.message);
  }finally{if(generation===cameraGeneration)cameraButton.disabled=false;}
}
function stopCamera(text='Camera stopped. Pointer mode is ready.'){
  cameraWanted=false;cameraGeneration++;stream?.getTracks().forEach(track=>track.stop());stream=null;
  video.pause();video.srcObject=null;state.camera='off';state.hand=false;state.source='pointer';state.pointerDown=false;releaseGather();cameraButton.disabled=false;cameraButton.dataset.active='false';cameraButton.textContent='Enable camera';cameraPanel.hidden=true;overlayContext.clearRect(0,0,overlay.width,overlay.height);
  status('pointer','Pointer mode','Move to draw the stars');message(text);$('#instruction').textContent='Move your pointer · Hold to gather · Release to ripple';
}
cameraButton.onclick=()=>cameraWanted?stopCamera():startCamera();
$('#preview-toggle').onclick=()=>{previewWrap.hidden=!previewWrap.hidden;$('#preview-toggle').textContent=previewWrap.hidden?'Show preview':'Hide preview';$('#preview-toggle').setAttribute('aria-expanded',String(!previewWrap.hidden));};

function acceptHand(landmarks,timestamp){
  const hand=measureHand(landmarks);
  if(!hand)return false;
  state.hand=true;state.source='camera';state.lastHand=timestamp;
  state.targetX=hand.x;state.targetY=hand.y;state.targetGather=hand.gather;
  // Separate close/open thresholds avoid rapid repeat triggers near the boundary.
  if(!state.pinching&&hand.pinchRatio<.32)state.pinching=true;
  else if(state.pinching&&hand.pinchRatio>.52){state.pinching=false;ripple(hand.x,hand.y,1.6);}
  status('tracking','Hand connected',state.pinching?'Gathering light':'Move · Pinch · Release');
  if(!previewWrap.hidden){
    overlayContext.clearRect(0,0,overlay.width,overlay.height);overlayContext.strokeStyle='#d8dbba';overlayContext.lineWidth=1.4;overlayContext.fillStyle='#f3e5bd';
    for(const {start,end} of cameraConnections){const a=landmarks[start],b=landmarks[end];overlayContext.beginPath();overlayContext.moveTo(a.x*overlay.width,a.y*overlay.height);overlayContext.lineTo(b.x*overlay.width,b.y*overlay.height);overlayContext.stroke();}
    for(const p of landmarks){overlayContext.beginPath();overlayContext.arc(p.x*overlay.width,p.y*overlay.height,2.2,0,Math.PI*2);overlayContext.fill();}
  }
  return true;
}
function infer(timestamp){
  if(state.camera!=='on'||!detector||video.readyState<2||video.currentTime===lastVideoTime||timestamp-lastInference<80)return;
  lastInference=timestamp;lastVideoTime=video.currentTime;
  try{
    const result=detector.detectForVideo(video,timestamp);state.detections++;
    if(result.landmarks?.[0])acceptHand(result.landmarks[0],timestamp);
    else if(state.hand&&timestamp-state.lastHand>240){state.hand=false;state.source='pointer';releaseGather();overlayContext.clearRect(0,0,overlay.width,overlay.height);status('pointer','Camera ready','Show one hand · Or use your pointer');}
  }catch(error){stopCamera('Hand tracking stopped. Pointer mode is ready.');state.camera='error';status('error','Tracking unavailable','Pointer mode is ready');console.warn('Moon Tides tracking:',error.message);}
}

function draw(dt){
  const t=clock,small=width<700,moonX=width*(small?.61:.66),moonY=height*(small?.30:.28),moonR=Math.min(width,height)*(small?.057:.065),horizon=height*.57;
  const ground=ctx.createLinearGradient(0,0,0,height);ground.addColorStop(0,'#07131f');ground.addColorStop(.54,'#18334b');ground.addColorStop(.58,'#112c40');ground.addColorStop(1,'#061725');ctx.fillStyle=ground;ctx.fillRect(0,0,width,height);
  const glow=ctx.createRadialGradient(moonX,moonY,moonR*.5,moonX,moonY,Math.min(width,height)*.54);glow.addColorStop(0,'#adc4c31a');glow.addColorStop(.35,'#739aab0b');glow.addColorStop(1,'#739aab00');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  for(const s of stars){ctx.fillStyle=`rgba(218,228,223,${s.a*(.65+Math.sin(t*.32+s.phase)*.15)})`;ctx.beginPath();ctx.arc(s.x*width,s.y*horizon,s.r,0,Math.PI*2);ctx.fill();}
  // Fine orbital construction lines connect this work to the instruments in Fold World.
  ctx.strokeStyle='#c4cbbb1a';ctx.lineWidth=.65;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(moonX,moonY,moonR*(2.05+i*.65),moonR*(.65+i*.21),-.44+i*.36,0,Math.PI*2);ctx.stroke();}
  ctx.beginPath();ctx.arc(moonX,moonY,moonR*1.35,0,Math.PI*2);ctx.stroke();
  const moon=ctx.createRadialGradient(moonX-moonR*.35,moonY-moonR*.35,moonR*.1,moonX,moonY,moonR);moon.addColorStop(0,'#f3eed8');moon.addColorStop(.68,'#dadcc7');moon.addColorStop(1,'#b3c1b9');ctx.fillStyle=moon;ctx.shadowColor='#c2d3c25e';ctx.shadowBlur=30;ctx.beginPath();ctx.arc(moonX,moonY,moonR,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.save();ctx.beginPath();ctx.arc(moonX,moonY,moonR,0,Math.PI*2);ctx.clip();ctx.fillStyle='#6c8e9610';for(let i=0;i<13;i++){const x=Math.sin(i*7.1)*moonR*.9,y=Math.cos(i*3.7)*moonR*.8;ctx.beginPath();ctx.ellipse(moonX+x,moonY+y,moonR*(.06+(i%4)*.025),moonR*(.1+(i%3)*.035),i,0,Math.PI*2);ctx.fill();}ctx.restore();
  // Low silhouettes and thin reflected lines form the sea without covering the interaction.
  ctx.fillStyle='#0c2334';ctx.beginPath();ctx.moveTo(0,horizon+8);ctx.lineTo(0,horizon-18);for(let i=0;i<=16;i++)ctx.lineTo(width*i/16,horizon-Math.sin(i*2.3)**2*18-2);ctx.lineTo(width,horizon+10);ctx.fill();
  for(let i=0;i<57;i++){
    const p=i/56,y=horizon+5+p*p*(height-horizon),amp=2+p*5,xspread=moonR*(.2+p*3.2),middle=moonX+Math.sin(t*.22+i*.8)*xspread*.12;
    ctx.strokeStyle=`rgba(194,213,205,${.018+(1-p)*.018})`;ctx.lineWidth=.7;ctx.beginPath();
    for(let j=0;j<=30;j++){const x=j*width/30,offset=Math.sin(x*.008+t*.27+i*.8)*amp;if(j===0)ctx.moveTo(x,y+offset);else ctx.lineTo(x,y+offset);}ctx.stroke();
    ctx.strokeStyle=`rgba(212,219,185,${.12*(1-p)+.015})`;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(middle-xspread*(.3+Math.sin(i*3.5)**2),y);ctx.lineTo(middle+xspread*(.3+Math.cos(i*2.7)**2),y+Math.sin(t*.4+i)*2);ctx.stroke();
  }
  const centreX=state.x*width,centreY=state.y*height;
  const anchorX=width*(small?.61:.65),anchorY=height*.48,base=Math.min(width*.37,height*.39),g=state.gather;
  ctx.save();ctx.globalCompositeOperation='screen';
  for(const m of motes){
    const angle=m.angle+t*.035*m.speed;
    const radius=base*m.radius*(1-g*.82),drift=Math.sin(t*.28+m.phase)*(8+10*m.radius);
    const x=(anchorX*(1-g*.88)+centreX*g*.88)+Math.cos(angle)*radius+drift;
    const y=(anchorY*(1-g*.88)+centreY*g*.88)+Math.sin(angle)*radius*.37+Math.sin(t*.17+m.phase)*8;
    const a=(.13+(1-m.radius)*.5)+g*.18;
    ctx.strokeStyle=m.band>.25?`rgba(183,213,222,${a})`:`rgba(221,208,160,${a})`;ctx.lineWidth=m.size*.65;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.sin(angle)*(2+m.radius*4)*(1-g*.7),y+Math.cos(angle)*(1+m.radius*2)*(1-g*.7));ctx.stroke();
  }
  if(g>.05){const light=ctx.createRadialGradient(centreX,centreY,0,centreX,centreY,34+g*30);light.addColorStop(0,`rgba(225,220,170,${g*.17})`);light.addColorStop(1,'rgba(225,220,170,0)');ctx.fillStyle=light;ctx.fillRect(centreX-70,centreY-70,140,140);}
  for(const wave of state.waves){
    wave.r+=dt*(85+wave.strength*28);wave.life-=dt*.23;
    for(let i=0;i<3;i++){const r=Math.max(1,wave.r-i*9);ctx.strokeStyle=`rgba(209,224,208,${Math.max(0,wave.life)*(.28-i*.065)})`;ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(wave.x*width,wave.y*height,r,r*.25,0,0,Math.PI*2);ctx.stroke();}
  }
  ctx.restore();state.waves=state.waves.filter(w=>w.life>0);
  if(state.hand||state.pointerDown){ctx.strokeStyle='#e0d9ab70';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(centreX,centreY,7+(1-g)*7,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(centreX-20,centreY);ctx.lineTo(centreX-15,centreY);ctx.moveTo(centreX+15,centreY);ctx.lineTo(centreX+20,centreY);ctx.stroke();}
}

function animate(timestamp){
  animationFrame=0;
  if(!visible||state.paused)return;
  const dt=Math.min(.05,(timestamp-lastFrame)/1000||.016);lastFrame=timestamp;
  if(reducedMotion&&state.frames%2!==0){state.frames++;animationFrame=requestAnimationFrame(animate);return;}
  clock+=dt*(reducedMotion?.3:1);state.frames++;
  infer(timestamp);
  if(!state.hand&&!state.pointerDown&&timestamp-pointerMovedAt>5500){state.targetX=.64+Math.sin(clock*.12)*.07;state.targetY=.43+Math.cos(clock*.15)*.035;}
  const smoothing=1-Math.exp(-dt*7);state.x+=(state.targetX-state.x)*smoothing;state.y+=(state.targetY-state.y)*smoothing;state.gather+=(state.targetGather-state.gather)*smoothing;
  draw(dt);animationFrame=requestAnimationFrame(animate);
}
function syncPause(){state.paused=userPaused||parentPaused||!visible;$('#pause').setAttribute('aria-pressed',String(userPaused));$('#pause').setAttribute('aria-label',userPaused?'Resume animation':'Pause animation');$('#pause').textContent=userPaused?'▷':'Ⅱ';$('#paused-label').hidden=!userPaused;if(state.paused){cancelAnimationFrame(animationFrame);animationFrame=0;}else if(!animationFrame){lastFrame=performance.now();animationFrame=requestAnimationFrame(animate);}}
$('#pause').onclick=()=>{userPaused=!userPaused;syncPause();};
document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible&&cameraWanted)stopCamera('Camera stopped while this work was hidden.');syncPause();});
// A same-origin host may stop a hidden iframe without keeping its canvas loop alive.
addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent)return;if(event.data?.type==='moon-tides-visibility'){parentPaused=event.data.visible===false;if(parentPaused&&cameraWanted)stopCamera('Camera stopped when the work was closed.');syncPause();}});
if('IntersectionObserver'in window)new IntersectionObserver(entries=>{const seen=entries[0]?.isIntersecting??true;if(!seen&&cameraWanted)stopCamera('Camera stopped while this work was hidden.');visible=seen&&!document.hidden;syncPause();},{threshold:.01}).observe(document.documentElement);
addEventListener('pagehide',()=>{stopCamera('');cancelAnimationFrame(animationFrame);detector?.close();detector=null;modelPromise=null;});
addEventListener('resize',resize);
// Read-only diagnostics allow the published artwork's actual mode to be checked.
Object.defineProperty(window,'moonTides',{value:Object.freeze({get status(){return Object.freeze({camera:state.camera,source:state.source,handDetected:state.hand,pinching:state.pinching,gather:state.gather,position:{x:state.x,y:state.y},waves:state.waves.length,frames:state.frames,detections:state.detections,paused:state.paused,modelLoaded:!!detector,liveCameraTracks:stream?.getVideoTracks().filter(t=>t.readyState==='live').length||0});}}),writable:false});
resize();ripple(.66,.58,.55);syncPause();
