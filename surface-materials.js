import * as T from './vendor/three.module.js';
const cache=new Map();
export function loadSurface(name) {
  if(!cache.has(name))cache.set(name,(async()=>{
    const maps=await Promise.all(['color','normal','roughness'].map(kind=>new T.TextureLoader().loadAsync(`./assets/pbr/${name}-${kind}.jpg`)));
    maps.forEach((map,i)=>{map.colorSpace=i===0?T.SRGBColorSpace:T.NoColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;});
    return {map:maps[0],normalMap:maps[1],roughnessMap:maps[2]};
  })());
  return cache.get(name);
}
export function applySurface(material,maps,{repeat=1,normal=.5,roughness=.8}={}) {
  for(const [key,source] of Object.entries(maps)){const map=source.clone();map.repeat.setScalar(repeat);map.needsUpdate=true;material[key]=map;}
  material.normalScale=new T.Vector2(normal,normal);material.roughness=roughness;material.bumpMap=null;material.needsUpdate=true;
  return material;
}
