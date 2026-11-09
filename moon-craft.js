import * as T from './vendor/three.module.js';

function shaftGeometry(profile=0) {
  // Chamfered octagonal stone, tapered as one structural member. The crown has
  // an oblique torn edge rather than a flat block stacked on another block.
  const outline=[[-.5,-.31],[-.31,-.5],[.31,-.5],[.5,-.31],[.5,.31],[.31,.5],[-.31,.5],[-.5,.31]];
  const levels=[0,.025,.35,.7,.975,1],positions=[],uv=[],indices=[];
  for(let j=0;j<levels.length;j++)for(let i=0;i<8;i++){
    const [x,z]=outline[i],y=levels[j],taper=1-y*.12;
    const fracture=j===levels.length-1?.02+((i+profile*3)%7)*.014:0;
    positions.push(x*taper,y-fracture,z*taper);uv.push(i/2,y*5.7);
  }
  for(let j=0;j<levels.length-1;j++)for(let i=0;i<8;i++){
    const a=j*8+i,b=j*8+(i+1)%8,d=(j+1)*8+i,e=(j+1)*8+(i+1)%8;indices.push(a,d,b,b,d,e);
  }
  for(let i=1;i<7;i++)indices.push(0,i,i+1,40,40+i+1,40+i);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export function moonArchStone(radius,width,depth=.7) {
  const shape=new T.Shape(),arc=.113;
  shape.moveTo(radius-width,0);shape.lineTo(radius+width,0);shape.absarc(0,0,radius+width,0,arc,false);
  shape.lineTo(Math.cos(arc)*(radius-width),Math.sin(arc)*(radius-width));shape.absarc(0,0,radius-width,arc,0,true);shape.closePath();
  const geometry=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,curveSegments:5,steps:1});
  geometry.translate(0,0,-depth/2);return geometry;
}

export async function createMoonCraft(root,materials) {
  const {stone,edge,wetStone,bronze,darkMetal,paleMetal}=materials;
  let ornamentMap;
  try{ornamentMap=await new T.TextureLoader().loadAsync(new URL('./assets/lunar-relief-v58.png',import.meta.url).href);}
  catch(error){throw new Error('月海石刻材质加载失败：assets/lunar-relief-v58.png',{cause:error});}
  ornamentMap.colorSpace=T.SRGBColorSpace;ornamentMap.anisotropy=8;
  const ornament=stone.clone();
  ornament.map=ornamentMap;ornament.bumpMap=ornamentMap;ornament.bumpScale=.018;ornament.color.set(0xa8b4bc);ornament.metalness=.025;ornament.roughness=.89;
  // The image supplies worn relief, while the original mineral normals and
  // roughness remain. A faint ambient lift avoids a glowing wall treatment.
  ornament.emissiveMap=ornamentMap;ornament.emissive.set(0x627987);ornament.emissiveIntensity=.025;
  const oxidized=bronze.clone();oxidized.color.set(0x67736b);oxidized.roughness=.64;
  const groups=new Map(),dummy=new T.Object3D(),unitBox=new T.BoxGeometry(1,1,1),plane=new T.PlaneGeometry(1,1);
  const shafts=Array.from({length:3},(_,i)=>shaftGeometry(i));
  const bevel=new T.CylinderGeometry(.71,.71,1,8,1);bevel.rotateY(Math.PI/8);
  const chip=new T.DodecahedronGeometry(1,0);
  function queue(geometry,material,p,s,r=[0,0,0]){
    const key=geometry.uuid+material.uuid;if(!groups.has(key))groups.set(key,{geometry,material,items:[]});groups.get(key).items.push({p,s,r});
  }
  function pillar(x,z,height,scale,detail=true,index=0) {
    // Wide foot, bevelled plinth, recessed neck, then a tapered monolith.
    queue(bevel,wetStone,[x,.02,z],[scale*1.75,.34,scale*1.75]);
    queue(bevel,stone,[x,.26,z],[scale*1.42,.19,scale*1.42]);
    queue(unitBox,edge,[x,.43,z],[scale*1.04,.14,scale*1.04]);
    queue(shafts[index%3],stone,[x,.48,z],[scale,Math.max(1,height-.65),scale]);
    const bandY=.7+Math.min(height*.16,.8);
    queue(bevel,edge,[x,bandY,z],[scale*.99,.15,scale*.99]);
    queue(bevel,oxidized,[x,bandY+.09,z],[scale*1.005,.035,scale*1.005]);
    if(detail&&height>3.2){
      // The supplied carved slab has a 1:3 image ratio. Match its physical frame
      // instead of stretching circular moon phases into tall ellipses.
      const panelWidth=Math.min(scale*.49,(height-1.8)/3,4.25/3),panelHeight=panelWidth*3,panelY=1.55+panelHeight*.5;
      for(const side of [-1,1]){
        // Ornament rests in a true dark recess with projecting stone jambs.
        // The recess belongs to its projecting stone surround. Keep the back
        // plate beyond the uncut shaft face so it cannot hide the lower mural.
        const pz=z+side*scale*.514;
        queue(unitBox,darkMetal,[x,panelY,pz],[scale*.57,panelHeight+.10,.018]);
        queue(plane,ornament,[x,panelY,pz+side*.013],[panelWidth,panelHeight,1],[0,side<0?Math.PI:0,0]);
        for(const dx of [-1,1])queue(unitBox,edge,[x+dx*scale*.31,panelY,pz],[scale*.065,panelHeight+.22,scale*.065]);
        for(const dy of [-1,1])queue(unitBox,stone,[x,panelY+dy*(panelHeight*.5+.08),pz],[scale*.7,.11,scale*.075]);
        // Four hard stone arrises cast the narrow shadows missing from a blockout.
        for(const dx of [-1,1])queue(unitBox,stone,[x+dx*scale*.39,height*.44,pz*.999],[scale*.042,Math.max(.5,height*.68),scale*.038]);
      }
      // Uneven fallen chips collect at the wet foot instead of floating uniformly.
      for(let i=0;i<5;i++){
        const a=i*2.399+index*.67,r=scale*(.92+(i%3)*.17),size=scale*(.10+(i%2)*.09);
        queue(chip,i%2?wetStone:edge,[x+Math.cos(a)*r,.09+size*.3,z+Math.sin(a)*r],[size,size*.65,size*1.4],[i*.37,index*.21,i*.71]);
      }
      // Pin-and-strap repairs explain how the surviving masonry is held together.
      for(const side of [-1,1])for(let i=0;i<3;i++)queue(unitBox,bronze,[x+side*scale*.48,bandY+.03,z+(i-1)*scale*.27],[.042,.09,.042]);
    }
  }
  function shoreInstrument(parent,kind) {
    // Instrument silhouettes stay distinct: celestial dial, a caged lamp and a
    // real optical tube. Added parts are static children of the original target.
    const localDummy=new T.Object3D();
    function localInstances(geometry,material,items){const o=new T.InstancedMesh(geometry,material,items.length);items.forEach((v,i)=>{localDummy.position.set(...v.p);localDummy.rotation.set(...(v.r||[0,0,0]));localDummy.scale.set(...v.s);localDummy.updateMatrix();o.setMatrixAt(i,localDummy.matrix);});o.castShadow=o.receiveShadow=true;parent.add(o);}
    const plates=[],rivets=[];
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;plates.push({p:[Math.sin(a)*.77,.27,Math.cos(a)*.77],s:[.22,.23,.045],r:[0,a,0]});
      for(const dy of [-1,1])rivets.push({p:[Math.sin(a)*.8,.27+dy*.07,Math.cos(a)*.8],s:[.021,.021,.021]});
    }
    localInstances(unitBox,darkMetal,plates);localInstances(new T.SphereGeometry(1,7,5),bronze,rivets);
    const mount=new T.Mesh(new T.CylinderGeometry(.47,.54,.07,48),oxidized);mount.position.y=.77;parent.add(mount);mount.receiveShadow=true;
    if(kind==='observatory'){
      const fork=[];for(const side of [-1,1]){fork.push({p:[side*.53,1.17,0],s:[.085,.72,.16]});fork.push({p:[side*.53,1.5,0],s:[.19,.19,.19]});}localInstances(unitBox,bronze,fork);
      const finder=new T.Mesh(new T.CylinderGeometry(.085,.085,.57,16),paleMetal);finder.rotation.x=Math.PI/2;finder.position.set(.25,1.78,.08);parent.add(finder);
    }
    if(kind==='lamp'){
      const feet=[];for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;feet.push({p:[Math.sin(a)*.5,.97,Math.cos(a)*.5],s:[.055,.43,.055],r:[Math.cos(a)*.27,0,-Math.sin(a)*.27]});}localInstances(unitBox,oxidized,feet);
    }
  }
  function finish(){
    let count=0;for(const {geometry,material,items} of groups.values()){
      const o=new T.InstancedMesh(geometry,material,items.length);items.forEach((v,i)=>{dummy.position.set(...v.p);dummy.rotation.set(...v.r);dummy.scale.set(...v.s);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);});o.castShadow=o.receiveShadow=true;root.add(o);count+=items.length;
    }
    return {batches:groups.size,details:count};
  }
  return {pillar,shoreInstrument,finish};
}
