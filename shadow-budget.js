import * as T from './vendor/three.module.js';

// Small engraving, fasteners and luminous markings need a highlight, not an
// additional shadow draw. Keep masonry, silhouettes and major machinery.
export function balanceShadowCasters(roots,preserve=[]){
  const bounds=new Map(),matrix=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3(),colour=new T.Color();
  const protectedObjects=new Set(preserve);
  const stats={disabled:0,splitBatches:0,shadowInstancesRemoved:0};
  const protectedByParent=object=>{for(let o=object;o;o=o.parent)if(protectedObjects.has(o))return true;return false;};
  function significant(geometry,s){
    const params=geometry.parameters||{},minimum=Math.min(Math.abs(s.x),Math.abs(s.y),Math.abs(s.z));
    if(geometry.type==='TorusGeometry')return params.tube*minimum>=.055;
    if(geometry.type==='TubeGeometry')return params.radius*minimum>=.05;
    if(!bounds.has(geometry)){geometry.computeBoundingBox();bounds.set(geometry,geometry.boundingBox.getSize(new T.Vector3()));}
    const size=bounds.get(geometry),dimensions=[Math.abs(size.x*s.x),Math.abs(size.y*s.y),Math.abs(size.z*s.z)].sort((a,b)=>b-a);
    return dimensions[0]>=.45&&dimensions[1]>=.20&&dimensions[2]>=.035;
  }
  for(const root of roots){
    const meshes=[];root.traverse(o=>{if(o.isMesh&&o.castShadow)meshes.push(o);});
    for(const mesh of meshes){
      if(protectedByParent(mesh))continue;
      const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
      if(materials.every(m=>m.transparent||m.isMeshBasicMaterial||m.isShaderMaterial)){
        mesh.castShadow=false;stats.disabled++;continue;
      }
      if(!mesh.isInstancedMesh){if(!significant(mesh.geometry,mesh.scale)){mesh.castShadow=false;stats.disabled++;}continue;}
      const major=[],minor=[];
      for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);matrix.decompose(p,q,scale);scale.multiply(mesh.scale);(significant(mesh.geometry,scale)?major:minor).push(i);}
      if(!minor.length)continue;
      if(!major.length){stats.shadowInstancesRemoved+=minor.length;mesh.castShadow=false;stats.disabled++;continue;}
      // Animated instanced assemblies retain their original object identity.
      let animated=false;for(let o=mesh;o&&o!==root;o=o.parent)if(o.userData.dynamic)animated=true;
      if(animated)continue;
      stats.shadowInstancesRemoved+=minor.length;
      for(const [indices,casts] of [[major,true],[minor,false]]){
        const batch=new T.InstancedMesh(mesh.geometry,mesh.material,indices.length);
        batch.position.copy(mesh.position);batch.quaternion.copy(mesh.quaternion);batch.scale.copy(mesh.scale);
        batch.name=mesh.name;batch.userData={...mesh.userData};batch.castShadow=casts;batch.receiveShadow=mesh.receiveShadow;
        batch.frustumCulled=mesh.frustumCulled;batch.renderOrder=mesh.renderOrder;batch.layers.mask=mesh.layers.mask;
        indices.forEach((index,i)=>{mesh.getMatrixAt(index,matrix);batch.setMatrixAt(i,matrix);if(mesh.instanceColor){mesh.getColorAt(index,colour);batch.setColorAt(i,colour);}});
        batch.instanceMatrix.needsUpdate=true;mesh.parent.add(batch);
      }
      mesh.removeFromParent();stats.splitBatches++;
    }
  }
  return stats;
}
