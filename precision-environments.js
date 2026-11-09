import * as T from './vendor/three.module.js';

// All surfaces are generated locally. Colour, relief and roughness have separate maps.
function canvasTexture(draw, size=512, colour=true) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  draw(canvas.getContext('2d'),size);
  const map=new T.CanvasTexture(canvas);map.colorSpace=colour?T.SRGBColorSpace:T.NoColorSpace;
  map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;return map;
}
function grain(kind, colour=true) {
  return canvasTexture((c,n)=>{
    c.fillStyle=colour?(kind==='wood'?'#825438':'#56646a'):'#a6a6a6';c.fillRect(0,0,n,n);
    let seed=319;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let j=0;j<1800;j++){
      const v=Math.floor(60+rand()*160);c.strokeStyle=colour?`rgba(${v},${v},${v},.11)`:`rgba(${v},${v},${v},.22)`;
      c.lineWidth=.3+rand()*.7;const x=rand()*n;
      c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+Math.sin(j)*5,n*.3,x-Math.cos(j)*8,n*.7,x,n);c.stroke();
    }
  },512,colour);
}
function dialTexture() {
  return canvasTexture((c,n)=>{
    c.fillStyle='#d0c6a7';c.fillRect(0,0,n,n);c.translate(n/2,n/2);
    c.strokeStyle='#263b3a';c.lineWidth=4;c.beginPath();c.arc(0,0,n*.44,0,Math.PI*2);c.stroke();
    for(let i=0;i<61;i++){const a=(-.75+i/60*1.5)*Math.PI;const r=n*.38;c.save();c.rotate(a);c.beginPath();c.moveTo(0,-r);c.lineTo(0,-r+(i%5===0?24:11));c.stroke();c.restore();}
    c.fillStyle='#35423b';c.textAlign='center';c.font='24px serif';c.fillText('CALIBRATED',0,68);c.font='15px serif';c.fillText('1936 · OPTICAL LABORATORY',0,104);
    c.strokeStyle='#89734d';c.lineWidth=2;c.strokeRect(-76,-42,152,45);
  });
}
function astralTexture() {
  return canvasTexture((c,n)=>{
    c.fillStyle='#132636';c.fillRect(0,0,n,n);c.translate(n/2,n/2);
    c.strokeStyle='#ab8954';c.lineWidth=1.2;
    for(let i=0;i<18;i++){c.beginPath();c.ellipse(0,0,n*.43,n*(.04+i*.022),i*.18,0,Math.PI*2);c.stroke();}
    for(let i=0;i<120;i++){const a=i*2.39996,r=Math.sqrt((i+.5)/120)*n*.43;c.fillStyle=i%7===0?'#efe0b3':'#718998';c.beginPath();c.arc(Math.cos(a)*r,Math.sin(a)*r,i%7===0?2.2:.8,0,Math.PI*2);c.fill();}
    c.fillStyle='#c09b5d';c.font='20px serif';c.textAlign='center';c.fillText('CELESTIAL ARCHIVE',0,n*.47);
  },1024);
}
const bevels=new Map();
function roundedGeometry(w,h,d,r=.05) {
  const key=[w,h,d,r].join(':');if(bevels.has(key))return bevels.get(key);
  r=Math.min(r,w/5,h/5,d/5);const s=new T.Shape();
  s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
  s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);
  s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const g=new T.ExtrudeGeometry(s,{depth:d-r*2,bevelEnabled:true,bevelThickness:r,bevelSize:r*.45,bevelSegments:2,curveSegments:3,steps:1});g.translate(0,0,-d/2+r);bevels.set(key,g);return g;
}

export function refineEnvironments(roots,scenes,h,materials,stairs,batch,floats) {
  const {mesh,box,cyl,rod,ring,ball,core,nucleus,coreRings}=h;
  const {wood,ebony,brass,pearl,darkFloor,bookMats,carpet}=materials;
  const [,library,lab]=roots,rotors=[],needles=[];
  const brassRelief=grain('metal',false),woodRelief=grain('wood',false);
  wood.bumpMap=woodRelief;wood.bumpScale=.025;wood.roughnessMap=woodRelief;wood.roughness=.68;wood.color.set(0xd6a477);
  brass.bumpMap=brassRelief;brass.bumpScale=.008;brass.roughnessMap=brassRelief;brass.roughness=.48;
  darkFloor.bumpMap=brassRelief;darkFloor.bumpScale=.012;darkFloor.roughness=.46;
  carpet.map=canvasTexture((c,n)=>{c.fillStyle='#712737';c.fillRect(0,0,n,n);for(let x=0;x<n;x+=3){c.fillStyle=x%2?'#733141':'#602333';c.fillRect(x,0,1,n);}c.strokeStyle='#bd9257';c.lineWidth=3;for(const x of [20,29,n-20,n-29]){c.beginPath();c.moveTo(x,0);c.lineTo(x,n);c.stroke();}for(let j=0;j<8;j++){const y=j*n/8;c.beginPath();c.moveTo(n/2,y);c.lineTo(n/2+12,y+12);c.lineTo(n/2,y+24);c.lineTo(n/2-12,y+12);c.closePath();c.stroke();}});
  bookMats.forEach((mat,i)=>{mat.map=canvasTexture((c,n)=>{c.fillStyle=['#9b7d65','#718582','#aa9168','#7c7585','#92936f','#b27860'][i];c.fillRect(0,0,n,n);c.strokeStyle='#d5b47e';c.lineWidth=2;c.strokeRect(14,14,n-28,n-28);c.strokeRect(24,24,n-48,n-48);for(const y of [65,100,n-65,n-100])c.fillRect(12,y,n-24,4);c.save();c.translate(n/2,n/2);c.rotate(Math.PI/4);c.strokeRect(-36,-36,72,72);c.restore();c.font='20px serif';c.textAlign='center';c.fillStyle='#d5b47e';c.fillText(['ASTRA','OPTICA','HERBARIA','MEMORIA','NATURA','CHRONOS'][i],n/2,n*.62);},256);});
  const ivory=new T.MeshStandardMaterial({color:0xbeb49b,roughness:.68,bumpMap:woodRelief,bumpScale:.015});
  const enamel=new T.MeshPhysicalMaterial({color:0x203c3d,metalness:.45,roughness:.3,clearcoat:.55,clearcoatRoughness:.25,bumpMap:brassRelief,bumpScale:.009});
  const nickel=new T.MeshStandardMaterial({color:0x9caeb3,metalness:.88,roughness:.34,bumpMap:brassRelief,bumpScale:.006,roughnessMap:brassRelief});
  const recess=new T.MeshStandardMaterial({color:0x101e24,roughness:.62});
  const warm=new T.MeshStandardMaterial({color:0xffda92,emissive:0xffb953,emissiveIntensity:1.4,roughness:.5});
  const cold=new T.MeshStandardMaterial({color:0xb9ded9,emissive:0x4caaa8,emissiveIntensity:1.25,roughness:.45});
  const red=new T.MeshStandardMaterial({color:0x753527,roughness:.4,metalness:.35});
  function bevel(parent,mat,pos,size,r=.05){return mesh(roundedGeometry(...size,r),mat,parent,pos);}
  const screwGeometry=new T.CylinderGeometry(.027,.027,.026,8);
  function bolt(parent,pos,mat=nickel){const b=mesh(screwGeometry,mat,parent,pos);b.rotation.x=Math.PI/2;return b;}
  function frame(parent,pos,w,height,mat=brass){const g=new T.Group();g.position.set(...pos);parent.add(g);for(const side of [-1,1]){bevel(g,mat,[side*w/2,0,0],[.07,height,.08],.012);bevel(g,mat,[0,side*height/2,0],[w,.07,.08],.012);}return g;}
  function arch(parent,x,y,z,r,mat=wood,thickness=.18){return mesh(new T.TorusGeometry(r,thickness,8,48,Math.PI),mat,parent,[x,y,z]);}
  function medallion(parent,pos,r=.35){ring(parent,brass,pos,r,.023);for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(parent,brass,[pos[0]+Math.cos(a)*r*.36,pos[1]+Math.sin(a)*r*.36,pos[2]],[pos[0]+Math.cos(a)*r*.86,pos[1]+Math.sin(a)*r*.86,pos[2]],.012);}}

  const starMap=new T.MeshStandardMaterial({map:astralTexture(),metalness:.3,roughness:.55,emissive:0x35515a,emissiveIntensity:.25});
  if(!h.skipLibrary){
  // Layered cornices and real supports make the archive more than a set of shelves.
  for(const side of [-1,1]) {
    bevel(library,ebony,[side*15.3,6,-2],[.65,27,39],.08);
    for(const y of [-2.8,5,13]){
      for(const [dy,width] of [[-.35,.35],[-.18,.2],[.02,.08]])bevel(library,wood,[side*11,y+dy,-2],[6.3,width,38.4],.025);
      for(let z=16;z>=-20;z-=1.2){bevel(library,brass,[side*7.93,y-.22,z],[.08,.27,.24],.02);}
    }
    for(let z=16;z>=-20;z-=6){
      bevel(library,wood,[side*14.9,7,z],[.58,22,.88],.08);
      for(const y of [-3,5,13]){for(let j=0;j<3;j++)bevel(library,wood,[side*14.75,y+.25+j*.15,z],[.9-j*.13,.14,1.25-j*.16],.025);}
      for(const dz of [-.28,.28])bevel(library,brass,[side*14.55,7,z+dz],[.035,22,.035],.01);
    }
  }
  bevel(library,ebony,[0,8,-22],[32,26,.6],.08);
  for(const x of [-11,-5.5,5.5,11]){
    bevel(library,wood,[x,12,-21.5],[.34,12,.55],.035);
    arch(library,x,14,-21.3,2.55,wood,.22);arch(library,x,14,-21.05,2.32,brass,.035);
  }

  mesh(new T.CircleGeometry(3.6,64),starMap,library,[0,13,-21.35]);
  for(const r of [3.65,3.8,4.02])ring(library,brass,[0,13,-21.2],r,r===3.8?.09:.025);
  for(let i=0;i<24;i++){const a=i*Math.PI/12;bevel(library,brass,[Math.cos(a)*3.9,13+Math.sin(a)*3.9,-21.15],[.08,.18,.09],.01).rotation.z=a;}
  // Curved bridge soffits and axle details follow each scroll-driven staircase.
  stairs.forEach((st,i)=>{
    const length=i?Math.sqrt(80):Math.sqrt(52);
    for(const side of [-1,1]){
      rod(st.group,ebony,[side*1.51,-.28,0],[side*1.51,1.72,-length],.13);
      rod(st.group,brass,[side*1.52,-.37,0],[side*1.52,1.63,-length],.032);
      const disk=cyl(st.group,enamel,[side*1.67,-.24,0],.55,.18);disk.rotation.z=Math.PI/2;
      const band=ring(st.group,brass,[side*1.78,-.24,0],.45,.025);band.rotation.y=Math.PI/2;
      for(let k=0;k<12;k++){const a=k*Math.PI/6;ball(st.group,brass,[side*1.79,-.24+Math.cos(a)*.4,Math.sin(a)*.4],[.035,.035,.035]);}
      for(const z of [0,-length]){bevel(st.group,wood,[side*1.5,z===0?.7:2.5,z],[.19,1.45,.19],.028);ball(st.group,brass,[side*1.5,z===0?1.48:3.28,z],[.115,.14,.115]);}
    }
    batch(st.group);
  });
  // Coherent cold skylight with warm shelves, subtle shafts, and deep lower galleries.
  for(let z=13;z>=-17;z-=10){
    arch(library,0,12,z,15,wood,.22);arch(library,0,12,z-.06,14.65,brass,.04);
    for(const side of [-1,1]){
      bevel(library,wood,[side*7.6,8.7,z],[.16,.18,4],.025);
      const fill=new T.PointLight(0xffb779,55,23,2);fill.position.set(side*9,7,-28+z);scenes[1].add(fill);
    }
  }
  const mistMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{colour:{value:new T.Color(0x7e9bcb)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform vec3 colour;void main(){float a=pow(sin(vUv.x*3.14159),3.)*pow(1.-vUv.y,1.5)*.028;gl_FragColor=vec4(colour,a);}'});
  for(const x of [-6,5]){const shaft=mesh(new T.PlaneGeometry(2.1,19),mistMaterial,library,[x,8,-9]);shaft.rotation.z=-.45;shaft.castShadow=false;}
  for(let z=8;z>=-18;z-=8){ring(library,brass,[0,-5,z],3.8,.045).rotation.x=Math.PI/2;}
  // Close ornaments retain their own thickness and attachment points when the camera passes.
  for(const {g} of floats.filter(o=>o.g.isGroup&&o.g.parent===library)){
    const diffuser=new T.MeshPhysicalMaterial({color:0xffdb9b,roughness:.28,metalness:.15,transparent:true,opacity:.28,depthWrite:false});
    ball(g,diffuser,[0,0,0],[.37,.37,.37]);
    for(const y of [-.43,.43]){const hoop=ring(g,brass,[0,y,0],.36,.018);hoop.rotation.x=Math.PI/2;}
    for(const side of [-1,1]){
      rod(g,brass,[side*.14,-.65,0],[side*.25,-.44,0],.016);
      rod(g,brass,[side*.14,.65,0],[side*.25,.44,0],.016);
    }
    for(let k=0;k<8;k++){const a=k*Math.PI/4;const tick=bevel(g,brass,[Math.cos(a)*1.1,Math.sin(a)*1.1,.06],[.035,.12,.04],.006);tick.rotation.z=a;}
    batch(g);
  }
  const study=new T.Group();study.position.set(-5,1.6,1);library.add(study);
  bevel(study,wood,[0,0,0],[3.9,.24,2.5],.06);frame(study,[0,.13,0],3.75,2.35).rotation.x=-Math.PI/2;
  const chart=mesh(new T.PlaneGeometry(1.85,1.3),starMap,study,[.65,.145,0]);chart.rotation.x=-Math.PI/2;
  for(let k=0;k<3;k++){bevel(study,bookMats[k],[-1,.25+k*.17,.2],[.7,.15,1.1],.025);bevel(study,ivory,[-1,.25+k*.17,.74],[.64,.11,.028],.006);}
  for(const side of [-1,1])rod(study,brass,[side*1.7,-.12,-.8],[side*1.35,-1.4,-.6],.04);
  cyl(study,enamel,[-.95,.67,-.65],.33,.9);cyl(study,brass,[-.95,1.17,-.65],.38,.12);
  for(let j=0;j<4;j++){const a=j*Math.PI/2;rod(study,brass,[-.95+Math.cos(a)*.3,.25,-.65+Math.sin(a)*.3],[-.95+Math.cos(a)*.3,1.14,-.65+Math.sin(a)*.3],.021);}
  ball(study,pearl,[-.95,1.28,-.65],[.13,.13,.13]);
  scenes[1].environmentIntensity=.28;

  }
  // Institute backdrop: fluted enamel bays, illuminated instruments, and an optical ring.
  bevel(lab,recess,[0,6,-16],[31,17,.55],.1);
  for(const side of [-1,1])for(let j=0;j<5;j++){
    const x=side*(4.2+j*2.1);
    bevel(lab,enamel,[x,5.5,-15.5],[1.7,13,.22],.07);
    for(const dx of [-.76,.76])bevel(lab,brass,[x+dx,5.5,-15.3],[.055,12.7,.08],.012);
    for(let k=0;k<6;k++)bevel(lab,nickel,[x,1.2+k*.24,-15.22],[1.25,.045,.08],.008);
    bevel(lab,warm,[x,10.8,-15.28],[.05,1.3,.07],.008);
    medallion(lab,[x,8.8,-15.18],.29);
  }
  const rearDisc=mesh(new T.CircleGeometry(5.75,96),starMap,lab,[0,5,-15.1]);
  for(const r of [5.78,6.04,6.3])ring(lab,r===6.04?nickel:brass,[0,5,-14.98],r,r===6.04?.14:.04);
  for(let k=0;k<48;k++){const a=k*Math.PI/24;const mark=bevel(lab,brass,[Math.cos(a)*6.15,5+Math.sin(a)*6.15,-14.76],[.07,k%4?.16:.35,.08],.01);mark.rotation.z=a;}
  for(const side of [-1,1]){
    for(const z of [8,0,-8]){
      bevel(lab,enamel,[side*10,2.2,z],[2.7,4.4,1.6],.12);
      frame(lab,[side*10,2.3,z+.83],2.45,3.8,nickel);
      for(const dx of [-1.08,1.08])for(const y of [.6,4])bolt(lab,[side*10+dx,y,z+.89]);
      for(let k=0;k<7;k++)bevel(lab,recess,[side*10,.75+k*.13,z+.85],[1.8,.06,.05],.01);
      for(let k=0;k<3;k++)cyl(lab,nickel,[side*10+(k-1)*.45,.2,z+1.12],.08,.15).rotation.x=Math.PI/2;
      rod(lab,nickel,[side*11.3,4,z],[side*11.3,8.2,z],.12);
      for(const y of [4.5,6.5,8])cyl(lab,brass,[side*11.3,y,z],.18,.12);
      rod(lab,nickel,[side*11.3,8.2,z],[side*11.3,8.2,z-8],.12);
    }
  }
  const dialMat=new T.MeshStandardMaterial({map:dialTexture(),roughness:.75});
  function gauge(parent,x,y,z,r=.4){
    ring(parent,brass,[x,y,z],r,.05);mesh(new T.CircleGeometry(r*.92,48),dialMat,parent,[x,y,z+.015]);
    const pivot=new T.Group();pivot.userData.dynamic=true;pivot.position.set(x,y,z+.05);parent.add(pivot);
    rod(pivot,red,[0,-r*.15,0],[0,r*.68,0],.016);ball(pivot,nickel,[0,0,.01],[.05,.05,.025]);needles.push(pivot);
  }
  for(const side of [-1,1])for(const z of [8,0,-8]){gauge(lab,side*10-.6,3.4,z+.9,.42);gauge(lab,side*10+.55,3.4,z+.9,.34);}
  const signalMat=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float time;void main(){vec2 p=vUv;float wave=.5+.14*sin(p.x*26.-time*1.2)+.04*sin(p.x*80.+time);float line=exp(-abs(p.y-wave)*190.);float grid=step(.96,fract(p.x*12.))*.025+step(.96,fract(p.y*8.))*.025;float edge=pow(max(0.,sin(p.x*3.14159)*sin(p.y*3.14159)),.3);gl_FragColor=vec4((vec3(.013,.042,.036)+vec3(.14,.48,.33)*(line+grid))*edge,1.);}'});
  for(const side of [-1,1])for(const z of [8,0,-8]){bevel(lab,recess,[side*10,2.05,z+.9],[1.95,.95,.18],.06);mesh(new T.PlaneGeometry(1.75,.72),signalMat,lab,[side*10,2.07,z+1]);}
  // Eight specimen pods: collars, locking bolts, vertical braces and a readable inner lens.
  for(const side of [-1,1])for(let j=0;j<4;j++){
    const x=side*6,z=6-j*4;
    for(const y of [.85,1.2,5.18,5.52]){cyl(lab,enamel,[x,y,z],.91,.15);ring(lab,brass,[x,y+.085,z],.88,.023).rotation.x=Math.PI/2;}
    for(let k=0;k<8;k++){const a=k*Math.PI/4;const dx=Math.cos(a)*.85,dz=Math.sin(a)*.85;rod(lab,nickel,[x+dx,1.18,z+dz],[x+dx,5.15,z+dz],k%2?.028:.055);cyl(lab,brass,[x+dx,5.65,z+dz],.055,.12);}
    for(const y of [1.1,5.1]){cyl(lab,cold,[x,y,z],.78,.025);}
  }
  // Layered feet and capitals soften the old one-piece laboratory columns.
  for(let i=0;i<9;i++)if(i!==4){const a=i*Math.PI/8,x=10*Math.cos(a),z=-10*Math.sin(a);
    for(const [radius,y,height] of [[.72,.13,.18],[.62,.33,.12],[.48,.49,.1],[.5,8.56,.11],[.61,8.73,.15],[.75,8.91,.1]])cyl(lab,y>8?nickel:enamel,[x,y,z],radius,height);
    for(let j=0;j<12;j++){const b=j*Math.PI/6;rod(lab,brass,[x+Math.cos(b)*.41,.65,z+Math.sin(b)*.41],[x+Math.cos(b)*.41,1.5,z+Math.sin(b)*.41],.012);}
  }
  const contactMap=canvasTexture((c,n)=>{const g=c.createRadialGradient(n/2,n/2,n*.06,n/2,n/2,n*.48);g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(.45,'rgba(0,0,0,.28)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,n,n);},256);
  const contactMat=new T.MeshBasicMaterial({map:contactMap,transparent:true,depthWrite:false,opacity:.6});
  for(const side of [-1,1])for(let j=0;j<4;j++){const shadow=mesh(new T.PlaneGeometry(2.8,2.8),contactMat,lab,[side*6,.145,6-j*4]);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;}
  // Replace the featureless sphere and thin torus hoops with segmented optical machinery.
  nucleus.visible=false;coreRings.forEach(r=>r.visible=false);
  const heart=new T.Group();heart.userData.dynamic=true;core.add(heart);
  ball(heart,cold,[0,0,0],[.95,.95,.95]);
  for(let j=0;j<12;j++){
    const a=j*Math.PI/6;
    mesh(new T.SphereGeometry(1.28,12,20,a+.045,Math.PI/6-.09,.14,Math.PI-.28),enamel,heart);
    const points=[];for(let k=0;k<=16;k++){const theta=.14+k/16*(Math.PI-.28);points.push(new T.Vector3(Math.sin(theta)*Math.cos(a)*1.29,Math.cos(theta)*1.29,-Math.sin(theta)*Math.sin(a)*1.29));}
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.014,5,false),brass,heart);
  }
  for(const y of [-.78,0,.78]){const band=ring(heart,nickel,[0,y,0],Math.sqrt(1.31**2-y*y),.032);band.rotation.x=Math.PI/2;}
  for(let j=0;j<3;j++){
    const pivot=new T.Group();pivot.userData.dynamic=true;pivot.rotation.set(j*.65,.35+j*.8,0);core.add(pivot);
    const g=new T.Group();pivot.add(g);const radius=2.15+j*.5;
    ring(g,j===1?enamel:nickel,[0,0,0],radius,.105);ring(g,brass,[0,0,.1],radius-.13,.018);ring(g,brass,[0,0,-.1],radius+.13,.018);
    for(let k=0;k<48;k++){
      const a=k*Math.PI/24,part=bevel(g,k%4===0?brass:nickel,[Math.cos(a)*radius,Math.sin(a)*radius,0],[.15,k%4===0?.33:.18,.22],.025);part.rotation.z=a;
      if(k%6===0){ball(g,brass,[Math.cos(a)*radius,Math.sin(a)*radius,.15],[.05,.05,.035]);}
    }
    for(const side of [-1,1]){bevel(g,enamel,[side*radius,0,0],[.38,.7,.42],.07);gauge(g,side*radius,0,.24,.18);}
    batch(g);rotors.push({g,speed:.045+j*.018});
  }
  for(const side of [-1,1]){
    rod(lab,enamel,[side*3.6,.8,-3],[side*3.6,3.9,-3],.16);
    rod(lab,nickel,[side*3.6,3.9,-3],[side*3.1,4,-3],.12);
    cyl(lab,brass,[side*3.6,.55,-3],.38,.55);
    const axle=cyl(lab,brass,[side*3.35,4,-3],.35,.26);axle.rotation.z=Math.PI/2;
  }
  // Concentric pedestal housings, inset service panels, engraved access deck.
  for(const [r,y] of [[2.9,.3],[2.75,.55],[2.6,.8]])cyl(lab,enamel,[0,y,-3],r,.16);
  for(let i=0;i<32;i++){const a=i*Math.PI/16;const b=bevel(lab,nickel,[Math.cos(a)*2.87,.41,-3+Math.sin(a)*2.87],[.07,.18,.28],.012);b.rotation.y=-a;}
  ring(lab,cold,[0,.87,-3],2.36,.028).rotation.x=Math.PI/2;
  for(const side of [-1,1]){bevel(lab,enamel,[side*3.8,.1,4],[.4,.2,13],.04);for(let z=9;z>=-2;z-=1)bevel(lab,warm,[side*3.8,.22,z],[.08,.015,.32],.007);}
  scenes[2].children.filter(o=>o.isHemisphereLight).forEach(o=>o.intensity=.32);
  scenes[2].environmentIntensity=.38;
  const labKey=new T.SpotLight(0xc7e5ec,220,55,.6,.75,1.4);labKey.position.set(-8,15,-48);labKey.target.position.set(0,8,-59);scenes[2].add(labKey,labKey.target);
  const labRim=new T.PointLight(0xffbb70,120,30,2);labRim.position.set(4,10,-68);scenes[2].add(labRim);
  const backGlow=new T.PointLight(0x58a5ad,100,20,2);backGlow.position.set(-4,8,-70);scenes[2].add(backGlow);
  // Tiny motes are spatial points; no full-screen fog or glare.
  const dustGeometry=new T.BufferGeometry(),points=[];
  for(let i=0;i<200;i++)points.push(Math.sin(i*17.17)*11,2+(i%30)*.43,16-(i*7.13%37));
  dustGeometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
  const dust=new T.Points(dustGeometry,new T.PointsMaterial({color:0xd6b583,size:.024,transparent:true,opacity:.55,depthWrite:false}));dust.userData.dynamic=true;if(!h.skipLibrary)library.add(dust);
  function update(t,s,reduced){rotors.forEach(({g,speed})=>g.rotation.z=reduced?0:t*speed);needles.forEach((g,i)=>g.rotation.z=-.5+(reduced?0:Math.sin(t*.35+i)*.17));heart.rotation.y=reduced?0:t*.05;dust.rotation.y=reduced?0:Math.sin(t*.06)*.018;signalMat.uniforms.time.value=reduced?0:t;}
  return {update};
}
