import * as T from './vendor/three.module.js';
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const noise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<4;i++){n+=noise(p)*a;p=p*2.04+3.1;a*=.5;}return n;}`;
export async function buildLivingAtmospheres(moon,lab,h) {
  const {mesh,ring,rod,ball,gold,silver}=h,clouds=[],kinetics=[];
  const moonMap=await new T.TextureLoader().loadAsync('./assets/ruins-moon.png');moonMap.colorSpace=T.SRGBColorSpace;
  const moonGroup=new T.Group();moonGroup.position.set(-55,58,-150);moonGroup.userData.dynamic=true;moon.add(moonGroup);
  const haloMaterial=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:'varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;float a=exp(-r*r*4.8)*smoothstep(.38,.65,r)*.16;gl_FragColor=vec4(.49,.62,.84,a);}',transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  const halo=mesh(new T.PlaneGeometry(68,68),haloMaterial,moonGroup,[0,0,-.02]);halo.castShadow=false;
  const disk=mesh(new T.PlaneGeometry(36,36),new T.MeshBasicMaterial({map:moonMap,transparent:true,depthWrite:false,toneMapped:false,color:new T.Color(0xd5e6ff).multiplyScalar(1.75)}),moonGroup);disk.castShadow=false;
  for(const [x,y,z,w,height,density,speed] of [[-48,30,-153,100,18,.40,.026],[-51,38,-137,79,15,.48,-.039],[-58,61,-136,72,17,.46,-.033],[4,16,-92,115,18,.36,.055],[-23,2.1,-26,44,3.4,.22,-.09],[22,2.7,-48,43,4.6,.28,.074]]) {
    const material=new T.ShaderMaterial({uniforms:{time:{value:0},density:{value:density},drift:{value:speed},phase:{value:x*.1}},vertexShader:vertex,
      fragmentShader:`varying vec2 vUv;uniform float time,density,drift,phase;${noise}void main(){vec2 p=vUv*vec2(8.,3.2)+vec2(time*drift,phase);float n=fbm(p),detail=fbm(p*2.9+vec2(0.,time*.009));float mass=smoothstep(.32,.66,n+detail*.16);float edge=pow(max(0.,sin(vUv.x*3.14159)),.65)*pow(max(0.,sin(vUv.y*3.14159)),1.8);float light=clamp((fbm(p+vec2(-.3,.18))-n)*3.+.45,.0,1.);vec3 color=mix(vec3(.055,.10,.17),vec3(.43,.54,.67),light);gl_FragColor=vec4(color,mass*edge*density);}`,transparent:true,depthWrite:false,side:T.DoubleSide});
    const g=mesh(new T.PlaneGeometry(w,height),material,moon,[x,y,z]);g.castShadow=false;g.userData.dynamic=true;g.name='dynamic-cloud-layer';clouds.push({g,material,x,y,speed});
  }
  // An astronomical projection and suspended physical lenses give the hall a
  // visible, slow-running mechanism beyond the central exhibit.
  const projection=new T.Group();projection.position.set(0,13.9,-14);projection.rotation.x=-Math.PI/2;projection.userData.dynamic=true;lab.add(projection);
  const glow=new T.LineBasicMaterial({color:0x80b8bd,transparent:true,opacity:.24,depthWrite:false});
  const lines=[];for(let r of [3.2,4.8,6.1])for(let i=0;i<80;i++){let a=i*Math.PI/40,b=(i+1)*Math.PI/40;lines.push(Math.cos(a)*r,Math.sin(a)*r,0,Math.cos(b)*r,Math.sin(b)*r,0);}
  for(let i=0;i<12;i++){const a=i*Math.PI/6;lines.push(Math.cos(a)*3.2,Math.sin(a)*3.2,0,Math.cos(a)*6.1,Math.sin(a)*6.1,0);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(lines,3));projection.add(new T.LineSegments(geo,glow));
  for(const side of [-1,1]){
    const g=new T.Group();g.position.set(side*8.6,8.9,-16);g.userData.dynamic=true;lab.add(g);
    for(let i=0;i<3;i++){const hoop=ring(g,gold,[0,0,0],.8+i*.18,.021);hoop.rotation.set(i*.53,i*.39,0);}
    ball(g,silver,[0,0,0],[.17,.17,.17]);rod(lab,gold,[side*8.6,10.1,-16],[side*8.6,15.8,-16],.022);kinetics.push({g,baseY:8.9,phase:side});
  }
  const beams=[];
  for(const [x,y,z,r] of [[-8,9.5,-14,-.36],[8,10,-22,.42]]){
    const material=new T.ShaderMaterial({uniforms:{breath:{value:1}},vertexShader:vertex,fragmentShader:'varying vec2 vUv;uniform float breath;void main(){float a=pow(max(0.,sin(vUv.x*3.14159)),2.)*(1.-vUv.y)*.028*breath;gl_FragColor=vec4(.48,.69,.71,a);}',transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
    const g=mesh(new T.PlaneGeometry(2.3,13),material,lab,[x,y,z]);g.rotation.z=r;g.castShadow=false;beams.push({g,material,r});
  }
  return {update(t,reduced,camera){
    const time=reduced?0:t;moonGroup.position.y=58+(reduced?0:Math.sin(t*.037)*.65);moonGroup.quaternion.copy(camera.quaternion);disk.rotation.z=time*.0018;
    clouds.forEach(({g,material,x,y,speed},i)=>{material.uniforms.time.value=time;g.position.x=x+(reduced?0:Math.sin(t*.014+i)*5);g.position.y=y+(reduced?0:Math.sin(t*.043+i)*.22);});
    projection.rotation.z=time*.028;kinetics.forEach(({g,baseY,phase})=>{g.rotation.set(Math.sin(time*.22+phase)*.12,time*.09,Math.sin(time*.19+phase)*.14);g.position.y=baseY+(reduced?0:Math.sin(time*.32+phase)*.21);});
    beams.forEach(({g,material,r},i)=>{g.rotation.z=r+(reduced?0:Math.sin(t*.17+i)*.07);material.uniforms.breath.value=1+(reduced?0:Math.sin(t*.3+i)*.12);});
  },get state(){return {moonSeparated:true,cloudLayers:clouds.length,kineticLenses:kinetics.length,projectionAngle:projection.rotation.z,moonHeight:moonGroup.position.y,cloudPositions:clouds.map(({g})=>g.position.x)};}};
}
