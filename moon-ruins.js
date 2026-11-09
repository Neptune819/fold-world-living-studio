import * as T from './vendor/three.module.js';
import {loadSurface,applySurface} from './surface-materials.js?v=5.6';
import {createLunarWater} from './lunar-water.js?v=5.7';
import {buildLakeVoyage} from './lake-voyage.js?v=5.7';
import {createMoonCraft,moonArchStone} from './moon-craft.js?v=5.8';
const vertex=`varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const noise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){float n=0.,a=.5;for(int j=0;j<4;j++){n+=noise(p)*a;p=p*2.07+3.1;a*=.5;}return n;}`;

/** A traversable lunar sea, with three functional instruments along its shore. */
export async function buildMoonRuins(root,scene,portal,h){
  const {mesh,box,ring,rod,ball,cyl}=h;
  for(const child of [...root.children])if(child!==portal.frame)root.remove(child);
  portal.frame.position.set(0,3.2,-42);
  for(const l of [...scene.children])if(l.isLight)scene.remove(l);
  scene.fog=new T.FogExp2(0x091322,.0037);scene.environmentIntensity=.26;
  scene.add(new T.HemisphereLight(0x789bc2,0x101722,.58));
  const moonlight=new T.DirectionalLight(0xc4dcff,3.2);
  moonlight.position.set(-35,48,-65);moonlight.target.position.set(0,0,-32);moonlight.castShadow=true;moonlight.shadow.mapSize.set(1024,1024);
  Object.assign(moonlight.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:1,far:150});moonlight.shadow.normalBias=.035;scene.add(moonlight,moonlight.target);
  const rim=new T.DirectionalLight(0x8fa4bc,1.05);rim.position.set(12,17,12);rim.target.position.set(0,2,-32);scene.add(rim,rim.target);
  const gateLight=new T.PointLight(0xffce84,38,32,1.8);gateLight.position.set(0,3.2,-69);scene.add(gateLight);
  const stoneMaps=await loadSurface('rock_face');
  const stone=applySurface(new T.MeshStandardMaterial({color:0xa4afbb}),stoneMaps,{normal:.85,roughness:.94});
  const edge=stone.clone();edge.color.set(0x697782);
  const wetStone=stone.clone();wetStone.color.set(0x80909c);wetStone.roughness=.64;wetStone.metalness=.04;
  for(const material of [stone,edge,wetStone])material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat mineral=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(mineral)*vec3(.83,.94,1.13),.9);');};
  const bronze=new T.MeshStandardMaterial({color:0xad8050,metalness:.8,roughness:.37});
  const darkMetal=new T.MeshStandardMaterial({color:0x142334,metalness:.76,roughness:.35});
  const paleMetal=new T.MeshStandardMaterial({color:0x9fb6c8,metalness:.8,roughness:.3});
  const guiding=new T.MeshStandardMaterial({color:0xf1ca88,emissive:0xffb85b,emissiveIntensity:.45,roughness:.34,metalness:.3});
  const lampMaterial=new T.MeshStandardMaterial({color:0xffd596,emissive:0xffc875,emissiveIntensity:1.5,roughness:.15,metalness:.1});
  const blueLight=new T.MeshStandardMaterial({color:0xa8dbf4,emissive:0x91d9fa,emissiveIntensity:1.2,roughness:.2,metalness:.25});
  const crystal=new T.MeshPhysicalMaterial({color:0x87b4cb,metalness:.2,roughness:.16,transparent:true,opacity:.67,clearcoat:1});
  let seed=919;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const state={guides:false,resonance:false,constellation:false},dummy=new T.Object3D();
  function instances(parent,geometry,material,transforms,shadow=true){
    const o=new T.InstancedMesh(geometry,material,transforms.length);
    transforms.forEach((v,i)=>{dummy.position.set(...v.p);dummy.rotation.set(...(v.r||[0,0,0]));dummy.scale.set(...(v.s||[1,1,1]));dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);});
    o.castShadow=shadow;o.receiveShadow=shadow;parent.add(o);return o;
  }
  const floatingAssemblies=[];
  const boxGeometry=new T.BoxGeometry(1,1,1),sphereGeometry=new T.SphereGeometry(1,12,8),slabLines=[];
  function slab(x,y,z,radius,thickness,elongation=1,material=stone){
    const shape=new T.Shape(),n=18;
    for(let i=0;i<n;i++){const a=i*Math.PI*2/n,r=radius*(.82+rand()*.25),px=Math.cos(a)*r,py=Math.sin(a)*r*elongation;if(!i)shape.moveTo(px,py);else shape.lineTo(px,py);}shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:.07,bevelThickness:.055,bevelSegments:3,steps:1});
    const vertices=geo.attributes.position;
    for(let i=0;i<vertices.count;i++){const px=vertices.getX(i),py=vertices.getY(i),pz=vertices.getZ(i);vertices.setZ(i,pz+Math.sin(px*3.1+py*1.7)*.023+Math.sin(py*6.2-px*2.8)*.014);}
    const uv=geo.attributes.uv;for(let i=0;i<vertices.count;i++)uv.setXY(i,vertices.getX(i)/4.7+.5,vertices.getY(i)/4.7+.5);uv.needsUpdate=true;
    vertices.needsUpdate=true;geo.computeVertexNormals();
    // y names the walking surface, not the underside. Embedded lights remain
    // above the rock and the shore instruments rest on their foundations.
    const g=mesh(geo,[material,edge],root,[x,y-thickness,z]);g.rotation.x=-Math.PI/2;g.castShadow=true;
    for(let k=0;k<3;k++){const a=rand()*Math.PI*2,r=radius*(.45+rand()*.3),cx=x+Math.cos(a)*r,cz=z+Math.sin(a)*r*elongation;slabLines.push(cx,y+.097,cz,cx+Math.cos(a+.6)*radius*.2,y+.097,cz+Math.sin(a+.6)*radius*.2);}
    return g;
  }
  const guideTiles=[],studs=[];
  for(let i=0;i<16;i++){
    const z=10-i*3.2;
    for(const side of [-1,1]){
      const x=side*(3.9+Math.sin(i*.45)*.16);
      guideTiles.push({p:[x,.10,z],s:[.045,.065,.045]});studs.push({p:[x,-.07,z],s:[.14,.035,.14]});
      rod(root,darkMetal,[x,-.09,z],[x,.10,z],.018);
    }
  }
  // Leave a continuous eight-metre water channel, including through the gate.
  for(const side of [-1,1])slab(side*5.7,.10,-42,2.2,.65,.85,wetStone);
  for(const [x,z] of [[-6,-6],[6,-19],[-6,-34]]){
    slab(x,.25,z,2.25,.8,.8,wetStone);
    for(const dz of [-.9,.9]){cyl(root,bronze,[x-Math.sign(x)*1.8,.48,z+dz],.065,.48);ring(root,bronze,[x-Math.sign(x)*1.8,.76,z+dz],.10,.016).rotation.y=Math.PI/2;}
  }
  instances(root,sphereGeometry,guiding,guideTiles,false);instances(root,sphereGeometry,bronze,studs);
  for(let i=0;i<36;i++){const side=i%2?1:-1,x=side*(8+rand()*36),z=18-rand()*87;slab(x,-.13+rand()*.13,z,1.2+rand()*2.2,.7,.72);}
  const seams=new T.BufferGeometry();seams.setAttribute('position',new T.Float32BufferAttribute(slabLines,3));root.add(new T.LineSegments(seams,new T.LineBasicMaterial({color:0x29394b,transparent:true,opacity:.65})));
  // Three reusable fracture profiles give the columns torn silhouettes instead of square caps.
  const brokenProfiles=Array.from({length:3},(_,profile)=>{
    const g=new T.BoxGeometry(1,1,1,2,1,2),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      if(y>.4){let cut=.1+(x+.5)*(.16+profile*.04)+(z+.5)*(.24-profile*.03);if(x>.2&&z>.2)cut+=.24;
        p.setXYZ(i,x*(x>.2&&z>.2?.64:1),y-cut,z*(x>.2&&z>.2?.7:1));}
    }
    p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.parameters.fracture=profile;return g;
  });
  const brokenBlocks=[[],[],[]],fissures=[];
  const craft=await createMoonCraft(root,{stone,edge,wetStone,bronze,darkMetal,paleMetal});let pillarIndex=0;
  function pillar(x,z,height,scale=1){
    const detailed=Math.abs(x)<20&&z>-40,index=pillarIndex++;
    craft.pillar(x,z,height-.65,scale,detailed,index);
    // A single dislodged crown follows the existing levitation field. The main
    // shaft remains a load-bearing monolith, not a stack of hovering cubes.
    const profile=index%3;brokenBlocks[profile].push({p:[x+(rand()-.5)*scale*.22,height-.31,z+(rand()-.5)*scale*.19],s:[scale*.81,.72,scale*.82],r:[(rand()-.5)*.17,(rand()-.5)*.32,(rand()-.5)*.16]});
    for(let j=0;j<2;j++){const y=1.8+j*Math.min(2.2,height*.22);fissures.push(x-scale*.38,y,z+scale*.482,x-scale*.05,y-.21,z+scale*.482,x-scale*.05,y-.21,z+scale*.482,x+scale*.29,y-.14,z+scale*.482);}
    slab(x,-.06,z,scale*1.4,.35);
  }
  for(const [x,z,height,scale] of [[-7,11,12,1.5],[9,8,8,1.2],[-8,1,5.3,1],[8,-6,7,1.1],[-12,-14,9,1.4],[12,-22,12,1.2],[-18,-30,11,1.3]])pillar(x,z,height,scale);
  for(let i=0;i<28;i++)pillar((i%2?1:-1)*(17+rand()*38),-18-rand()*75,2+rand()*12,.45+rand()*.6);
  const masonry=craft.finish();
  brokenProfiles.forEach((g,i)=>{const o=instances(root,g,stone,brokenBlocks[i]);o.userData.dynamic=true;o.frustumCulled=false;floatingAssemblies.push({o,transforms:brokenBlocks[i],amplitude:.19});});
  const fissureGeometry=new T.BufferGeometry();fissureGeometry.setAttribute('position',new T.Float32BufferAttribute(fissures,3));root.add(new T.LineSegments(fissureGeometry,new T.LineBasicMaterial({color:0x101d2a,transparent:true,opacity:.72})));
  function brokenArch(x,y,z,r,start,end,width=.45){const transforms=[];for(let a=start;a<end;a+=.13){if(rand()<.23)continue;transforms.push({p:[x+(rand()-.5)*r*.027,y+(rand()-.5)*r*.019,z+(rand()-.5)*.22],r:[(rand()-.5)*.045,(rand()-.5)*.16,a+(rand()-.5)*.046],s:[.9+rand()*.18,.95+rand()*.09,.8+rand()*.35]});}const o=instances(root,moonArchStone(r,width,width*1.6),stone,transforms);o.userData.dynamic=true;o.frustumCulled=false;floatingAssemblies.push({o,transforms,amplitude:r>10?.6:.21});}
  brokenArch(0,3.2,-42,4.85,-.12,1.08,.4);brokenArch(0,3.2,-42,4.85,1.66,3.7,.4);brokenArch(-2,4,-55,20,.12,2.5,.65);brokenArch(-18,0,-50,7,.4,2.1,.55);
  ring(root,bronze,[0,3.2,-41.88],4.83,.035);for(let i=0;i<6;i++)for(const side of [-1,1])box(root,bronze,[side*(4.2+i*.38),.20,-41.1+i*.15],[.26,.035,1.4]);
  const {water,material:waterMat}=createLunarWater(root,scene);
  const voyage=buildLakeVoyage(root,waterMat);
  const sky=new T.Mesh(new T.SphereGeometry(175,32,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:vertex,fragmentShader:`varying vec3 vWorld;${noise}void main(){float h=clamp(vWorld.y/80.,0.,1.);vec3 c=mix(vec3(.075,.12,.19),vec3(.008,.016,.04),h);gl_FragColor=vec4(c,1.);}`}));sky.position.set(0,0,-40);root.add(sky);
  const stars=new T.BufferGeometry(),starPositions=[];for(let i=0;i<750;i++){const a=rand()*Math.PI*2,y=rand()*115+8,r=140;starPositions.push(Math.cos(a)*r,y,-35+Math.sin(a)*r);}
  stars.setAttribute('position',new T.Float32BufferAttribute(starPositions,3));root.add(new T.Points(stars,new T.PointsMaterial({color:0xbbcfe8,size:.085,transparent:true,opacity:.8,depthWrite:false})));
  const moonMap=await new T.TextureLoader().loadAsync('./assets/ruins-moon.png');moonMap.colorSpace=T.SRGBColorSpace;
  const moon=mesh(new T.PlaneGeometry(34,34),new T.MeshBasicMaterial({map:moonMap,transparent:true,depthWrite:false,color:0xe3edff,toneMapped:false}),root,[-41,29,-130]);moon.castShadow=false;
  moon.material.color.setRGB(1.55,1.64,1.78);
  // Four distant banks plus two lateral low ribbons, without a mist blanket over the moon.
  const mist=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;varying vec3 vWorld;uniform float time;${noise}void main(){float shape=pow(max(0.,sin(vUv.y*3.14159)),2.)*pow(max(0.,sin(vUv.x*3.14159)),.6);float n=fbm(vUv*vec2(13.,4.)+vec2(time*.018,0.));float passage=1.-.75*exp(-pow(vWorld.x/8.,2.));gl_FragColor=vec4(vec3(.34,.43,.54),shape*smoothstep(.23,.68,n)*.64*passage);}`,transparent:true,depthWrite:false,side:T.DoubleSide}),clouds=[];
  for(const [x,y,z,w] of [[-32,8.2,-98,98],[21,5.8,-78,100],[-24,10,-119,113],[25,8.7,-138,115]]){const g=mesh(new T.PlaneGeometry(w,12),mist,root,[x,y,z]);g.castShadow=false;clouds.push({g,x,z});}
  const lowMist=mist.clone();lowMist.uniforms=T.UniformsUtils.clone(mist.uniforms);
  for(const side of [-1,1]){const g=mesh(new T.PlaneGeometry(37,3.4),lowMist,root,[side*15,.85,-13]);g.rotation.y=side*.16;g.castShadow=false;clouds.push({g,x:side*15,z:-13});}
  const rockPaths=[];for(let i=0;i<38;i++){const a=i*.41;rockPaths.push({x:(i%2?1:-1)*(12+Math.sin(a)*3),y:9+rand()*12,z:-36-rand()*28,s:.13+rand()*.3,phase:rand()*Math.PI*2});}
  const debris=instances(root,new T.DodecahedronGeometry(1,0),edge,rockPaths.map(v=>({p:[v.x,v.y,v.z],s:[v.s,v.s*1.7,v.s*.8]})),false);debris.userData.dynamic=true;
  const constellation=new T.Group();constellation.userData.dynamic=true;root.add(constellation);
  const constellationPositions=[],constellationStars=[],knots=[[-36,37,-108],[-24,47,-117],[-12,40,-124],[1,52,-129],[17,41,-120],[31,45,-112],[40,32,-105]];
  for(let i=0;i<knots.length;i++){constellationStars.push({p:knots[i],s:[.16,.16,.16]});if(i)constellationPositions.push(...knots[i-1],...knots[i]);}
  const constellationGeo=new T.BufferGeometry();constellationGeo.setAttribute('position',new T.Float32BufferAttribute(constellationPositions,3));constellation.add(new T.LineSegments(constellationGeo,new T.LineBasicMaterial({color:0x91c4db,transparent:true,opacity:.42})));instances(constellation,sphereGeometry,blueLight,constellationStars,false);constellation.visible=false;
  const meteorGeometry=new T.BufferGeometry();meteorGeometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,0],3));
  const meteorMaterial=new T.LineBasicMaterial({color:0xc5e3ff,transparent:true,opacity:0,depthWrite:false}),meteor=new T.LineSegments(meteorGeometry,meteorMaterial);meteor.userData.dynamic=true;meteor.frustumCulled=false;root.add(meteor);
  const actionTargets=[],dialRings=[],relics=[];
  function instrumentBase(x,z){
    const g=new T.Group();g.position.set(x,.34,z);g.userData.dynamic=true;root.add(g);actionTargets.push(g);
    cyl(g,edge,[0,.2,0],.93,.4);cyl(g,bronze,[0,.43,0],.9,.075);cyl(g,darkMetal,[0,.57,0],.75,.2);cyl(g,bronze,[0,.71,0],.8,.055);
    const ribs=[];for(let i=0;i<24;i++){const a=i*Math.PI/12;ribs.push({p:[Math.sin(a)*.78,.6,Math.cos(a)*.78],s:[.032,.28,.045],r:[0,a,0]});}instances(g,boxGeometry,bronze,ribs);
    for(const side of [-1,1])rod(g,paleMetal,[side*.45,.7,0],[side*.45,1.3,0],.055);return g;
  }
  const astrolabe=instrumentBase(-6,-6),starDial=new T.Group();starDial.position.set(0,1.55,0);starDial.rotation.x=-.28;astrolabe.add(starDial);
  const dialFace=mesh(new T.CylinderGeometry(.91,.91,.055,64),darkMetal,starDial);dialFace.rotation.x=Math.PI/2;
  for(const r of [.92,.73,.42])ring(starDial,bronze,[0,0,.06],r,.025);
  const dialTicks=[];for(let i=0;i<48;i++){const a=i*Math.PI/24;dialTicks.push({p:[Math.sin(a)*.825,Math.cos(a)*.825,.068],s:[i%4===0?.025:.012,i%4===0?.095:.048,.018],r:[0,0,-a]});}instances(starDial,boxGeometry,paleMetal,dialTicks);
  const needle=rod(starDial,guiding,[0,-.18,.105],[.54,.51,.105],.019);ball(starDial,bronze,[0,0,.12],[.085,.085,.035]);
  const orbit=ring(starDial,bronze,[0,0,0],1.15,.025);orbit.rotation.y=.4;dialRings.push({o:orbit,base:orbit.rotation.z,rate:.07});
  const starHalo=ring(astrolabe,guiding,[0,.78,0],1.06,.018);starHalo.rotation.x=Math.PI/2;
  const memoryLamp=instrumentBase(6,-19),lantern=new T.Group();lantern.position.y=1.55;memoryLamp.add(lantern);ball(lantern,lampMaterial,[0,0,0],[.26,.39,.26]);
  for(const y of [-.55,.55])cyl(lantern,bronze,[0,y,0],.41,.12);
  const cage=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;cage.push({p:[Math.sin(a)*.36,0,Math.cos(a)*.36],s:[.038,1.07,.038]});}instances(lantern,boxGeometry,bronze,cage);
  mesh(new T.SphereGeometry(.48,24,12),crystal,lantern,[0,0,0],[1,1.3,1]);
  const lampOrbit=ring(lantern,paleMetal,[0,0,0],.66,.022);lampOrbit.rotation.y=.55;dialRings.push({o:lampOrbit,base:0,rate:-.055});
  const lampRays=ring(memoryLamp,blueLight,[0,.81,0],1.09,.018);lampRays.rotation.x=Math.PI/2;
  const lampPoint=new T.PointLight(0xffd39a,6,10,2);lampPoint.position.set(6,2.1,-47);scene.add(lampPoint);
  const observatory=instrumentBase(-6,-34),observationHead=new T.Group();observationHead.position.set(0,1.48,0);observationHead.rotation.set(-.27,.2,0);observatory.add(observationHead);
  const barrel=cyl(observationHead,darkMetal,[0,0,0],.34,1.5);barrel.rotation.x=Math.PI/2;
  for(const z of [-.72,.35,.7]){const collar=cyl(observationHead,bronze,[0,0,z],z===.7?.42:.37,.13);collar.rotation.x=Math.PI/2;}
  const lens=mesh(new T.CircleGeometry(.31,48),blueLight,observationHead,[0,0,.782]);ring(observationHead,paleMetal,[0,0,.8],.35,.03);
  const meridian=ring(observatory,bronze,[0,1.48,0],1.09,.025);meridian.rotation.y=.5;dialRings.push({o:meridian,base:0,rate:.045});
  for(let i=0;i<3;i++)rod(observatory,bronze,[0,.78,0],[Math.cos(i*Math.PI*2/3)*.72,.92,Math.sin(i*Math.PI*2/3)*.72],.035);
  craft.shoreInstrument(astrolabe,'astrolabe');craft.shoreInstrument(memoryLamp,'lamp');craft.shoreInstrument(observatory,'observatory');
  const actions=[
    {id:'moon-astrolabe',label:'星盘 · 点亮航道',target:astrolabe,anchor:[0,2.1,0],activate(){state.guides=!state.guides;},getStatus(){return state.guides?'航道浮标已点亮':'航道浮标待唤醒';}},
    {id:'moon-memory-lamp',label:'共鸣灯 · 唤醒月海',target:memoryLamp,anchor:[0,2.25,0],activate(){state.resonance=!state.resonance;},getStatus(){return state.resonance?'月海正在共鸣':'月海静息';}},
    {id:'moon-observatory',label:'观测仪 · 显现星轨',target:observatory,anchor:[0,2.15,0],activate(){state.constellation=!state.constellation;},getStatus(){return state.constellation?'星轨已显现':'星轨已隐藏';}}
  ];
  for(const g of actionTargets){const inlay=ring(g,bronze,[0,.015,0],1.7,.014);inlay.rotation.x=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(g,bronze,[Math.cos(a)*1.45,.02,Math.sin(a)*1.45],[Math.cos(a)*1.68,.02,Math.sin(a)*1.68],.012);}}
  relics.push({o:lantern,y:1.55},{o:starDial,y:1.55});
  // Near-camera motes retain stable WORLD positions; travel controls short depth trails.
  const count=84,flowPositions=new Float32Array(count*6),flowSeeds=[];
  for(let i=0;i<count;i++)flowSeeds.push({x:(i%2?1:-1)*(2.6+rand()*5),y:.9+rand()*5.8,z:14-rand()*58,phase:rand()*6.28});
  const flowGeometry=new T.BufferGeometry();flowGeometry.setAttribute('position',new T.BufferAttribute(flowPositions,3));
  const flowMaterial=new T.LineBasicMaterial({color:0xb9d7ec,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}),flow=new T.LineSegments(flowGeometry,flowMaterial);flow.userData.dynamic=true;flow.frustumCulled=false;root.add(flow);
  const localEye=new T.Vector3();let previousTime=null,flowAmount=0,resonanceAmount=0,guidesAmount=0,flowPhase=0,resonanceTime=0;
  return {
    waterMaterial:waterMat,stoneMaterial:stone,actions,get state(){return {...state,reflection:'scene-planar',floatingAssemblies:floatingAssemblies.length,travelIntensity:Number(flowAmount.toFixed(3)),instruments:3,masonry,voyage:voyage.state};},
    update(t,reduced,camera,s=0,speed=0){
      voyage.update(t,reduced,camera,s,speed);
      const dt=previousTime===null?0:T.MathUtils.clamp(t-previousTime,0,.1);previousTime=t;const environment=reduced?0:t;
      waterMat.uniforms.time.value=environment;waterMat.uniforms.waterTime.value=environment;waterMat.uniforms.eye.value.copy(camera.position);mist.uniforms.time.value=environment;lowMist.uniforms.time.value=environment;
      moon.quaternion.copy(camera.quaternion);clouds.forEach(({g,x,z},i)=>{g.position.x=x+(reduced?0:Math.sin(t*.018+i)*6);g.position.z=z+(reduced?0:Math.sin(t*.013+i)*1.1);});
      floatingAssemblies.forEach(({o,transforms,amplitude},groupIndex)=>{transforms.forEach((v,i)=>{const phase=i*.71+groupIndex;dummy.position.set(...v.p);dummy.position.y+=reduced?0:Math.sin(t*.36+phase)*amplitude;dummy.position.x+=reduced?0:Math.sin(t*.21+phase)*amplitude*.32;dummy.rotation.set(...(v.r||[0,0,0]));if(!reduced)dummy.rotation.z+=Math.sin(t*.27+phase)*.024;dummy.scale.set(...(v.s||[1,1,1]));dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);});o.instanceMatrix.needsUpdate=true;});
      guidesAmount=reduced?Number(state.guides):T.MathUtils.damp(guidesAmount,Number(state.guides),3,dt);
      resonanceAmount=reduced?Number(state.resonance):T.MathUtils.damp(resonanceAmount,Number(state.resonance),2,dt);
      guiding.emissiveIntensity=.42+guidesAmount*2.3;needle.rotation.z=guidesAmount*.62;
      lampMaterial.emissiveIntensity=1.5+resonanceAmount*2.4;lampPoint.intensity=6+resonanceAmount*8;lampRays.visible=state.resonance;
      if(!reduced&&state.resonance)resonanceTime+=dt;
      waterMat.uniforms.resonance.value=resonanceAmount;waterMat.uniforms.resonanceTime.value=resonanceTime;
      constellation.visible=state.constellation;lens.material=state.constellation?lampMaterial:blueLight;observationHead.rotation.y=.2+(state.constellation?.55:0);
      dialRings.forEach(({o,base,rate})=>o.rotation.z=base+(reduced?0:t*rate));relics.forEach(({o,y},i)=>o.position.y=y+(reduced?0:Math.sin(t*.45+i)*.055));
      rockPaths.forEach((v,i)=>{dummy.position.set(v.x,v.y+(reduced?0:Math.sin(t*.16+v.phase)*.38),v.z);dummy.rotation.set(v.phase+(reduced?0:t*.018),v.phase*.7,0);dummy.scale.set(v.s,v.s*1.7,v.s*.8);dummy.updateMatrix();debris.setMatrixAt(i,dummy.matrix);});debris.instanceMatrix.needsUpdate=true;
      const meteorPhase=(t+17)%83;meteor.visible=!reduced&&meteorPhase<2.3;
      if(meteor.visible){const u=meteorPhase/2.3,p=meteorGeometry.attributes.position.array;p.set([-52+u*61,57-u*24,-115,-56+u*61,58.6-u*24,-115]);meteorGeometry.attributes.position.needsUpdate=true;meteorMaterial.opacity=Math.sin(u*Math.PI)*.72;}
      const moving=!reduced&&s>=10.6&&s<=15.1,intensity=moving?Math.min(1,Math.abs(Number(speed)||0)*.85):0;
      flowAmount=T.MathUtils.damp(flowAmount,intensity,8,dt);if(reduced)flowAmount=0;flowMaterial.opacity=flowAmount*.28;flow.visible=flowAmount>.004;
      if(flow.visible){root.updateWorldMatrix(true,false);localEye.copy(camera.position);root.worldToLocal(localEye);flowPhase+=dt*(Number(speed)||0)*1.4;
        flowSeeds.forEach((v,i)=>{const z=14-((14-v.z-flowPhase)%58+58)%58,y=v.y+Math.sin(environment*.17+v.phase)*.12,x=v.x+Math.sin(environment*.12+v.phase)*.09,dist=Math.abs(z-localEye.z),length=(.06+flowAmount*.48)*Math.max(.2,1-dist/24),o=i*6;flowPositions.set([x,y,z,x,y,z+length],o);});flowGeometry.attributes.position.needsUpdate=true;
      }
    }
  };
}
