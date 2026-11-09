import * as T from './vendor/three.module.js';

// Fine surfaces and architectural depth are separate from the scroll timeline.
// The two paintings are distant scenery; every intervening layer is real geometry.
export async function finesseWorlds(roots, scenes, h, floor, ruins, atelier) {
  const {mesh, box, cyl, ring, rod, ball, cream, stone, gold, silver, dark} = h;
  const [plaza, moon, lab] = roots;
  const animated = [], dusts = [], clockHands = [];
  let seed = 553;
  const random = () => {seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296;};
  function texture(draw, size = 512, repeat = 1) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    draw(canvas.getContext('2d'), size);
    const map = new T.CanvasTexture(canvas); map.anisotropy = 8;
    map.wrapS = map.wrapT = T.RepeatWrapping; map.repeat.set(repeat, repeat); return map;
  }
  const grain = texture((c,s) => {
    c.fillStyle='#b3b3b3';c.fillRect(0,0,s,s);
    for(let y=0;y<s;y++){const v=142+random()*72;c.fillStyle=`rgba(${v},${v},${v},.6)`;c.fillRect(0,y,s,1);}
    for(let i=0;i<1100;i++){c.strokeStyle='rgba(38,38,38,.13)';c.beginPath();const x=random()*s,y=random()*s;c.moveTo(x,y);c.lineTo(x+random()*80,y);c.stroke();}
  });
  const marble = texture((c,s) => {
    c.fillStyle='#c9c4b2';c.fillRect(0,0,s,s);
    for(let i=0;i<14;i++){c.strokeStyle=`rgba(82,91,84,${.018+random()*.032})`;c.lineWidth=.7+random()*2;c.beginPath();let y=random()*s;c.moveTo(0,y);for(let x=0;x<=s;x+=20){y+=Math.sin(x*.017+i)*5+(random()-.5)*5;c.lineTo(x,y);}c.stroke();}
    for(let i=0;i<19000;i++){const v=80+random()*140;c.fillStyle=`rgba(${v},${v},${v},.035)`;c.fillRect(random()*s,random()*s,1,1);}
  },512,3);
  marble.colorSpace=T.SRGBColorSpace;
  cream.map=marble;cream.roughness=.53;cream.bumpScale=.018;cream.needsUpdate=true;
  stone.color.set(0x88918a);stone.roughness=.67;
  gold.roughnessMap=grain;gold.roughness=.36;gold.needsUpdate=true;
  silver.roughnessMap=grain;silver.roughness=.26;silver.needsUpdate=true;
  const brass=new T.MeshStandardMaterial({color:0x927446,metalness:.86,roughness:.38,roughnessMap:grain});
  const ivory=new T.MeshStandardMaterial({color:0xbdb8a6,map:marble,roughness:.6});
  const ink=new T.MeshStandardMaterial({color:0x142f32,metalness:.42,roughness:.32,roughnessMap:grain});
  const soot=new T.MeshStandardMaterial({color:0x10212b,roughness:.81});
  const warm=new T.MeshStandardMaterial({color:0xeacb89,emissive:0xe1a454,emissiveIntensity:.7,roughness:.35});
  const cool=new T.MeshStandardMaterial({color:0x97bfc7,emissive:0x79aebd,emissiveIntensity:.35,roughness:.4});
  // Cached bevels give small housings a highlight edge without a separate mesh per edge.
  const bevelCache=new Map();
  function bevel(parent,material,position,size,r=.05) {
    const key=[...size,r].join('/');let geo=bevelCache.get(key);
    if(!geo){const [w,h,d]=size,rr=Math.min(r,w*.22,h*.22,d*.22),shape=new T.Shape(),x=-w/2+rr,y=-h/2+rr,W=w-2*rr,H=h-2*rr;
      shape.moveTo(x+rr,y);shape.lineTo(x+W-rr,y);shape.quadraticCurveTo(x+W,y,x+W,y+rr);shape.lineTo(x+W,y+H-rr);shape.quadraticCurveTo(x+W,y+H,x+W-rr,y+H);shape.lineTo(x+rr,y+H);shape.quadraticCurveTo(x,y+H,x,y+H-rr);shape.lineTo(x,y+rr);shape.quadraticCurveTo(x,y,x+rr,y);
      geo=new T.ExtrudeGeometry(shape,{depth:d-rr*2,steps:1,bevelEnabled:true,bevelThickness:rr,bevelSize:rr,bevelSegments:2,curveSegments:3});geo.translate(0,0,-(d-rr*2)/2);bevelCache.set(key,geo);
    }return mesh(geo,material,parent,position);
  }
  function horizontal(parent,mat,pos,r,t=.02){const o=ring(parent,mat,pos,r,t);o.rotation.x=-Math.PI/2;return o;}
  function arch(parent,x,y,z,r,mat,width=.18){return mesh(new T.TorusGeometry(r,width,8,56,Math.PI),mat,parent,[x,y,z]);}
  function bolts(parent,center,r,count=24,rotation='vertical'){
    const geo=new T.CylinderGeometry(.035,.035,.035,6),inst=new T.InstancedMesh(geo,brass,count),dummy=new T.Object3D();
    for(let i=0;i<count;i++){const a=i*Math.PI*2/count;dummy.position.set(center[0]+Math.cos(a)*r,center[1]+(rotation==='vertical'?Math.sin(a)*r:0),center[2]+(rotation==='vertical'?0:Math.sin(a)*r));dummy.rotation.set(rotation==='vertical'?Math.PI/2:0,0,0);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);}inst.castShadow=false;parent.add(inst);
  }

  // A quiet marble field, individually ruled stones and fine radial inlays.
  const floorMap=texture((c,s)=>{
    c.fillStyle='#bdbba9';c.fillRect(0,0,s,s);c.drawImage(marble.image,0,0,s,s);
    c.save();c.translate(s/2,s/2);
    for(let i=0;i<48;i++){const a=i*Math.PI/24;c.strokeStyle=i%4?'rgba(74,89,82,.15)':'rgba(87,76,52,.38)';c.lineWidth=i%4?.7:1.3;c.beginPath();c.moveTo(Math.cos(a)*s*.17,Math.sin(a)*s*.17);c.lineTo(Math.cos(a)*s*.465,Math.sin(a)*s*.465);c.stroke();}
    for(const r of [.115,.135,.175,.3,.305,.375,.43,.45,.46,.485]){c.strokeStyle='rgba(96,80,46,.48)';c.lineWidth=r>.43?1.5:1;c.beginPath();c.arc(0,0,s*r,0,Math.PI*2);c.stroke();}
    for(let i=0;i<24;i++){c.save();c.rotate(i*Math.PI/12);c.translate(s*.337,0);c.strokeStyle='#7b7053';c.lineWidth=1;c.strokeRect(-s*.016,-s*.04,s*.032,s*.08);c.beginPath();c.moveTo(-s*.016,0);c.lineTo(0,-s*.04);c.lineTo(s*.016,0);c.lineTo(0,s*.04);c.closePath();c.stroke();c.restore();}
    c.restore();for(let i=0;i<18000;i++){c.fillStyle=`rgba(60,64,56,${random()*.025})`;c.fillRect(random()*s,random()*s,1,1);}
  },1024);floorMap.colorSpace=T.SRGBColorSpace;
  floor.material=new T.MeshStandardMaterial({map:floorMap,color:0xb5b6a8,roughness:.51,metalness:.08,bumpMap:grain,bumpScale:.006});
  // Bevelled annular stones are actual relief above the engraved foundation.
  // They rotate with the existing physical wheel, including reverse navigation.
  for(let i=0;i<24;i++){
    const a=i*Math.PI/12+.002,b=(i+1)*Math.PI/12-.002,shape=new T.Shape();
    shape.moveTo(Math.cos(a)*3.15,Math.sin(a)*3.15);shape.lineTo(Math.cos(a)*11.23,Math.sin(a)*11.23);
    shape.absarc(0,0,11.23,a,b,false);shape.lineTo(Math.cos(b)*3.15,Math.sin(b)*3.15);shape.absarc(0,0,3.15,b,a,true);shape.closePath();
    const geometry=new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.012,bevelThickness:.009,bevelSegments:2,curveSegments:24});
    const p=geometry.attributes.position,uv=geometry.attributes.uv;for(let j=0;j<p.count;j++)uv.setXY(j,p.getX(j)/22.7+.5,p.getY(j)/22.7+.5);uv.needsUpdate=true;
    const material=floor.material.clone();material.color.set(i%4?0xb5b6a8:0xa4a99c);
    mesh(geometry,material,floor,[0,0,.017]);
  }
  function contact(parent,position,radius,strength){
    const map=texture((c,s)=>{const g=c.createRadialGradient(s/2,s/2,s*.22,s/2,s/2,s*.5);g.addColorStop(0,`rgba(0,0,0,${strength})`);g.addColorStop(.55,`rgba(0,0,0,${strength*.6})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,s,s);},128);
    const o=mesh(new T.PlaneGeometry(radius*2,radius*2),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,opacity:.8}),parent,position);o.rotation.x=-Math.PI/2;o.castShadow=false;
  }
  contact(plaza,[-.7,.212,1],2.35,.42);contact(lab,[0,.082,-3],6.3,.45);
  if(h.character)h.character.traverse(o=>{if(o.isMesh&&o.material?.metalness===1){o.material.roughnessMap=grain;o.material.roughness=.25;o.material.needsUpdate=true;}});
  // Remove the old loose rectangular confetti; replace it with deliberate satellites.
  for(const o of [...plaza.children])if(o.isMesh&&o.geometry.type==='BoxGeometry'&&o.scale.x===.6&&Math.abs(o.position.x)>6)o.removeFromParent();
  for(let i=0;i<11;i++){
    const a=Math.PI*.07+i*Math.PI*.086,x=9.4*Math.cos(a),z=-9.4*Math.sin(a);if(Math.abs(x)<2)continue;
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=-a+Math.PI/2;plaza.add(g);
    bevel(g,ivory,[0,.20,0],[1.32,.30,1.32],.065);bevel(g,brass,[0,.42,0],[1.04,.075,1.04],.022);
    bevel(g,ivory,[0,7.30,0],[2.7,.14,1.47],.035);bevel(g,soot,[0,7.07,0],[2.55,.06,1.25],.015);
    for(const side of [-1,1]){bevel(g,brass,[side*.94,7.16,.70],[.15,.30,.08],.016);ball(g,brass,[side*.49,.34,.64],[.033,.033,.02]);}
    for(let j=0;j<5;j++)bevel(g,brass,[-1+j*.5,7.4,.65],[.05,.13,.06],.01);
  }
  // Observatory ribs, lantern windows and dome panel seams make the outlying
  // architecture belong to the more elaborate distant city.
  for(const island of plaza.children.filter(o=>o.isGroup&&Math.abs(o.position.x)===19&&o.position.y===-4)){
    for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.sin(a)*2.3,z=Math.cos(a)*2.3;
      const g=new T.Group();g.position.set(x,1.3,z);g.rotation.y=a;island.add(g);
      bevel(g,brass,[0,0,.08],[.38,1.95,.06],.02);bevel(g,soot,[0,0,.12],[.25,1.53,.03],.015);
      bevel(g,warm,[0,.09,.15],[.035,1.15,.018],.004);bevel(g,brass,[0,-.63,.16],[.27,.04,.03],.008);
      const pts=[];for(let j=0;j<=20;j++){const u=j*Math.PI/40;pts.push(new T.Vector3(Math.sin(a)*2.43*Math.cos(u),2.7+2.43*Math.sin(u),Math.cos(a)*2.43*Math.cos(u)));}
      mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),20,.023,5,false),brass,island);
    }
    for(const [y,r] of [[-.45,3.2],[-.15,3.22],[.08,2.8],[.25,2.55],[2.6,2.45]])horizontal(island,brass,[0,y,0],r,.035);
    bolts(island,[0,.1,0],2.76,36,'horizontal');
  }
  // A restrained etched plinth beneath the human, leaving its outline clear.
  // Replace the two plain block bases with fitted stone and enamel housings.
  for (const side of [-1,1]) {
    const oldBase=plaza.children.find(o=>o.isMesh&&o.geometry.type==='BoxGeometry'&&o.position.x===side*7&&o.position.y===1.3&&o.position.z===2.5);
    if(oldBase)oldBase.removeFromParent();
    const casing=new T.Group();casing.position.set(side*7,0,2.5);plaza.add(casing);
    bevel(casing,ivory,[0,1.3,0],[2.2,2.6,2.2],.09);
    bevel(casing,brass,[0,.18,0],[2.35,.16,2.35],.035);
    bevel(casing,brass,[0,2.57,0],[2.3,.10,2.3],.025);
    for(let i=0;i<4;i++){
      const face=new T.Group();face.rotation.y=i*Math.PI/2;casing.add(face);
      bevel(face,ink,[0,1.34,1.104],[1.6,1.95,.045],.04);
      for(const x of [-.71,.71])bevel(face,brass,[x,1.34,1.14],[.025,1.78,.02],.005);
      for(let y=0;y<4;y++)bevel(face,brass,[0,.52+y*.16,1.15],[1.28,.024,.018],.004);
      for(const x of [-.58,.58])ball(face,brass,[x,2.03,1.15],[.028,.028,.018]);
    }
  }
  const pedestal=new T.Group();pedestal.position.set(-.7,.49,1);plaza.add(pedestal);
  horizontal(pedestal,brass,[0,.1,0],1.74,.017);bolts(pedestal,[0,.105,0],1.66,32,'horizontal');
  for(let i=0;i<24;i++){const a=i*Math.PI/12;const p=bevel(pedestal,brass,[Math.cos(a)*1.83,-.20,Math.sin(a)*1.83],[.025,.18,.07],.007);p.rotation.y=-a;}
  const sun=scenes[0].children.find(o=>o.isDirectionalLight&&o.castShadow);
  if(sun){sun.intensity=3.15;sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.022;}
  scenes[0].children.filter(o=>o.isHemisphereLight).forEach(o=>o.intensity=.34);
  scenes[0].children.filter(o=>o.isDirectionalLight&&!o.castShadow).forEach(o=>o.intensity=.50);
  scenes[0].environmentIntensity=.46;

  const loader=new T.TextureLoader();
  const [moonPainting,atelierPainting]=await Promise.all(['./assets/moon-horizon-v56.png','./assets/atelier-depth-v55.png'].map(p=>loader.loadAsync(p)));
  // The water reflects the actual scene; this painting is only the far layer.
  for(const map of [moonPainting,atelierPainting]){map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;}
  // Retire the old generic dome and duplicate moon. This painting is stationary
  // in world space, so the colonnades in front have genuine camera parallax.
  for(const o of [...moon.children])if(o.isMesh&&(o.geometry.type==='SphereGeometry'&&o.geometry.parameters.radius===175||o.material?.map?.image?.src?.includes('ruins-moon')))o.removeFromParent();
  const ruinStone=ruins.stoneMaterial;
  const paintingMaterial=new T.ShaderMaterial({uniforms:{painting:{value:moonPainting}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D painting;varying vec2 vUv;void main(){float edge=smoothstep(0.,.055,vUv.x)*smoothstep(0.,.055,1.-vUv.x)*smoothstep(0.,.075,vUv.y)*smoothstep(0.,.12,1.-vUv.y);gl_FragColor=vec4(texture2D(painting,vUv).rgb,edge);\n#include <colorspace_fragment>\n}',transparent:true,depthWrite:false,toneMapped:false});
  const lunarBackdrop=mesh(new T.PlaneGeometry(280,157.5),paintingMaterial,moon,[16,14,-157]);
  lunarBackdrop.castShadow=false;lunarBackdrop.receiveShadow=false;lunarBackdrop.name='moon-distant-painting';
  for(const side of [-1,1]){
    const colonnade=new T.Group();colonnade.position.set(side*30,-.2,-86);moon.add(colonnade);
    for(let i=0;i<8;i++){
      const x=(i-3.5)*3.7,height=7.5+Math.sin(i*2.3)*1.2;
      cyl(colonnade,soot,[x,.2,0],.85,.4);mesh(new T.CylinderGeometry(.33,.44,height,24),ruinStone,colonnade,[x,height/2,0]);
      bevel(colonnade,ruinStone,[x,height,0],[1.1,.28,1.1],.035);
      if(i<7&&i%3!==1)bevel(colonnade,ruinStone,[x+1.85,8.8,0],[3.65,.55,.75],.055);
    }
    for(let i=0;i<14;i++){
      const g=mesh(new T.DodecahedronGeometry(1,0),soot,colonnade,[(random()-.5)*31,-.12,1+random()*5],[.5+random(),.3+random()*.6,.5+random()]);g.rotation.set(random(),random(),random());
    }
  }
  // A pair of high broken piers is the middle layer, away from the walking lane.
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const x=side*(13+i*4),z=-48-i*8;
    bevel(moon,soot,[x,.35,z],[3,.8,3],.16);
    mesh(new T.CylinderGeometry(.56,.72,6.7+i*.7,32),ruinStone,moon,[x,3.7+i*.35,z]);
    bevel(moon,brass,[x,1,z],[1.56,.10,1.56],.025);
    arch(moon,x+side*2.1,7,-51-i*8,2.1,ruinStone,.27);
  }

  // Three open observation arches now look into a deep room. Repeated real bays
  // create the middle layer before the painted far wall, rather than a flat wall.
  const farWall=mesh(new T.PlaneGeometry(76,42.75),new T.MeshBasicMaterial({map:atelierPainting,color:0xb7c0c2,toneMapped:false,fog:false}),lab,[0,13.6,-66]);
  farWall.castShadow=false;farWall.receiveShadow=false;farWall.name='atelier-distant-painting';
  bevel(lab,ink,[0,-.02,-41],[36,.22,40],.04);
  for(let depth=0;depth<4;depth++){
    const z=-28-depth*8;
    for(const side of [-1,1]){
      bevel(lab,soot,[side*10.3,6.4,z],[1.3,12.8,1.1],.12);
      bevel(lab,brass,[side*10.3,12.4,z],[1.6,.10,1.35],.025);
      for(const dx of [-.43,.43])rod(lab,brass,[side*10.3+dx,.6,z+.58],[side*10.3+dx,11.8,z+.58],.026);
      bevel(lab,warm,[side*10.3,8.8,z+.59],[.34,1.1,.05],.014);
      bevel(lab,ink,[side*14,2.8,z],[4.6,5.6,2.4],.12);
      for(let k=0;k<5;k++)bevel(lab,brass,[side*14,1+k*.75,z+1.25],[3.8,.028,.04],.008);
    }
    arch(lab,0,9.8,z,10.3,ink,.3);arch(lab,0,9.8,z+.08,10.6,brass,.045);
    for(const side of [-1,1])rod(lab,silver,[side*8,10.8,z],[side*8,10.8,z-8],.10);
  }
  // An upper walkway and pipe manifold establish scale above the foreground core.
  for(const side of [-1,1]){
    bevel(lab,ink,[side*13,6.8,-38],[5.8,.23,29],.04);
    for(let i=0;i<19;i++){const z=-25-i*1.45;rod(lab,brass,[side*10.2,6.95,z],[side*10.2,8.02,z],.031);}
    rod(lab,brass,[side*10.2,8.05,-25],[side*10.2,8.05,-51],.045);
    for(let i=0;i<3;i++)rod(lab,silver,[side*(15+i*.42),10.5+i*.6,-23],[side*(15+i*.42),10.5+i*.6,-57],.10+i*.025);
  }
  const clock=new T.Group();clock.position.set(0,10.5,-42);clock.userData.dynamic=true;lab.add(clock);
  for(const r of [3.2,3.5,3.66])ring(clock,brass,[0,0,0],r,.035);
  for(let i=0;i<48;i++){const a=i*Math.PI/24;const p=bevel(clock,i%4?brass:warm,[Math.cos(a)*3.4,Math.sin(a)*3.4,.02],[.045,i%4?.15:.32,.04],.008);p.rotation.z=a-Math.PI/2;}
  for(const [length,width,speed] of [[2.35,.03,.011],[1.7,.05,.023]]){
    const hand=new T.Group();clock.add(hand);rod(hand,brass,[0,-.3,.13],[0,length,.13],width);clockHands.push({hand,speed});
  }
  ball(clock,warm,[0,0,.12],[.09,.09,.04]);
  const deskLight=new T.PointLight(0xf8bf77,85,20,2);deskLight.position.set(0,9,-34);lab.add(deskLight);

  // Fine moving suspended lenses repeat the same precision language in the depth.
  for(const [x,y,z,r] of [[-6.5,10.7,-30,1.05],[6.7,11.5,-35,.82],[0,14.6,-45,1.6]]){
    const g=new T.Group();g.position.set(x,y,z);g.userData.dynamic=true;lab.add(g);
    const lens=mesh(new T.SphereGeometry(1,24,16),new T.MeshPhysicalMaterial({color:0x8db1ad,roughness:.18,metalness:.35,transparent:true,opacity:.24,depthWrite:false}),g,[0,0,0],[r,r,.12]);lens.castShadow=false;
    ring(g,brass,[0,0,0],r,.04);ring(g,brass,[0,0,.11],r*.84,.014);rod(lab,brass,[x,y+r,z],[x,16,z],.02);
    bolts(g,[0,0,.07],r*.94,24);animated.push({g,y,phase:x,rate:.07});
  }
  // Low-density world-space dust catches the key light, not a fullscreen filter.
  for(const [root,color,positions] of [[plaza,0xe6d4ae,100],[moon,0x9fb9c8,120],[lab,0xd5b37d,90]]){
    const points=[];for(let i=0;i<positions;i++)points.push((random()-.5)*22,1+random()*11,root===moon?-5-random()*50:(random()-.5)*24);
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));
    const material=new T.PointsMaterial({color,size:.025,transparent:true,opacity:.27,depthWrite:false});
    const dust=new T.Points(geo,material);dust.userData.dynamic=true;root.add(dust);dusts.push(dust);
  }
  return {
    update(t,s,reduced,hover){
      clockHands.forEach(({hand,speed})=>hand.rotation.z=reduced?0:-t*speed);
      animated.forEach(({g,y,phase,rate})=>{g.position.y=y+(reduced?0:Math.sin(t*.31+phase)*.09);g.rotation.y=reduced?0:Math.sin(t*rate+phase)*.17;});
      dusts.forEach((g,i)=>{g.position.y=reduced?0:Math.sin(t*.18+i)*.08;g.rotation.y=reduced?0:Math.sin(t*.04+i)*.012;});
      // Hover belongs to the physical console; its lighting reaches the device.
      deskLight.intensity=85+(hover==='atelier-energy'?30:0);
    },
    get state(){return {moonLayers:3,atelierLayers:3,paintings:['moon-horizon-v56.png','atelier-depth-v55.png']};}
  };
}
