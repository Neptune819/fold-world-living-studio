import * as T from './vendor/three.module.js';
import {buildCuratedExhibit} from './exhibit-design.js?v=5.6';
import {featuredProject,featuredGallery} from './project-viewer.js?v=5.4-gallery';

// Content belongs to scene objects. The DOM buttons only provide keyboard access
// at the projected object position; raycasts use the actual exhibit geometry.
export function createSceneContent({roots,character,worlds,camera,renderer,onOpen}) {
  const host=document.querySelector('#object-access'),records=new Map(),ray=new T.Raycaster();
  const brass=new T.MeshStandardMaterial({color:0xb4935b,metalness:.72,roughness:.3});
  const ink=new T.MeshStandardMaterial({color:0x1a2e36,metalness:.3,roughness:.45});
  const paper=new T.MeshStandardMaterial({color:0xe1d8bf,roughness:.9});
  const glow=new T.MeshBasicMaterial({color:0xffd79b,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide});
  const boxGeo=new T.BoxGeometry(1,1,1);
  let data=null,hovered=null,world=0,opened=false;
  // Device actions are fixed parts of the world, independent of editable content.
  const actions=worlds.actions||[];
  for(const action of actions)action.target.userData.dynamic=true;
  // Static architectural collision boxes avoid raycasting millions of ornamental
  // triangles every frame. Clicks still intersect the real exhibit meshes.
  const occluders=roots.map(root=>{
    root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),boxes=[];
    root.traverse(object=>{
      if(!object.isMesh||object.material?.transparent||object.material?.isShaderMaterial)return;
      let parent=object;while(parent&&parent!==root){if(parent.userData.dynamic)return;parent=parent.parent;}
      object.geometry.computeBoundingBox();const bounds=object.geometry.boundingBox;if(!bounds)return;
      const base=new T.Matrix4().multiplyMatrices(inverse,object.matrixWorld);
      for(let i=0;i<(object.isInstancedMesh?object.count:1);i++){
        const matrix=base.clone();if(object.isInstancedMesh){const instance=new T.Matrix4();object.getMatrixAt(i,instance);matrix.multiply(instance);}
        const box=bounds.clone().applyMatrix4(matrix),size=box.getSize(new T.Vector3());
        if(size.x>.32&&size.y>.32&&size.z>.32)boxes.push(box);
      }
    });return boxes;
  });
  const collisionRay=new T.Ray(),inverseRoot=new T.Matrix4(),collisionPoint=new T.Vector3();
  function obstructed(distance){
    inverseRoot.copy(roots[world].matrixWorld).invert();collisionRay.copy(ray.ray).applyMatrix4(inverseRoot);
    return occluders[world].some(box=>{const point=collisionRay.intersectBox(box,collisionPoint);return point&&point.distanceTo(collisionRay.origin)<distance-.35;});
  }
  const builtins={
    'featured-project':{world:0,position:[4.4,2.6,6.5],kind:'项目汇报'},
    'art-gallery':{world:0,position:[-4.4,2.6,6.5],kind:'艺术画廊'},
    about:{world:0,target:character,anchor:[0,5.7,0],kind:'人物'},
    journey:{world:0,target:worlds.floats[0].g,anchor:[0,1.7,0],kind:'观测仪'},
    coding:{world:0,target:worlds.floats[1].g,anchor:[0,1.7,0],kind:'编程装置'},
    reading:{world:1,position:[5.4,1.8,-8],kind:'湖岸书台',book:true},
    'moving-image':{world:1,position:[-5.4,1.8,-24],kind:'湖岸放映器',glass:true},
    proposal:{world:2,target:worlds.core,anchor:[3.2,2.35,2.7],kind:'项目核心'},
    'work-log':{world:2,position:[8.5,3.4,-7.5],kind:'工作终端',terminal:true}
  };
  function mesh(g,m,parent,pos,scale){const o=new T.Mesh(g,m);o.position.set(...pos);o.scale.set(...scale);o.castShadow=!m.transparent;parent.add(o);return o;}
  function makeExhibit(spec) {
    if(spec.world>0)return buildCuratedExhibit(spec,roots[spec.world],{brass,ink,paper});
    const group=new T.Group();group.position.set(...spec.position);roots[spec.world].add(group);
    if(spec.book){
      const book=new T.Group();book.rotation.set(-.22,-.12,.08);group.add(book);
      for(const side of [-1,1]){
        const leaf=new T.Group();leaf.position.x=side*.62;leaf.rotation.y=side*.18;book.add(leaf);
        mesh(boxGeo,brass,leaf,[0,0,-.07],[1.2,1.5,.13]);
        mesh(boxGeo,paper,leaf,[0,0,.035],[1.1,1.38,.1]);
        for(let j=0;j<6;j++)mesh(boxGeo,brass,leaf,[0,.42-j*.16,.091],[.73,.012,.008]);
      }
      mesh(new T.CylinderGeometry(.055,.055,1.6,12),brass,book,[0,0,0],[1,1,1]);
    }else{
      const glass=spec.glass?new T.MeshPhysicalMaterial({color:0x76a7b6,metalness:.3,roughness:.12,transparent:true,opacity:.24,depthWrite:false}):ink;
      mesh(boxGeo,glass,group,[0,0,0],[2.45,spec.glass?1.4:1.8,spec.glass?.075:.24]);
      for(const side of [-1,1]){
        mesh(boxGeo,brass,group,[side*1.23,0,.03],[.055,spec.glass?1.47:1.94,.08]);
        mesh(boxGeo,brass,group,[0,side*(spec.glass?.71:.91),.03],[2.52,.055,.08]);
      }
      if(!spec.glass){const ring=mesh(new T.TorusGeometry(1.6,.018,6,64),brass,group,[0,0,-.14],[1,1,1]);ring.scale.y=.77;}
      if(spec.terminal){
        for(let i=0;i<5;i++)mesh(new T.CylinderGeometry(.055,.055,.08,12),brass,group,[-.6+i*.3,-.77,.2],[1,1,1]).rotation.x=Math.PI/2;
        mesh(boxGeo,brass,group,[0,-1.12,-.07],[.15,.5,.14]);
        mesh(new T.CylinderGeometry(.44,.51,.12,32),ink,group,[0,-1.41,-.07],[1,1,1]);
      }
    }
    return group;
  }
  function register(section,index){
    const extraIndex=Math.max(0,index-7);
    const spec=builtins[section.id]||{world:extraIndex%3,position:extraIndex%3===0?[-5+(Math.floor(extraIndex/3)%4)*3.3,2.8,6+Math.floor(extraIndex/12)*3]:extraIndex%3===1?[-3.5,2.5,-7-Math.floor(extraIndex/3)*4]:[-6,3.2,2-Math.floor(extraIndex/3)*4],kind:'作品展台'};
    const target=spec.target||makeExhibit(spec),owned=!spec.target;
    const anchor=new T.Object3D();anchor.position.set(...(spec.anchor||[0,1.4,0]));target.add(anchor);
    const highlight=new T.Mesh(new T.TorusGeometry(owned?1.7:1.35,.025,6,64),glow.clone());
    highlight.position.set(0,owned?0:-.5,owned ? .2 : .08);highlight.scale.y=owned ? .78 : 1;
    target.add(highlight);highlight.visible=false;
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=spec.glass?432:320;
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const face=new T.Mesh(new T.PlaneGeometry(spec.glass?3.06:owned?2.26:2.55,spec.glass?1.71:owned?1.04:1.06),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,toneMapped:false}));
    face.position.set(0,owned&&!spec.book?0:(spec.anchor?.[1]||1.4)-.72,owned&&!spec.book ? .135 : .38);
    if(section.id==='proposal')face.position.set(3.2,1.4,2.7);
    if(spec.glass||spec.terminal)face.position.z=.19;
    // Captions are revealed on approach/hover; the sculpture and book are the
    // permanent visual. Owned display screens carry imagery rather than labels.
    if(!owned||spec.book){face.scale.setScalar(.65);face.visible=false;}
    // No placard over the character. Its name is revealed by the anchored hover.
    face.visible=section.id!=='about';target.add(face);
    const button=document.createElement('button');button.className='object-pin';button.dataset.section=section.id;
    button.dataset.symbol=({about:'◌',reading:'▤','moving-image':'▷','work-log':'≡',coding:'⌘',journey:'◎',proposal:'◈','featured-project':'▶','art-gallery':'▧'})[section.id]||'◇';
    button.title=section.title;button.setAttribute('aria-label',`${section.title} · ${spec.kind}，查看与编辑`);
    const name=document.createElement('span');name.textContent=section.title;button.append(name);
    button.onclick=()=>onOpen(section.id,{x:record.screen.x,y:record.screen.y,kind:spec.kind});
    button.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();button.click();}};
    button.onfocus=()=>{hovered=section.id;};button.onblur=()=>{hovered=null;};host.append(button);
    const record={id:section.id,title:section.title,world:spec.world,kind:spec.kind,target,anchor,owned,highlight,canvas,texture,face,button,screen:{x:0,y:0,visible:false},signature:'',image:null,generation:0,baseY:target.position.y};
    target.userData.contentId=section.id;records.set(section.id,record);paint(record,section);
  }
  function statusOf(action){try{return String(action.getStatus?.()||'点击启动');}catch{return '点击启动';}}
  function registerAction(action){
    const target=action.target,anchor=new T.Object3D();anchor.position.set(...(action.anchor||[0,1,0]));target.add(anchor);
    const highlight=new T.Mesh(new T.TorusGeometry(.36,.011,6,48),glow.clone());
    highlight.position.copy(anchor.position);highlight.material.opacity=.38;highlight.visible=false;target.add(highlight);
    const button=document.createElement('button');button.className='object-pin action-pin';button.dataset.section=action.id;
    button.dataset.symbol=({'moon-astrolabe':'↟','moon-memory-lamp':'≈','moon-observatory':'✧','atelier-energy':'⏻','atelier-orbits':'↻'})[action.id]||'◈';
    // Keep the keyboard marker smaller than content markers; the model is the target.
    button.style.width='19px';button.style.height='19px';button.style.background='#153342b0';button.style.boxShadow='0 0 10px #9ad6ff30';
    const name=document.createElement('span');button.append(name);
    const record={id:action.id,title:action.label,world:action.world,kind:'互动装置',target,anchor,owned:false,highlight,face:null,button,action,screen:{x:0,y:0,visible:false}};
    button.onclick=()=>onOpen(action.id,{x:record.screen.x,y:record.screen.y,kind:record.kind});
    button.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();button.click();}};
    button.onfocus=()=>{hovered=action.id;};button.onblur=()=>{hovered=null;};host.append(button);
    target.userData.contentId=action.id;records.set(action.id,record);refreshAction(record);
  }
  function refreshAction(record){
    const status=statusOf(record.action),label=record.title+' · '+status;
    if(record.status===status)return;record.status=status;record.button.title=label;
    record.button.firstChild.textContent=label;record.button.setAttribute('aria-label',label+'，启动装置');
  }
  function paint(record,section){
    const preview=section.items.find(item=>item.image),signature=JSON.stringify([section.title,section.items.map(i=>i.title),preview?.image]);
    if(signature===record.signature)return;record.signature=signature;
    const ctx=record.canvas.getContext('2d'),w=record.canvas.width,h=record.canvas.height;
    const draw=()=>{
      ctx.fillStyle='#101f26';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#a98d5d';ctx.lineWidth=2;ctx.strokeRect(13,13,w-26,h-26);
      let x=32,tw=w-64;
      if(record.image){const image=record.image,iw=250,ih=230,scale=Math.min(iw/image.width,ih/image.height);ctx.drawImage(image,32+(iw-image.width*scale)/2,43+(ih-image.height*scale)/2,image.width*scale,image.height*scale);x=310;tw=w-x-28;}
      if(!record.image){
        if(record.id==='moving-image'||record.id==='work-log'){
          const film=record.id==='moving-image';ctx.fillStyle=film?'#122f3a':'#18332f';ctx.fillRect(25,25,w-50,h-50);
          if(film){
            const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#173f51');gradient.addColorStop(1,'#0c1821');ctx.fillStyle=gradient;ctx.fillRect(25,25,w-50,h-50);
            ctx.strokeStyle='#658e9ba0';for(let i=0;i<8;i++){ctx.beginPath();ctx.ellipse(w*.5,h*.43,60+i*16,45+i*9,i*.31,0,Math.PI*2);ctx.stroke();}
            ctx.fillStyle='#ead6a5';ctx.beginPath();ctx.moveTo(w*.47,h*.34);ctx.lineTo(w*.56,h*.45);ctx.lineTo(w*.47,h*.56);ctx.closePath();ctx.fill();
            ctx.fillStyle='#c2b18b';for(let y=40;y<h-40;y+=28){ctx.fillRect(37,y,12,15);ctx.fillRect(w-49,y,12,15);}
          }else{
            ctx.strokeStyle='#748c7350';ctx.lineWidth=1;for(let y=50;y<h-60;y+=28){ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(w-40,y);ctx.stroke();}
            ctx.fillStyle='#d7c59b';ctx.font='22px monospace';['01  OBSERVE','02  MAKE','03  TEST','04  REFINE'].forEach((text,i)=>ctx.fillText(text,55,75+i*39));
          }
          ctx.textAlign='center';ctx.fillStyle='#eadfc7';ctx.font='27px Arial,Microsoft YaHei';ctx.fillText(section.title,w/2,h-53,w-95);ctx.font='16px Arial,Microsoft YaHei';ctx.fillStyle='#99b3b5';ctx.fillText(film?'影像与三维作品 · 点击查看':'过程记录 · 点击查看',w/2,h-27);ctx.textAlign='start';record.texture.needsUpdate=true;return;
        }
        // An instrument-like visual on the actual display, not another syllabus.
        ctx.save();ctx.translate(w*.50,h*.45);ctx.strokeStyle='#a69366';ctx.lineWidth=1.2;
        for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(0,0,45+i*23,36+i*11,i*.35,0,Math.PI*2);ctx.stroke();}
        for(let i=0;i<36;i++){const a=i*Math.PI/18;ctx.fillStyle=i%3?'#658e92':'#c9b478';ctx.beginPath();ctx.arc(Math.cos(a)*147,Math.sin(a)*87,i%3?1.2:2.2,0,Math.PI*2);ctx.fill();}ctx.restore();
        ctx.fillStyle='#e6d9be';ctx.font='23px Arial, Microsoft YaHei';ctx.textAlign='center';ctx.fillText(section.title,w/2,h-38,w-80);ctx.textAlign='start';
      }else{ctx.fillStyle='#e6d9be';ctx.font='27px Arial, Microsoft YaHei';ctx.fillText(section.title,x,126,tw);ctx.fillStyle='#a8b1a9';ctx.font='18px Arial, Microsoft YaHei';ctx.fillText(section.items[0]?.title||'',x,183,tw);}
      record.texture.needsUpdate=true;
    };
    const token=++record.generation;record.image=null;draw();
    if(preview?.image){const image=new Image();image.onload=()=>{if(token!==record.generation)return;record.image=image;draw();};image.src=preview.image;}
    record.title=section.title;record.button.removeAttribute('title');record.button.firstChild.textContent=section.title;
    record.button.setAttribute('aria-label',`${section.title} · ${record.kind}，${section.actionLabel||(section.direct?'直接打开项目汇报':'查看与编辑')}`);
  }
  function sync(value){data=value;const actionIds=new Set(actions.map(a=>a.id));
    const sections=[...value.sections.filter(s=>![featuredProject.id,featuredGallery.id].includes(s.id)&&!actionIds.has(s.id)),featuredProject,featuredGallery],ids=new Set([...sections.map(s=>s.id),...actionIds]);
    for(const [id,r] of records)if(!ids.has(id)){r.button.remove();r.anchor.removeFromParent();r.face?.removeFromParent();r.highlight.removeFromParent();r.texture?.dispose();r.face?.material.dispose();r.highlight.material.dispose();if(r.owned)r.target.removeFromParent();delete r.target.userData.contentId;records.delete(id);}
    sections.forEach((section,index)=>{if(records.has(section.id))paint(records.get(section.id),section);else register(section,index);});
    actions.forEach(action=>{if(!records.has(action.id))registerAction(action);});
  }
  const point=new T.Vector3(),projected=new T.Vector3(),localQ=new T.Quaternion();
  function update(time,currentWorld,isOpen,reduced){world=currentWorld;opened=isOpen;
    const rect=renderer.domElement.getBoundingClientRect();
    for(const r of records.values()){
      if(r.action)refreshAction(r);
      if(r.face&&r.id!=='about')r.face.visible=r.owned&&r.kind!=='悬浮书册'||r.id===hovered;
      if(r.owned)r.target.position.y=r.baseY+(reduced?0:Math.sin(time*.7+r.baseY)*.075);
      r.target.userData.reels?.forEach((reel,i)=>reel.rotation.z=reduced?0:time*(.22+i*.03));
      r.highlight.visible=r.id===hovered&&!opened&&r.world===world;
      // The preview is a physical plane attached to the object, oriented towards the viewer.
      if(!r.action){if(r.owned){roots[r.world].getWorldQuaternion(localQ);r.target.quaternion.copy(localQ.invert().multiply(camera.quaternion));r.face.quaternion.identity();}
      else{r.target.getWorldQuaternion(localQ);r.face.quaternion.copy(localQ.invert().multiply(camera.quaternion));}}
      r.target.updateWorldMatrix(true,true);r.anchor.getWorldPosition(point);projected.copy(point).project(camera);
      let visible=r.world===world&&!opened&&projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.94&&Math.abs(projected.y)<.88;
      if(visible){ray.setFromCamera(new T.Vector2(projected.x,projected.y),camera);visible=!obstructed(point.distanceTo(camera.position));}
      const hitPoint=r.id==='about'?r.target.localToWorld(new T.Vector3(0,3.5,.25)):r.face&&r.owned?r.face.getWorldPosition(new T.Vector3()):r.target.getWorldPosition(new T.Vector3());hitPoint.project(camera);
      r.screen={x:rect.left+(projected.x+1)*rect.width/2,y:rect.top+(1-projected.y)*rect.height/2,visible,hitPoint:{x:rect.left+(hitPoint.x+1)*rect.width/2,y:rect.top+(1-hitPoint.y)*rect.height/2}};
      r.button.hidden=!visible;r.button.style.left=r.screen.x+'px';r.button.style.top=r.screen.y+'px';r.button.classList.toggle('hovered',r.id===hovered);
    }
  }
  function getHit(x,y){
    if(opened)return null;const rect=renderer.domElement.getBoundingClientRect();
    const ndc=new T.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);ray.setFromCamera(ndc,camera);
    const hits=ray.intersectObjects(Array.from(records.values()).filter(r=>r.world===world).map(r=>r.target),true);
    for(const hit of hits){let o=hit.object,visible=true,id=null;while(o){if(!o.visible)visible=false;if(!id&&o.userData.contentId)id=o.userData.contentId;o=o.parent;}
      if(!visible||hit.object.isPoints||hit.object.isSprite||records.get(id)?.highlight===hit.object)continue;
      if(id&&records.has(id))return obstructed(hit.distance)?null:id;
      if(hit.object.material?.transparent)continue;
      return null;
    }return null;
  }
  // Resolve a real device surface only when debugging asks for a click point.
  // This avoids adding triangle queries to every frame of an animated device.
  function screenOf(r){
    const screen={id:r.id,world:r.world,kind:r.kind,...r.screen};if(!r.action||!r.screen.visible)return screen;
    const rect=renderer.domElement.getBoundingClientRect(),candidates=[];
    r.target.traverse(o=>{
      if(!o.isMesh||!o.visible||o===r.highlight||o.material?.transparent)return;
      const position=o.geometry.attributes.position,index=o.geometry.index;if(!position?.count)return;
      const local=new T.Vector3();for(let i=0;i<3;i++)local.add(new T.Vector3().fromBufferAttribute(position,index?index.getX(i):i));local.multiplyScalar(1/3);
      const surface=o.localToWorld(local).project(camera);if(surface.z<-1||surface.z>1||Math.abs(surface.x)>.98||Math.abs(surface.y)>.98)return;
      candidates.push({x:rect.left+(surface.x+1)*rect.width/2,y:rect.top+(1-surface.y)*rect.height/2});
    });
    for(const p of candidates.slice(0,32))if(getHit(p.x,p.y)===r.id){screen.hitPoint=p;break;}
    return screen;
  }
  return {sync,update,getHit,setHover:id=>{hovered=id;},getRecord:id=>records.get(id),get previews(){return Array.from(records.values()).filter(r=>!r.action).map(r=>({id:r.id,imageReady:!!r.image,visible:r.face.visible}));},get screens(){return Array.from(records.values()).map(screenOf);},get actions(){return Array.from(records.values()).filter(r=>r.action).map(r=>({...screenOf(r),status:statusOf(r.action)}));}};
}
