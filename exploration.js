import {drawSilk} from './cursor-silk.js?v=5.4';
import * as T from './vendor/three.module.js';
import {setupStudio} from './studio.js?v=5.6';
import {createSceneContent} from './scene-content.js?v=5.7';
import {setupProjectViewer,featuredProject,featuredGallery} from './project-viewer.js?v=5.4-gallery';

export async function setupInteraction({renderer,camera,character,plaza,roots,portals,worlds,getState,onPause}){
  const fx=document.querySelector('#cursor-fx'),ctx=fx.getContext('2d'),tip=document.querySelector('#hover-tip');
  const studio=await setupStudio(onPause);
  const project=setupProjectViewer(onPause),isOpened=()=>studio.opened||project.opened;
  let lastClick=null,hover=null,pointer=null,trail=[],ripples=[],embers=[],overUI=false,rect,scaleX=1,scaleY=1,renderDpr=1,feedback=null;
  const openContent=(id,source)=>{
    if(isOpened())return;dismissHint();const record=exhibits.getRecord(id);
    if(record?.action){activateDevice(record,source);return;}
    clear();[featuredProject.id,featuredGallery.id].includes(id)?project.open(id):studio.open(id,source);
  };
  const exhibits=createSceneContent({roots,character,worlds,camera,renderer,onOpen:openContent});
  document.querySelector('#open-coding').onclick=()=>openContent('coding');
  document.querySelector('#open-log').onclick=()=>openContent('work-log');
  const requestedSection=new URLSearchParams(location.search).get('section');
  if(['coding','work-log'].includes(requestedSection))requestAnimationFrame(()=>openContent(requestedSection));
  document.addEventListener('open-project',()=>{if(studio.editing)return;studio.close();openContent(featuredProject.id);});
  exhibits.sync(studio.data);document.addEventListener('studio-data',e=>exhibits.sync(e.detail));
  if(new URLSearchParams(location.search).get('page')==='gallery')requestAnimationFrame(()=>openContent(featuredGallery.id));
  const ray=new T.Raycaster(),ndc=new T.Vector2();
  const halo=new T.Mesh(new T.RingGeometry(1.84,1.92,64),new T.MeshBasicMaterial({color:0xffd18b,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));
  halo.rotation.x=-Math.PI/2;halo.position.set(-.7,.6,1);halo.visible=false;plaza.add(halo);
  const hint=document.querySelector('#hint');let hintTimer=setTimeout(()=>hint.hidden=true,7000);
  function dismissHint(){hint.hidden=true;clearTimeout(hintTimer);}
  function clear(){trail=[];ripples=[];embers=[];hover=null;feedback=null;tip.hidden=true;halo.visible=false;}
  function activateDevice(record,source){
    const point=source||record.screen;
    const report=text=>{feedback={text:record.title+' · '+text,x:point.x,y:point.y,until:performance.now()+1900};};
    try{
      const result=record.action.activate();
      if(result?.then){report('正在响应');result.then(()=>report(record.action.getStatus?.()||'已启动')).catch(()=>report('装置暂时无法响应'));}
      else report(record.action.getStatus?.()||'已启动');
      if(!getState().reduced)ripples.push({...local(point.x,point.y),t:performance.now()});
    }catch(error){console.warn('Device interaction failed',record.id,error);report('装置暂时无法响应');}
  }
  function resize(){
    // Backing pixels and CSS pixels are separate, including fractional DPR.
    rect=fx.getBoundingClientRect();renderDpr=Math.min(devicePixelRatio,1.5);
    fx.width=Math.round(rect.width*renderDpr);fx.height=Math.round(rect.height*renderDpr);
    scaleX=fx.width/rect.width;scaleY=fx.height/rect.height;
    ctx.setTransform(scaleX,0,0,scaleY,0,0);clear();pointer=null;
  }
  resize();addEventListener('resize',resize);addEventListener('scroll',dismissHint,{passive:true});
  const local=(x,y)=>({x:x-rect.left,y:y-rect.top});
  const isUI=target=>!!target?.closest?.('button,dialog,details,label,input,textarea,a');
  function portalHit(x,y){
    const state=getState();if(state.world>1)return null;const bounds=renderer.domElement.getBoundingClientRect();
    ndc.set((x-bounds.left)/bounds.width*2-1,-(y-bounds.top)/bounds.height*2+1);ray.setFromCamera(ndc,camera);
    const hit=ray.intersectObjects([portals[state.world].frame],true).find(h=>{let o=h.object;if(o.isSprite||o.isPoints||o.material?.transparent)return false;while(o){if(!o.visible)return false;o=o.parent;}return true;});
    if(!hit)return null;let o=hit.object;while(o){const index=portals.findIndex(p=>p.frame===o);if(index>=0)return index;o=o.parent;}return null;
  }
  addEventListener('pointermove',e=>{
    const previous=pointer;pointer={x:e.clientX,y:e.clientY};overUI=isUI(e.target);
    if(isOpened()||overUI){clear();return;}
    if(getState().reduced)return;
    const now=performance.now(),p=local(pointer.x,pointer.y),distance=previous?Math.hypot(pointer.x-previous.x,pointer.y-previous.y):0;
    // Never throttle away the live endpoint; only the tail is bounded.
    if(trail.length&&distance<.3)trail[trail.length-1]={...p,t:now};else trail.push({...p,t:now});
    if(trail.length>64)trail.shift();
    if(distance>3){const angle=Math.random()*Math.PI*2;embers.push({...p,vx:Math.cos(angle)*12,vy:Math.sin(angle)*12,t:now});if(embers.length>36)embers.shift();}
  });
  document.documentElement.addEventListener('pointerleave',()=>{pointer=null;overUI=false;clear();exhibits.setHover(null);});
  addEventListener('blur',()=>{pointer=null;clear();exhibits.setHover(null);});
  addEventListener('click',e=>{
    lastClick={x:e.clientX,y:e.clientY,target:e.target.tagName,ui:isUI(e.target),opened:isOpened(),world:getState().world};
    if(isOpened()||isUI(e.target))return;dismissHint();
    const id=exhibits.getHit(e.clientX,e.clientY);lastClick.hit=id;
    if(id){openContent(id,{x:e.clientX,y:e.clientY,kind:exhibits.getRecord(id).kind});return;}
    if(!getState().reduced)ripples.push({...local(e.clientX,e.clientY),t:performance.now()});if(ripples.length>8)ripples.shift();
  });
  function update(now,time){
    const next=fx.getBoundingClientRect();if(Math.abs(next.width-rect.width)>.1||Math.abs(next.height-rect.height)>.1||Math.min(devicePixelRatio,1.5)!==renderDpr)resize();
    ctx.clearRect(0,0,rect.width,rect.height);const state=getState(),reduced=state.reduced;
    exhibits.update(time,state.world,isOpened(),reduced);
    const focused=document.activeElement?.dataset.section;
    const id=pointer&&!isOpened()&&!overUI?exhibits.getHit(pointer.x,pointer.y):focused||null;
    exhibits.setHover(id);halo.visible=id==='about'&&!isOpened();
    hover=id|| (pointer&&!isOpened()&&!overUI?portalHit(pointer.x,pointer.y):null);
    const record=exhibits.getRecord(id),section=[featuredProject,featuredGallery].find(s=>s.id===id)||studio.data.sections.find(s=>s.id===id);
    const device=record?.action,activeFeedback=feedback&&now<feedback.until&&!isOpened();
    const focusPoint=focused?record?.screen:null,tipPoint=activeFeedback?feedback:pointer||focusPoint;
    tip.hidden=isOpened()||!tipPoint||(!activeFeedback&&(overUI||focused||(!section&&!device)));
    if(!tip.hidden){
      tip.textContent=activeFeedback?feedback.text:device?record.title+' · '+(device.getStatus?.()||'点击启动'):section.id==='about'?'关于我 · 点击查看':section.title+' · 点击查看';
      tip.style.left=Math.max(10,Math.min(tipPoint.x+16,innerWidth-tip.offsetWidth-12))+'px';tip.style.top=Math.max(8,tipPoint.y-32)+'px';
    }
    renderer.domElement.style.cursor=id?'pointer':'';
    if(isOpened()||reduced||overUI){trail=[];ripples=[];embers=[];return hover;}
    trail=trail.filter(p=>now-p.t<560);drawSilk(ctx,trail,now);
    embers=embers.filter(p=>now-p.t<560);for(const p of embers){const age=(now-p.t)/560;ctx.fillStyle=`rgba(255,217,143,${.65*(1-age)*(1-age)})`;ctx.beginPath();ctx.arc(p.x+p.vx*age,p.y+p.vy*age,1.1,0,Math.PI*2);ctx.fill();}
    ripples=ripples.filter(p=>now-p.t<650);for(const p of ripples){const age=(now-p.t)/650;ctx.strokeStyle=`rgba(247,211,143,${.65*(1-age)})`;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(p.x,p.y,4+age*31,0,Math.PI*2);ctx.stroke();}
    return hover;
  }
  if(new URLSearchParams(location.search).has('debug'))window.foldInteraction={
    get state(){return getState();},get lastClick(){return lastClick;},get previews(){return exhibits.previews;},get screens(){return exhibits.screens;},get actions(){return exhibits.actions;},get content(){return studio.data;},
    get cursor(){return {pointer,rect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height},backing:[fx.width,fx.height],scale:[scaleX,scaleY],head:trail.at(-1),count:trail.length};},
    hit:(x,y)=>exhibits.getHit(x,y)
  };
  return {update,get hovered(){return hover;},get opened(){return isOpened();}};
}
