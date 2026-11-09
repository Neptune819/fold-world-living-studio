import * as T from './vendor/three.module.js';
import {Water} from './vendor/objects/Water.js';

// A real planar reflection of the current scene, with broad ripples and a quiet
// Fresnel edge. The normal tile is a periodic wave field, generated locally.
export function createLunarWater(root,scene) {
  const n=256,canvas=document.createElement('canvas');canvas.width=canvas.height=n;
  const context=canvas.getContext('2d'),data=context.createImageData(n,n);
  const waves=[[3,1,.045,.3],[1,5,.022,1.2],[7,-2,.013,2.4],[12,6,.005,.6],[19,-9,.003,1.8]];
  for(let i=0;i<18;i++)waves.push([(i*7%21)-10,(i*11%19)-9,.006/(1+i*.15),(i*2.4)%(Math.PI*2)]);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    let dx=0,dy=0;for(const [a,b,h,phase] of waves){const c=Math.cos((a*x+b*y)*Math.PI*2/n+phase);dx+=a*h*c;dy+=b*h*c;}
    const length=Math.hypot(dx,dy,1),i=(y*n+x)*4;
    data.data.set([128-dx/length*127,128-dy/length*127,128+1/length*127,255],i);
  }
  context.putImageData(data,0,0);const normals=new T.CanvasTexture(canvas);normals.wrapS=normals.wrapT=T.RepeatWrapping;
  const water=new Water(new T.PlaneGeometry(280,280,80,80),{textureWidth:1024,textureHeight:512,waterNormals:normals,sunDirection:new T.Vector3(-.42,.78,-.46).normalize(),sunColor:0x93b6d5,waterColor:0x071d2b,distortionScale:.32,fog:true});
  water.rotation.x=-Math.PI/2;water.position.set(0,-.18,-24);water.name='lunar-reflective-water';water.castShadow=false;water.receiveShadow=false;root.add(water);
  scene.background=new T.Color(0x070f1c);
  const material=water.material;
  Object.assign(material.uniforms,{resonance:{value:0},resonanceTime:{value:0},waterTime:{value:0}});
  material.vertexShader=material.vertexShader.replace('mirrorCoord = modelMatrix * vec4( position, 1.0 );',`vec3 wavePosition=position;wavePosition.z+=sin(position.x*.42+position.y*.23+time*.19)*.018+sin(position.y*.67-position.x*.18-time*.13)*.011;
    mirrorCoord = modelMatrix * vec4( wavePosition, 1.0 );`).replace('modelViewMatrix * vec4( position, 1.0 )','modelViewMatrix * vec4( wavePosition, 1.0 )');
  material.fragmentShader=material.fragmentShader.replace('uniform float alpha;','uniform float alpha;uniform float resonance;uniform float resonanceTime;uniform vec3 boatPosition;uniform vec2 boatDirection;uniform float boatWake;uniform float boatPresence;uniform mat4 boatWorldToLocal;uniform vec4 boatHullProfiles[8];uniform vec4 paddleContacts[2];')
    .replace('void main() {',`void main() {
      // Displace water only inside the real hull at this fragment's height.
      // Presence is independent of speed: a stationary boat still excludes water.
      if(boatPresence>.5){
        vec3 hullPoint=(boatWorldToLocal*worldPosition).xyz;
        for(int section=0;section<7;section++){
          vec4 a=boatHullProfiles[section],b=boatHullProfiles[section+1];
          if(hullPoint.z>=a.x&&hullPoint.z<=b.x){
            vec4 profile=mix(a,b,(hullPoint.z-a.x)/(b.x-a.x));
            float innerBottom=profile.w+.055;
            if(hullPoint.y>=innerBottom-.012&&hullPoint.y<profile.z+.07){
              float rise=clamp((hullPoint.y-innerBottom)/(profile.z-profile.w),0.,1.);
              float crossCurve=pow(rise,1./.79);
              float innerWidth=profile.y*.94*sqrt(max(0.,1.-pow(1.-crossCurve,2.)));
              // The seam allowance lies within the wooden wall, never outside it.
              if(abs(hullPoint.x)<innerWidth+.019)discard;
            }
          }
        }
      }`)
    .replace('vec3( 1.5, 1.0, 1.5 )','vec3( .47, 1.0, .47 )').replace('100.0, 2.0, 0.5','180.0, .38, .15')
    .replace('uv / 103.0','uv / 17.0').replace('uv / 107.0','uv / 23.0').replace('8907.0, 9803.0','44.0, 53.0').replace('1091.0, 1027.0','9.0, 12.0')
    .replace('float rf0 = 0.3;','float rf0 = 0.06;')
    .replace('( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight )','( reflectionSample * .82 + specularLight * .25 )')
    .replace('vec3 diffuseLight = vec3(0.0);',`vec2 boatRelative=worldPosition.xz-boatPosition.xz;
      vec2 travelDirection=boatDirection*(boatWake<0.?-1.:1.);
      float aft=-dot(boatRelative,travelDirection),across=dot(boatRelative,vec2(-travelDirection.y,travelDirection.x));
      float wakeEdge=abs(across)-.72-aft*.27;
      float wakeEnvelope=exp(-max(0.,aft)*.24)*smoothstep(.1,1.1,aft)*(1.-smoothstep(10.,14.,aft))*abs(boatWake);
      float wakeRidge=sin(wakeEdge*21.-time*1.7)*exp(-wakeEdge*wakeEdge/.09)*wakeEnvelope;
      surfaceNormal.xz+=normalize(boatRelative+vec2(.001))*wakeRidge*.095;
      float paddleFoam=0.;
      for(int i=0;i<2;i++){
        vec2 delta=worldPosition.xz-paddleContacts[i].xy;float radius=length(delta);
        float wave=sin(radius*19.-time*3.)*exp(-radius*3.3)*paddleContacts[i].w;
        surfaceNormal.xz+=delta/max(radius,.03)*wave*.11;
        paddleFoam+=pow(max(0.,wave),4.)*.28;
      }
      surfaceNormal.xz+=vec2(sin(worldPosition.x*4.8+worldPosition.z*3.1-time*.9),sin(worldPosition.z*5.9-worldPosition.x*2.4+time*.6))*.013;
      surfaceNormal=normalize(surfaceNormal);
      vec3 diffuseLight = vec3(0.0);`)
    .replace('vec3 outgoingLight = albedo;',`float distanceToLamp=length(worldPosition.xz-vec2(6.,-47.));
      float ring=pow(max(0.,sin(distanceToLamp*1.05-resonanceTime*.92)),12.)*exp(-distanceToLamp*.11)*smoothstep(2.,4.,distanceToLamp);
      vec3 outgoingLight=albedo+vec3(.03,.11,.15)*ring*resonance+vec3(.16,.23,.28)*(pow(max(0.,wakeRidge),6.)*.30+paddleFoam);`);
  // Mirror updates follow camera movement, otherwise refresh at 15 Hz. This
  // bounds the extra scene pass while surface normals continue every frame.
  const reflect=water.onBeforeRender;let last=-Infinity;const p=new T.Vector3(),q=new T.Quaternion();
  water.onBeforeRender=function(renderer,s,camera,...rest){
    const now=performance.now(),moved=p.distanceToSquared(camera.position)>.003||1-Math.abs(q.dot(camera.quaternion))>.00002;
    if(moved||now-last>66){reflect.call(this,renderer,s,camera,...rest);last=now;p.copy(camera.position);q.copy(camera.quaternion);}
  };
  return {water,material};
}
