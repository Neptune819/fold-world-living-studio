import * as T from './vendor/three.module.js';
const clamp=T.MathUtils.clamp,smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};

export function setupViewControls({renderer,camera,roots,worlds,getState}){
  const panel=document.querySelector('#view-panel'),toggle=document.querySelector('#view-toggle'),height=document.querySelector('#view-height'),output=document.querySelector('#height-value'),dial=document.querySelector('#turn-dial');
  const heightRanges=[[-1.2,4],[-.25,1],[-1.2,4]];
  let settings={heights:[0,0,0],angles:[0,0,0]},activeWorld=getState().world||0;
  try{
    const saved=JSON.parse(localStorage.getItem('fold-view-v2')),legacy=JSON.parse(localStorage.getItem('fold-view-v1'));
    const source=saved||legacy;
    if(Array.isArray(saved?.heights))settings.heights=heightRanges.map(([min,max],i)=>Number.isFinite(saved.heights[i])?clamp(saved.heights[i],min,max):0);
    else if(Number.isFinite(legacy?.height))settings.heights=[clamp(legacy.height,-1.2,4),0,clamp(legacy.height,-1.2,4)];
    if(Array.isArray(source?.angles))settings.angles=[0,1,2].map(i=>Number.isFinite(source.angles[i])?clamp(source.angles[i],-Math.PI*8,Math.PI*8):0);
  }catch{}
  let currentHeight=settings.heights[activeWorld],angle=settings.angles[activeWorld],drag=null,consumeClick=false;
  const save=()=>{try{localStorage.setItem('fold-view-v2',JSON.stringify(settings));}catch{}};
  const format=()=>{const value=settings.heights[activeWorld],[min,max]=heightRanges[activeWorld];height.min=min;height.max=max;height.value=value;output.value=`${value>0?'+':''}${value.toFixed(1)} m`;};format();
  toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));};
  height.oninput=()=>{settings.heights[activeWorld]=Number(height.value);format();save();};
  document.querySelector('#view-reset').onclick=()=>{settings.heights[activeWorld]=0;settings.angles[activeWorld]=0;format();save();};
  const allowed=()=>{const s=getState();return !s.opened&&(s.progress<=7||s.progress>=16.75);};
  function start(e,world){drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,angle:settings.angles[world]||0,world,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}
  dial.addEventListener('pointerdown',e=>{if(e.button!==0||!allowed())return;e.preventDefault();start(e,getState().world);});
  dial.addEventListener('keydown',e=>{if(!allowed())return;const world=getState().world;if(['ArrowLeft','ArrowRight','Home'].includes(e.key)){e.preventDefault();settings.angles[world]=e.key==='Home'?0:settings.angles[world]+(e.key==='ArrowLeft'?-1:1)*Math.PI/12;save();}});
  const ray=new T.Raycaster(),ndc=new T.Vector2();
  function groundHit(x,y){
    if(!allowed())return false;const state=getState(),wheel=worlds.turntables?.find(t=>t.world===state.world);if(!wheel?.target)return false;
    const bounds=renderer.domElement.getBoundingClientRect();ndc.set((x-bounds.left)/bounds.width*2-1,-(y-bounds.top)/bounds.height*2+1);ray.setFromCamera(ndc,camera);
    const hit=ray.intersectObject(wheel.target,true)[0];if(!hit)return false;
    const blocker=ray.intersectObjects(roots[state.world].children,true).find(h=>{let o=h.object;if(o.isPoints||o.isSprite||o.material?.transparent||o.material?.isShaderMaterial)return false;while(o){if(!o.visible)return false;o=o.parent;}return true;});
    return !blocker||blocker.distance>=hit.distance-.15;
  }
  renderer.domElement.addEventListener('pointerdown',e=>{
    if(e.button!==0||!groundHit(e.clientX,e.clientY))return;
    start(e,getState().world);
  });
  addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.startX;if(Math.hypot(dx,e.clientY-drag.startY)>5)drag.moved=true;if(drag.moved){settings.angles[drag.world]=drag.angle+dx*.009;renderer.domElement.style.cursor='grabbing';}});
  const finish=()=>{if(!drag)return;consumeClick=drag.moved;drag=null;save();renderer.domElement.style.cursor='';if(consumeClick)setTimeout(()=>consumeClick=false,300);};
  addEventListener('pointerup',finish);addEventListener('pointercancel',finish);addEventListener('blur',finish);
  addEventListener('click',e=>{if(consumeClick){consumeClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
  function update(dt,state){
    if(activeWorld!==state.world){activeWorld=state.world;currentHeight=settings.heights[activeWorld];format();panel.hidden=true;toggle.setAttribute('aria-expanded','false');}
    currentHeight+=(settings.heights[activeWorld]-currentHeight)*(state.reduced?1:1-Math.exp(-dt*12));
    const desired=settings.angles[state.world]||0;angle+=(desired-angle)*(state.reduced?1:1-Math.exp(-dt*12));
    dial.hidden=state.world===1||state.opened;toggle.hidden=state.opened;if(state.opened){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}
    dial.disabled=!allowed();const degrees=((desired*180/Math.PI%360)+360)%360;
    dial.style.setProperty('--turn',degrees+'deg');dial.setAttribute('aria-valuenow',String(Math.round(degrees)));dial.setAttribute('aria-valuetext',`地台角度 ${Math.round(degrees)} 度`);
    worlds.turntables?.forEach(w=>w.setAngle?.(settings.angles[w.world]||0));
    const weight=state.world===0?1-smooth((state.progress-7)/2):state.world===2?smooth((state.progress-16)/.75):0;
    // Preserve the centre line near gateways; height becomes available again inside each world.
    const clearance=smooth(Math.min(Math.abs(state.progress-10),Math.abs(state.progress-15.45))/.7);
    return{height:currentHeight*clearance,yaw:angle*weight};
  }
  return{update,groundHit,get state(){return{height:settings.heights[activeWorld],heights:[...settings.heights],heightRange:[...heightRanges[activeWorld]],angles:[...settings.angles],dragging:!!drag};}};
}
