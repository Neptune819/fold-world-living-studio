import * as T from './vendor/three.module.js';

export const gateVertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const noise = `float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=mat2(.8,.6,-.6,.8)*p*2.03+3.1;a*=.5;}return v;}`;
// Different flow scales form a deep throat, cloudy body and fine filaments, rather than one flat spiral.
export const gateFragment = `uniform float time;uniform float opacity;uniform float nearGate;varying vec2 vUv;${noise}
void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);float depth=-log(max(r,.035));float twist=a+depth*1.1-time*.18;
vec2 q=vec2(cos(twist),sin(twist))*r*4.;float cloud=fbm(q+vec2(time*.065,-time*.027));float fine=fbm(q*2.8+cloud*2.7-time*.09);
float wisps=pow(max(0.,1.-abs(sin(twist*3.+depth*5.+cloud*8.))),17.);float veins=pow(smoothstep(.52,.83,fine),5.);
float rim=exp(-abs(r-.96)*85.);float eye=exp(-r*r*40.);float body=smoothstep(.22,.83,cloud)*(.4+.6*r);
vec3 c=mix(vec3(.026,.036,.065),vec3(.29,.37,.44),body);c+=vec3(.61,.38,.13)*smoothstep(.44,.9,fine)*.75;
c+=vec3(1.,.74,.35)*(wisps*.38+veins*.18)*smoothstep(.1,.4,r);c+=vec3(1.,.83,.56)*(rim*2.2+eye*(.45+nearGate*.2));
float volume=0.;for(int i=0;i<5;i++){float layer=float(i);volume+=fbm(q*(1.+layer*.17)+vec2(time*.021,-time*.027)+layer*.61)*.065;}
c+=vec3(.22,.28,.32)*volume; c+=vec3(.36,.4,.47)*pow(cloud,3.)*.32;gl_FragColor=vec4(c,opacity);}`;

export function buildMagicGates(portals, scenes, h) {
  const {mesh,ring,rod}=h, gates=[];
  const hot=new T.MeshBasicMaterial({color:0xffecc0,toneMapped:false});
  const gold=new T.MeshBasicMaterial({color:0xeab46b,toneMapped:false});
  const housing=new T.MeshStandardMaterial({color:0x584a32,metalness:.75,roughness:.42});
  const glowMap=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,2,64,64,64);g.addColorStop(0,'rgba(255,245,210,1)');g.addColorStop(.18,'rgba(255,198,100,.5)');g.addColorStop(1,'rgba(255,160,50,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c);})();
  portals.forEach(({frame},index)=>{
    frame.clear();frame.userData.dynamic=true;
    const uniforms={time:{value:0},opacity:{value:1},nearGate:{value:0}};
    const mat=new T.ShaderMaterial({uniforms,vertexShader:gateVertex,fragmentShader:gateFragment,side:T.DoubleSide});
    const surfaceGeometry=new T.RingGeometry(.001,4.15,96,16),vertices=surfaceGeometry.attributes.position;
    for(let i=0;i<vertices.count;i++){const r=Math.hypot(vertices.getX(i),vertices.getY(i))/4.15;vertices.setZ(i,-1.65*Math.pow(1-r,2));}vertices.needsUpdate=true;surfaceGeometry.computeVertexNormals();
    const surface=mesh(surfaceGeometry,mat,frame,[0,0,-.045]);surface.castShadow=false;
    // Concentric rims sit at different depths and do not obstruct the opening.
    const rings=[];for(let j=0;j<4;j++){const g=new T.Group();frame.add(g);rings.push(g);ring(g,j===1?housing:j===2?gold:hot,[0,0,.08-j*.14],4.16+j*.12,j===1?.07:.017);
      for(let k=0;k<32;k++){const a=k*Math.PI/16,r=4.39+j*.035,tx=Math.cos(a),ty=Math.sin(a);if(j===2){rod(g,gold,[tx*r,ty*r,.15],[tx*(r+.17),ty*(r+.17),.15],.01);if(k%2===0){rod(g,gold,[tx*(r+.08)-ty*.05,ty*(r+.08)+tx*.05,.15],[tx*(r+.16)+ty*.05,ty*(r+.16)-tx*.05,.15],.009);}}}
    }
    const haze=mesh(new T.PlaneGeometry(11.8,11.8),new T.MeshBasicMaterial({map:glowMap,color:0xffc56e,transparent:true,opacity:.14,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}),frame,[0,0,-.09]);haze.castShadow=false;
    const count=180,geo=new T.BufferGeometry(),positions=new Float32Array(count*3),ages=new Float32Array(count);
    for(let i=0;i<count;i++)ages[i]=(i*.61803398875)%1;
    geo.setAttribute('position',new T.BufferAttribute(positions,3));
    const motes=new T.Points(geo,new T.PointsMaterial({map:glowMap,color:0xffd799,size:.13,transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));frame.add(motes);
    const spill=new T.PointLight(0xffc875,55,17,2);spill.position.set(0,0,1.2);frame.add(spill);
    gates.push({frame,mat,rings,motes,positions,ages,spill,haze,index});
  });
  return {update(t,reduced,hover,camera){for(const g of gates){const centre=g.frame.getWorldPosition(new T.Vector3()),distance=camera.position.distanceTo(centre),near=T.MathUtils.clamp((14-distance)/12,0,1),clock=reduced?0:t;
    g.mat.uniforms.time.value=clock;g.mat.uniforms.nearGate.value=near;
    g.rings.forEach((r,j)=>r.rotation.z=reduced?0:clock*[.018,-.026,.035,-.014][j]);
    g.spill.intensity=55+near*35+(hover===g.index?18:0);g.haze.material.opacity=.13+near*.045;
    for(let i=0;i<g.ages.length;i++){const age=(g.ages[i]+clock*.18)%1,a=i*2.39996+clock*.1,rad=4.17+age*age*(.14+(i%7)*.085),j=i*3;g.positions[j]=Math.cos(a)*rad;g.positions[j+1]=Math.sin(a)*rad-age*age*.17;g.positions[j+2]=.15+Math.sin(i)*age*.5;}g.motes.geometry.attributes.position.needsUpdate=true;g.motes.visible=!reduced;
  }}};
}
