import * as T from './vendor/three.module.js';

const clamp=x=>T.MathUtils.clamp(x,0,1),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export const LAKE_LEVEL=-.18;
export function sampleLakeVoyage(s,position,look){
  const u=clamp((s-11)/3),z=-21-u*44;
  const x=Math.sin(u*Math.PI)*Math.sin(u*Math.PI*1.65)*.62;
  const ahead=Math.min(1,u+.06),nextX=Math.sin(ahead*Math.PI)*Math.sin(ahead*Math.PI*1.65)*.62;
  position.set(x,1.15,z);look.set(x+(nextX-x)*2.5,1.29,z-12);
}

// The cockpit is real geometry in the lake world. It stays on the water when
// the view-height control is raised; it is never pasted onto the camera.
export function buildLakeVoyage(root,waterMaterial){
  const boat=new T.Group();boat.name='lake-rowboat';boat.userData.dynamic=true;root.add(boat);
  let seed=71;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d');
  for(let j=0;j<8;j++){
    const shade=37+Math.floor(random()*17);ctx.fillStyle=`rgb(${shade+44},${shade+12},${shade-7})`;ctx.fillRect(0,j*64,1024,64);
    for(let k=0;k<58;k++){
      const y=j*64+random()*64;ctx.strokeStyle=k%3?'rgba(20,9,3,.20)':'rgba(225,158,77,.15)';ctx.lineWidth=.4+random()*1.3;
      ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=1024;x+=16)ctx.lineTo(x,y+Math.sin(x*.009+j*2+k)*2.2+Math.sin(x*.031+k)*.45);ctx.stroke();
    }
    ctx.fillStyle='rgba(13,8,4,.7)';ctx.fillRect(0,j*64,1024,2);ctx.fillStyle='rgba(222,160,82,.19)';ctx.fillRect(0,j*64+2,1024,1);
    for(let k=0;k<2;k++){const x=random()*1024,y=j*64+15+random()*30;ctx.strokeStyle='rgba(19,9,4,.24)';for(let r=0;r<4;r++){ctx.beginPath();ctx.ellipse(x,y,7+r*7,1+r*1.1,0,0,Math.PI*2);ctx.stroke();}}
  }
  const woodMap=new T.CanvasTexture(canvas);woodMap.colorSpace=T.SRGBColorSpace;woodMap.anisotropy=8;woodMap.wrapS=woodMap.wrapT=T.RepeatWrapping;
  const wood=new T.MeshPhysicalMaterial({map:woodMap,color:0xd9b590,roughness:.43,metalness:.02,clearcoat:.28,clearcoatRoughness:.48,side:T.DoubleSide});
  const outer=wood.clone();outer.color.set(0x74503b);outer.roughness=.56;
  const dark=new T.MeshStandardMaterial({color:0x142a31,roughness:.36,metalness:.3});
  const brass=new T.MeshStandardMaterial({color:0xb99758,roughness:.31,metalness:.77});
  const materials=[wood,outer,dark,brass];
  const add=(geometry,material,parent=boat)=>{const m=new T.Mesh(geometry,material);m.castShadow=false;m.receiveShadow=true;parent.add(m);return m;};
  const profiles=[[-3.45,.035,.67,.30],[-3.06,.37,.60,-.02],[-2.50,.64,.51,-.23],[-1.70,.82,.46,-.34],[-.60,.91,.46,-.38],[.55,.80,.47,-.27],[1.22,.48,.53,-.02],[1.42,.025,.59,.22]];
  function section(u){
    const f=u*(profiles.length-1),i=Math.min(profiles.length-2,Math.floor(f)),v=f-i,a=profiles[i],b=profiles[i+1];
    return {z:T.MathUtils.lerp(a[0],b[0],v),width:T.MathUtils.lerp(a[1],b[1],v),rim:T.MathUtils.lerp(a[2],b[2],v),bottom:T.MathUtils.lerp(a[3],b[3],v)};
  }
  function hull(inner=false){
    const vertices=[],uv=[],indices=[],N=64,M=24;
    for(let i=0;i<=N;i++){
      const u=i/N,p=section(u);
      for(let j=0;j<=M;j++){
        const a=(j/M-.5)*Math.PI,w=p.width*(inner?.94:1),y=p.bottom+(p.rim-p.bottom)*Math.pow(1-Math.cos(a),.79)+(inner?.055:0);
        vertices.push(w*Math.sin(a),y,p.z);uv.push(u*2,j/M);
        if(i<N&&j<M){const n=i*(M+1)+j;indices.push(n,n+1,n+M+1,n+1,n+M+2,n+M+1);}
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  add(hull(),outer);add(hull(true),wood);
  for(const side of [-1,1]){
    const points=Array.from({length:65},(_,i)=>{const p=section(i/64);return new T.Vector3(side*p.width,p.rim+.025,p.z);});
    add(new T.TubeGeometry(new T.CatmullRomCurve3(points),80,.043,8,false),wood);
    add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>p.clone().add(new T.Vector3(side*.015,.033,0)))),80,.011,5,false),brass);
  }
  for(const u of [.19,.35,.52,.70,.85]){
    const p=section(u),points=[];for(let i=0;i<=24;i++){const a=(i/24-.5)*Math.PI;points.push(new T.Vector3(p.width*.92*Math.sin(a),p.bottom+(p.rim-p.bottom)*Math.pow(1-Math.cos(a),.79)+.075,p.z));}
    add(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.032,6,false),dark);
  }
  for(const z of [-1.75,.65]){const seat=add(new T.BoxGeometry(z<0?1.32:1.20,.065,.27),wood);seat.position.set(0,.24,z);for(const side of [-1,1]){const cap=add(new T.BoxGeometry(.075,.075,.29),brass);cap.position.set(side*(z<0?.58:.52),.25,z);}}
  const deckShape=new T.Shape();deckShape.moveTo(-.45,-.20);deckShape.lineTo(.45,-.20);deckShape.quadraticCurveTo(.27,.45,0,.92);deckShape.quadraticCurveTo(-.27,.45,-.45,-.20);
  const bowDeck=add(new T.ExtrudeGeometry(deckShape,{depth:.045,bevelEnabled:true,bevelSize:.018,bevelThickness:.015,bevelSegments:2,steps:1}),wood);bowDeck.rotation.x=-Math.PI/2;bowDeck.position.set(0,.51,-2.5);
  const cleat=add(new T.TorusGeometry(.115,.017,6,24),brass);cleat.rotation.x=Math.PI/2;cleat.position.set(0,.57,-2.9);
  const lantern=new T.Group();lantern.position.set(0,.60,-2.43);boat.add(lantern);
  const lampMaterial=new T.MeshStandardMaterial({color:0xffd697,emissive:0xffb75c,emissiveIntensity:1.2,roughness:.25});materials.push(lampMaterial);
  const lamp=add(new T.SphereGeometry(.065,12,8),lampMaterial,lantern);lamp.scale.y=1.5;lamp.position.y=.12;
  for(const y of [0,.25]){const cap=add(new T.CylinderGeometry(.12,.12,.035,20),brass,lantern);cap.position.y=y;}
  for(let i=0;i<6;i++){const a=i*Math.PI/3,r=add(new T.CylinderGeometry(.009,.009,.24,6),brass,lantern);r.position.set(Math.cos(a)*.10,.12,Math.sin(a)*.10);}

  const oars=[];
  for(const side of [-1,1]){
    const joint=new T.Group();joint.position.set(side*.72,.44,-2.16);boat.add(joint);
    const lock=add(new T.TorusGeometry(.075,.017,6,20),brass);lock.rotation.y=Math.PI/2;lock.position.copy(joint.position);
    const row=new T.Group();joint.add(row);
    const shaft=add(new T.CylinderGeometry(.023,.033,2.77,12),wood,row);shaft.rotation.z=Math.PI/2;shaft.position.x=side*.80;
    const grip=add(new T.CylinderGeometry(.036,.036,.33,12),dark,row);grip.rotation.z=Math.PI/2;grip.position.x=-side*.48;
    const bladeShape=new T.Shape();bladeShape.moveTo(0,-.045);bladeShape.bezierCurveTo(.20,-.17,.69,-.17,.78,-.065);bladeShape.quadraticCurveTo(.85,0,.78,.065);bladeShape.bezierCurveTo(.69,.17,.20,.17,0,.045);bladeShape.closePath();
    const blade=add(new T.ExtrudeGeometry(bladeShape,{depth:.026,bevelEnabled:true,bevelSegments:2,bevelSize:.018,bevelThickness:.012,steps:1}),wood,row);
    blade.position.set(side*2.18,0,-.013);blade.scale.x=side;
    const tip=new T.Object3D();tip.position.set(side*2.55,0,0);row.add(tip);
    oars.push({side,joint,row,blade,tip});
  }

  const wakes=new T.Group();wakes.name='rowing-water-effects';wakes.userData.dynamic=true;root.add(wakes);
  const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  const ripples=oars.map(()=>{
    const material=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform float phase;uniform float strength;void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float ring=exp(-pow((r-(.16+phase*.65))/.045,2.));float second=exp(-pow((r-(.06+phase*.42))/.028,2.))*.35;float broken=.63+.37*sin(atan(p.y,p.x)*9.+r*31.);gl_FragColor=vec4(.57,.73,.83,(ring+second)*broken*(1.-phase)*strength);}`,uniforms:{phase:{value:0},strength:{value:0}},transparent:true,depthWrite:false,side:T.DoubleSide});
    const mesh=add(new T.PlaneGeometry(1.7,1.7),material,wakes);mesh.rotation.x=-Math.PI/2;mesh.position.y=LAKE_LEVEL+.021;return mesh;
  });
  const boatUniforms={boatPosition:{value:new T.Vector3()},boatDirection:{value:new T.Vector2(0,-1)},boatWake:{value:0},boatPresence:{value:0},boatWorldToLocal:{value:new T.Matrix4()},boatHullProfiles:{value:profiles.map(p=>new T.Vector4(...p))},paddleContacts:{value:[new T.Vector4(0,0,0,0),new T.Vector4(0,0,0,0)]}};
  Object.assign(waterMaterial.uniforms,boatUniforms);
  const localCamera=new T.Vector3(),forward=new T.Vector3(),worldBoat=new T.Vector3(),tip=new T.Vector3();
  let motion=0,previousTime=null,currentPhase=0,currentDistance=0,visible=false;
  function update(t,reduced,camera,s,speed){
    const dt=previousTime===null?0:T.MathUtils.clamp(t-previousTime,0,.1);previousTime=t;
    visible=s>10.14&&s<15.6;boat.visible=visible;wakes.visible=visible;boatUniforms.boatPresence.value=visible?1:0;
    const travel=s>=10.3&&s<=14.05?Math.min(1,Math.abs(speed)*.95):0;
    motion=reduced?0:T.MathUtils.damp(motion,travel,7,dt);
    if(!visible){boatUniforms.boatWake.value=0;boatUniforms.paddleContacts.value.forEach(v=>{v.w=0;});return;}
    root.updateWorldMatrix(true,false);localCamera.copy(camera.position);root.worldToLocal(localCamera);
    camera.getWorldDirection(forward);forward.y=0;forward.normalize();
    boat.position.set(localCamera.x,LAKE_LEVEL+(reduced?0:Math.sin(t*.92)*.012),localCamera.z);
    boat.rotation.set(reduced?0:Math.sin(t*.81)*.003,Math.atan2(-forward.x,-forward.z),reduced?0:Math.sin(t*.63)*.004);
    currentDistance=T.MathUtils.clamp((s-11)*44/3,0,44);currentPhase=reduced?0:currentDistance*.82;
    const phase=((currentPhase%(Math.PI*2))+Math.PI*2)%(Math.PI*2)/(Math.PI*2),drive=phase<.57;
    const fraction=drive?ease(phase/.57):ease((phase-.57)/.43);
    oars.forEach(({side,row,blade},i)=>{
      row.rotation.y=side*(drive?T.MathUtils.lerp(.54,-.45,fraction):T.MathUtils.lerp(-.45,.54,fraction));
      row.rotation.z=side*(reduced?.035:drive?-.205+Math.sin(fraction*Math.PI)*.025:.07+Math.sin(fraction*Math.PI)*.11);
      blade.rotation.x=drive?0:Math.sin(fraction*Math.PI)*1.4;
    });
    boat.updateMatrixWorld(true);boat.getWorldPosition(worldBoat);boatUniforms.boatPosition.value.copy(worldBoat);
    // The inverse includes yaw, the tiny hull bob/roll and the world's -28 Z
    // placement. It matches the actual wooden geometry at every view height.
    boatUniforms.boatWorldToLocal.value.copy(boat.matrixWorld).invert();
    boatUniforms.boatDirection.value.set(forward.x,forward.z);boatUniforms.boatWake.value=motion*(reduced?0:1)*(speed<0?-1:1);
    oars.forEach((o,i)=>{
      o.tip.getWorldPosition(tip);boatUniforms.paddleContacts.value[i].set(tip.x,tip.z,phase,motion*(drive?1:0));
      root.worldToLocal(tip);ripples[i].position.set(tip.x,LAKE_LEVEL+.022,tip.z);ripples[i].material.uniforms.phase.value=drive?fraction:1;
      ripples[i].material.uniforms.strength.value=motion*(drive?.55:0);
    });
  }
  return {boat,update,get state(){return {mode:'rowing',visible,distance:Number(currentDistance.toFixed(3)),stroke:Number(currentPhase.toFixed(3)),motion:Number(motion.toFixed(3)),oars:oars.map(o=>[o.row.rotation.y,o.row.rotation.z]),position:boat.position.toArray()};}};
}
