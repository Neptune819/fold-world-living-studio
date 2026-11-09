import * as T from './vendor/three.module.js';
import {refineEnvironments} from './precision-environments.js?v=5.2';
import {buildMoonRuins} from './moon-ruins.js?v=5.8.1';
import {buildMagicGates,gateVertex,gateFragment} from './magic-gates.js?v=5.6';
import {buildResearchAtelier} from './research-atelier.js?v=5.8';
import {buildLivingAtmospheres} from './living-atmospheres.js?v=5.6';
import {finesseWorlds} from './scene-finesse.js?v=5.6';

const ease=(x)=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const noise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=mat2(.8,.6,-.6,.8)*p*2.03+3.1;a*=.5;}return v;}`;
const magicFragment=`uniform float time;uniform float opacity;varying vec2 vUv;${noise}
void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);float twist=a+3.6*r-time*.14;vec2 q=vec2(cos(twist),sin(twist))*r*3.4;float cloud=fbm(q+vec2(time*.045,-time*.03));float fold=fbm(q*2.+cloud*2.-time*.08);float thread=pow(.5+.5*sin(twist*7.+r*27.+fold*9.),12.)*.22;vec3 c=mix(vec3(.22,.34,.34),vec3(.86,.86,.72),smoothstep(.16,.8,cloud));c=mix(c,vec3(1.,.82,.48),thread);c+=vec3(.18,.15,.09)*(1.-smoothstep(0.,1.,r));gl_FragColor=vec4(c,opacity);}`;

function texture(draw,size=1024){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;return tex;}
function inlay(light=false){return texture((c,s)=>{c.fillStyle=light?'#d6ccaf':'#16202c';c.fillRect(0,0,s,s);c.strokeStyle=light?'#745733':'#b38b4b';c.lineWidth=2;
  for(const r of [.18,.21,.34,.355,.43,.445]){c.beginPath();c.arc(s/2,s/2,s*r,0,Math.PI*2);c.stroke();}
  for(let j=0;j<32;j++){const a=j*Math.PI/16;c.save();c.translate(s/2,s/2);c.rotate(a);c.beginPath();c.moveTo(s*.21,0);c.lineTo(s*.34,0);c.moveTo(s*.43,-3);c.lineTo(s*.445,-3);c.stroke();if(j%2===0){c.beginPath();c.moveTo(s*.27,0);c.bezierCurveTo(s*.17,-s*.075,s*.44,-s*.085,s*.37,0);c.bezierCurveTo(s*.44,s*.085,s*.17,s*.075,s*.27,0);c.stroke();}c.restore();}
  c.save();c.translate(s/2,s/2);for(let i=0;i<16;i++){c.rotate(Math.PI/8);c.beginPath();c.moveTo(0,-s*.17);c.lineTo(s*.025,-s*.045);c.lineTo(0,0);c.lineTo(-s*.025,-s*.045);c.closePath();c.stroke();}c.restore();
  for(let i=0;i<4;i++){c.strokeRect(12+i*9,12+i*9,s-24-i*18,s-24-i*18);}for(let i=0;i<2000;i++){c.fillStyle=`rgba(255,240,190,${.015+(i%4)*.005})`;c.fillRect((i*619)%s,(i*397)%s,2,1);}
});}

// Instance repeated static details without changing the independent animated objects.
function batch(root){root.updateWorldMatrix(true,true);const inv=root.matrixWorld.clone().invert(),groups=new Map();root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.material.transparent||o.material.isShaderMaterial)return;let p=o;while(p&&p!==root){if(p.userData.dynamic)return;p=p.parent;}const key=(o.geometry.parameters?o.geometry.type+JSON.stringify(o.geometry.parameters):o.geometry.uuid)+o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);});for(const objects of groups.values()){if(objects.length<4)continue;const inst=new T.InstancedMesh(objects[0].geometry,objects[0].material,objects.length);objects.forEach((o,i)=>{inst.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));o.removeFromParent();});inst.castShadow=true;inst.receiveShadow=true;root.add(inst);}}

export async function createWorlds(roots,scenes,portals,h){
  const {mesh,box,cyl,ring,rod,ball,cream,dark,gold,silver,light,glass,scenery,detail}=h;
  const [plaza,library,lab]=roots;
  // Retire the botanical geometry; retain only the existing destination gateway.
  for(const child of [...library.children])if(child!==portals[1].frame)library.remove(child);
  portals[1].frame.position.y=4.4;
  const woodTex=texture((c,s)=>{c.fillStyle='#342017';c.fillRect(0,0,s,s);for(let i=0;i<1900;i++){c.strokeStyle=`rgba(${i%2?126:12},${i%2?77:9},${i%2?43:8},.18)`;c.beginPath();const x=(i*71)%s;c.moveTo(x,0);c.bezierCurveTo(x+20,300,x-24,700,x+12,s);c.stroke();}});
  const wood=new T.MeshStandardMaterial({map:woodTex,roughness:.4,color:0xb69270});
  const ebony=new T.MeshStandardMaterial({color:0x151b26,roughness:.38,metalness:.15});
  const brass=new T.MeshStandardMaterial({color:0xaf8545,metalness:.8,roughness:.29});
  const carpet=new T.MeshStandardMaterial({color:0x50252d,roughness:.93});
  const pearl=new T.MeshStandardMaterial({color:0xffecc7,emissive:0xffc677,emissiveIntensity:1.2,roughness:.24});
  const darkFloor=new T.MeshStandardMaterial({map:inlay(),roughness:.3,metalness:.35});
  const ivoryFloor=new T.MeshStandardMaterial({map:inlay(true),roughness:.43,metalness:.13});
  const floorDisk=mesh(new T.CircleGeometry(11.35,128),ivoryFloor,plaza,[0,.13,0]);floorDisk.rotation.x=-Math.PI/2;floorDisk.castShadow=false;
  const labDisk=mesh(new T.CircleGeometry(11.35,128),darkFloor,lab,[0,.13,0]);labDisk.rotation.x=-Math.PI/2;
  const floats=[],stairs=[],magic=[],clouds=[],cities=[];
  function medallion(parent,x,y,z,r=.4){const g=new T.Group();g.position.set(x,y,z);parent.add(g);ring(g,brass,[0,0,0],r,.035);ring(g,brass,[0,0,.015],r*.78,.012);for(let i=0;i<12;i++){const a=i*Math.PI/6;rod(g,brass,[r*.8*Math.sin(a),r*.8*Math.cos(a),.03],[r*Math.sin(a),r*Math.cos(a),.03],.012);}rod(g,gold,[0,0,.08],[r*.6,r*.3,.08],.018);ball(g,silver,[0,0,.08],[.055,.055,.025]);return g;}
  function rail(parent,a,b){rod(parent,wood,[a[0],a[1]+1.2,a[2]],[b[0],b[1]+1.2,b[2]],.08);rod(parent,brass,[a[0],a[1]+1.1,a[2]],[b[0],b[1]+1.1,b[2]],.022);const distance=new T.Vector3(...a).distanceTo(new T.Vector3(...b)),n=Math.ceil(distance/.65);for(let i=0;i<=n;i++){const f=i/n,x=T.MathUtils.lerp(a[0],b[0],f),y=T.MathUtils.lerp(a[1],b[1],f),z=T.MathUtils.lerp(a[2],b[2],f);cyl(parent,brass,[x,y+.6,z],.034,1.1);ball(parent,brass,[x,y+.8,z],[.08,.12,.08]);cyl(parent,wood,[x,y+.16,z],.075,.25);}}
  function deck(x,y,z,w,d){box(library,wood,[x,y-.25,z],[w,.5,d]);const tile=mesh(new T.PlaneGeometry(w-.12,d-.12),darkFloor,library,[x,y+.012,z]);tile.rotation.x=-Math.PI/2;for(const side of [-1,1])box(library,brass,[x+side*(w/2-.08),y+.02,z],[.035,.035,d]);}
  const bookMats=[0x402b29,0x263b40,0x715634,0x28273a,0x4b4433,0x723d34].map(color=>new T.MeshStandardMaterial({color,roughness:.8}));
  function armillary(parent,position,scale=1){const g=new T.Group();g.userData.dynamic=true;g.position.set(...position);g.scale.setScalar(scale);parent.add(g);ball(g,pearl,[0,0,0],[.3,.3,.3]);const rings=[];for(let j=0;j<3;j++){const r=ring(g,brass,[0,0,0],.7+j*.18,.025);r.rotation.set(j*.6,.4+j*.5,0);rings.push(r);}for(let j=0;j<12;j++){const a=j*Math.PI/6;ball(g,brass,[Math.cos(a)*1.1,Math.sin(a)*1.1,0],[.04,.04,.04]);}rod(g,brass,[0,-1.35,0],[0,1.35,0],.028);ball(g,brass,[0,-1.4,0],[.12,.2,.12]);batch(g);floats.push({g,y:position[1],rings});return g;}
  armillary(plaza,[-7,4.8,2.5],.8);armillary(plaza,[7,4.8,2.5],.8);
  for(const side of [-1,1]){medallion(plaza,side*7,1.45,3.63,.68);for(let j=0;j<4;j++)box(plaza,brass,[side*7-.65+j*.43,.8,3.65],[.08,.35,.035]);}
  // Research institute enclosure, instrument faces and layered mechanical housings.
  const steel=new T.MeshStandardMaterial({color:0x25373c,metalness:.4,roughness:.5});
  box(lab,steel,[0,16,-5],[38,.5,62]);box(lab,steel,[0,7,-30],[38,18,.5]);for(const side of [-1,1]){box(lab,steel,[side*19,7,-5],[.5,18,62]);for(let j=0;j<8;j++){const z=14-j*5;box(lab,dark,[side*16,4,z],[2,8,4]);medallion(lab,side*15.8,4,z+2.04,.65);for(let k=0;k<3;k++){box(lab,brass,[side*15.4+k*.22,1.8,z+2.08],[.12,.7,.06]);}rod(lab,silver,[side*14,10,z],[side*14,10,z-5],.12);}}
  for(let z=12;z>-29;z-=8)box(lab,light,[0,15.5,z],[14,.1,.25]);
  const coreDecor=new T.Group();lab.add(coreDecor);for(let j=0;j<48;j++){const a=j*Math.PI/24;const g=box(coreDecor,brass,[Math.cos(a)*2.8,.96,-3+Math.sin(a)*2.8],[.15,.12,.32]);g.rotation.y=-a;}
  scenes[2].fog=new T.Fog(0x162933,35,110);scenes[2].environmentIntensity=.3;scenes[2].children.filter(o=>o.isHemisphereLight).forEach(o=>o.intensity=.5);
  // The city stays a scenic distant painting; the nearer architecture genuinely levitates.
  for(const o of plaza.children)if(o.isGroup&&Math.abs(o.position.x)===19&&o.position.y===-4)cities.push({g:o,y:o.position.y});
  for(let i=0;i<6;i++){const g=new T.Group();g.position.set((i%2?1:-1)*(34+i*4),-3+(i%3)*3,-30-i*7);scenery.atmosphere.add(g);cyl(g,cream,[0,0,0],3,1);cyl(g,dark,[0,-.7,0],2.5,.3);for(let j=0;j<8;j++){const a=j*Math.PI/4;cyl(g,cream,[2*Math.cos(a),3,2*Math.sin(a)],.18,6);cyl(g,gold,[2*Math.cos(a),6,2*Math.sin(a)],.3,.2);}mesh(new T.SphereGeometry(2.6,24,12,0,Math.PI*2,0,Math.PI/2),gold,g,[0,6,0]);rod(g,gold,[0,8.5,0],[0,10,0],.055);cities.push({g,y:g.position.y});}
  const cloudMaterial=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform float time;${noise}void main(){vec2 p=vUv;float shape=(1.-smoothstep(.1,.52,length((p-.5)*vec2(.8,1.8))));float n=fbm(p*6.+vec2(time*.026,0));float a=shape*smoothstep(.28,.7,n)*.48;vec3 c=mix(vec3(.43,.53,.53),vec3(.96,.9,.75),n);gl_FragColor=vec4(c,a);}`,transparent:true,depthWrite:false,side:T.DoubleSide});
  for(let i=0;i<9;i++){const c=mesh(new T.PlaneGeometry(1,1),cloudMaterial,scenery.atmosphere,[(i%3-1)*23,-5-Math.floor(i/3)*3,-8-Math.floor(i/3)*20],[38,13,1]);c.castShadow=false;clouds.push({g:c,x:c.position.x,y:c.position.y});}
  // Restrained diagonal light shafts reinforce the same upper-left sun direction as shadows.
  function shaft(parent,x,y,z,w,length,rotation,color=0xffd9a0){const mat=new T.ShaderMaterial({uniforms:{color:{value:new T.Color(color)}},vertexShader:vertex,fragmentShader:'varying vec2 vUv;uniform vec3 color;void main(){float edge=pow(max(0.,sin(vUv.x*3.14159)),3.);float a=edge*pow(1.-vUv.y,1.2)*.075;gl_FragColor=vec4(color,a);}',transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});const g=mesh(new T.PlaneGeometry(w,length),mat,parent,[x,y,z]);g.rotation.z=rotation;g.castShadow=false;}
  shaft(plaza,-5,10,-4,3,23,-.6);shaft(plaza,2,11,-9,1.7,26,-.6);
  scenes[0].children.filter(o=>o.isHemisphereLight).forEach(o=>o.intensity=.55);const sun=scenes[0].children.find(o=>o.isDirectionalLight&&o.castShadow);if(sun){sun.position.set(-18,25,10);sun.intensity=3.8;}
  const gates=buildMagicGates(portals,scenes,h);
  const sky=await new T.TextureLoader().loadAsync('./assets/utopia-sky.png');sky.colorSpace=T.SRGBColorSpace;
  const backgroundCamera=new T.OrthographicCamera(-1,1,1,-1,0,2),backgrounds=[];
  for(let i=0;i<3;i++){const scene=new T.Scene();const mat=new T.MeshBasicMaterial(i===0?{map:sky,depthTest:false,depthWrite:false,toneMapped:false}:{color:i===1?0x0b1528:0x17262c,depthTest:false,depthWrite:false});const quad=new T.Mesh(new T.PlaneGeometry(2,2),mat);quad.position.z=-1;scene.add(quad);backgrounds.push({scene,quad});}
  const transitScene=new T.Scene(),transitMaterial=new T.ShaderMaterial({uniforms:{time:{value:0},opacity:{value:0},nearGate:{value:1}},vertexShader:gateVertex,fragmentShader:gateFragment,transparent:true,depthTest:false,depthWrite:false});const veil=new T.Mesh(new T.PlaneGeometry(2,2),transitMaterial);veil.position.z=-1;transitScene.add(veil);
  for(const {frame} of portals)frame.userData.dynamic=true;
  for(const {flag} of detail.flags)flag.userData.dynamic=true;
  for(const {sprite} of detail.mist)sprite.userData.dynamic=true;
  for(const {pod} of detail.pods)pod.userData.dynamic=true;
  for(const o of plaza.children)if(o.isGroup&&Math.abs(o.position.x)===19)o.userData.dynamic=true;
  for(const {g} of cities){batch(g);g.userData.dynamic=true;}
  detail.airship.userData.dynamic=true;
  batch(detail.airship);
  const precision=refineEnvironments(roots,scenes,{...h,skipLibrary:true},{wood,ebony,brass,pearl,darkFloor,bookMats,carpet},stairs,batch,floats);
  const ruins=await buildMoonRuins(library,scenes[1],portals[1],h);
  const atelier=await buildResearchAtelier(lab,scenes[2],h);
  const finesse=await finesseWorlds(roots,scenes,h,floorDisk,ruins,atelier);
  const atmosphere=await buildLivingAtmospheres(library,lab,h);
  floorDisk.userData.dynamic=true;
  batch(plaza);batch(library);batch(lab);
  function update(t,s,reduced,hovered,camera,speed=0){
    atmosphere.update(t,reduced,camera);
    precision.update(t,s,reduced);
    finesse.update(t,s,reduced,hovered);
    ruins.update(t,reduced,camera,s,speed);atelier.update(t,s,reduced);gates.update(t,reduced,hovered,camera);
    stairs.forEach(st=>{const f=reduced?1:ease((s-st.begin)/(st.finish-st.begin));st.group.rotation.y=st.angle+st.offset*(1-f);});
    floats.forEach(({g,y,rings},i)=>{g.position.y=y+(reduced?0:Math.sin(t*.65+i)*.17);rings.forEach((r,j)=>r.rotation.z=reduced?0:t*(.1+j*.035)*(j%2?-1:1));});
    cities.forEach(({g,y},i)=>{g.position.y=y+(reduced?0:Math.sin(t*.28+i*1.4)*.6);g.rotation.z=reduced?0:Math.sin(t*.17+i)*.012;});
    clouds.forEach(({g,x,y},i)=>{g.position.x=x+(reduced?0:Math.sin(t*.045+i)*7);g.position.y=y+(reduced?0:Math.sin(t*.16+i)*.5);g.quaternion.copy(camera.quaternion);});cloudMaterial.uniforms.time.value=reduced?0:t;
    magic.forEach(({mat,moving},i)=>{mat.uniforms.time.value=reduced?0:t;moving.forEach((g,j)=>g.rotation.z=reduced?0:t*(j===1?-.035:.02));});
    transitMaterial.uniforms.time.value=reduced?0:t;
    const distance=Math.min(Math.abs(camera.position.z+14),Math.abs(camera.position.z+70));transitMaterial.uniforms.opacity.value=1-ease(distance/.85);
  }
  function drawTransit(renderer){if(transitMaterial.uniforms.opacity.value>.001)renderer.render(transitScene,backgroundCamera);}
  return {backgrounds,backgroundCamera,update,drawTransit,stairs,floats,core:h.core,
    actions:[...ruins.actions.map(a=>({...a,world:1})),...atelier.actions.map(a=>({...a,world:2}))],
    turntables:[{world:0,target:floorDisk,setAngle:a=>{floorDisk.rotation.z=-a;}},{world:2,target:atelier.turntable,setAngle:a=>atelier.setTurntable(a)}],
    get environmentState(){return{ruins:ruins.state,atelier:atelier.state,finesse:finesse.state,atmosphere:atmosphere.state};}};
}

