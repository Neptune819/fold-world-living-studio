import * as T from './vendor/three.module.js';

// The generated artwork is only the carved stone surface. Cornices, mouldings,
// sockets and their lighting are still real geometry that survives a full turn.
export async function refinePlazaCraft(root,h){
  const map=await new T.TextureLoader().loadAsync('./assets/utopia-frieze-v58.png');
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;map.wrapS=T.RepeatWrapping;map.repeat.set(2,1);
  const bandMap=map.clone();bandMap.wrapS=T.RepeatWrapping;bandMap.repeat.set(4,1);bandMap.needsUpdate=true;
  const stone=new T.MeshStandardMaterial({map,color:0xe1d5bf,roughness:.87,metalness:.015,bumpMap:map,bumpScale:.011});
  const bandStone=stone.clone();bandStone.map=bandMap;bandStone.bumpMap=bandMap;
  const plaqueMap=map.clone();plaqueMap.repeat.set(.32,.98);plaqueMap.offset.set(.34,.01);plaqueMap.needsUpdate=true;
  const plaqueStone=stone.clone();plaqueStone.map=plaqueMap;plaqueStone.bumpMap=plaqueMap;
  const ivory=h.cream.clone();ivory.color.set(0xbdb397);ivory.roughness=.79;
  const bronze=h.gold.clone();bronze.color.set(0x8d7048);bronze.roughness=.51;
  const recessed=new T.MeshStandardMaterial({color:0x283d38,metalness:.34,roughness:.56});
  const plane=new T.PlaneGeometry(1,1),unit=new T.BoxGeometry(1,1,1);
  const bandGeometry=new T.CylinderGeometry(.535,.535,.245,48,1,true);
  const neckGeometry=new T.LatheGeometry([[.38,0],[.46,.025],[.49,.07],[.49,.105],[.47,.12]].map(p=>new T.Vector2(...p)),40);
  const add=(geometry,material,parent,p,s=[1,1,1])=>{const mesh=new T.Mesh(geometry,material);mesh.position.set(...p);mesh.scale.set(...s);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  let count=0;
  const crowns=root.children.filter(o=>o.isMesh&&o.geometry.type==='BoxGeometry'&&Math.abs(o.position.y-7.2)<.01&&Math.abs(o.scale.x-2.6)<.01);
  for(const crown of crowns){
    const g=new T.Group();g.position.copy(crown.position);g.rotation.copy(crown.rotation);root.add(g);
    for(const side of [-1,1]){
      const relief=add(plane,stone,g,[0,-.012,side*.656],[2.42,.46,1]);relief.rotation.y=side<0?Math.PI:0;
      for(const y of [-.272,.244])add(unit,bronze,g,[0,y,side*.665],[2.54,.022,.027]);
      for(const x of [-1.25,1.25])add(unit,ivory,g,[x,-.01,side*.669],[.045,.55,.05]);
    }
    add(bandGeometry,bandStone,root,[crown.position.x,6.61,crown.position.z]);
    add(neckGeometry,ivory,root,[crown.position.x,6.28,crown.position.z]);
    add(neckGeometry,bronze,root,[crown.position.x,.72,crown.position.z],[.94,.55,.94]);
    count++;
  }
  // Enamel recesses and actual corner returns articulate the large instrument
  // piers without covering the editable works standing in front of them.
  for(const side of [-1,1]){
    const g=new T.Group();g.position.set(side*7,1.3,2.5);root.add(g);
    for(const facing of [-1,1]){
      add(unit,recessed,g,[facing*1.108,-.02,0],[.025,1.91,1.57]);
      const panel=add(plane,plaqueStone,g,[facing*1.125,-.02,0],[1.53,1.84,1]);panel.rotation.y=facing*Math.PI/2;
      for(const z of [-.84,.84])add(unit,bronze,g,[facing*1.145,0,z],[.04,2.08,.045]);
      for(const y of [-1.03,1.03])add(unit,bronze,g,[facing*1.145,y,0],[.04,.045,1.72]);
    }
    for(const dx of [-.96,.96])for(const dz of [-.96,.96]){
      add(unit,bronze,g,[dx,-1.08,dz],[.16,.17,.16]);
      add(unit,ivory,g,[dx,1.02,dz],[.15,.22,.15]);
    }
  }
  return {cornices:count,artwork:'utopia-frieze-v58.png'};
}
