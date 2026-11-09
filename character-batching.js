import * as T from './vendor/three.module.js';

// Rendering uses one large buffer per finish, while picking keeps the original
// small-part acceleration bounds. Those parts remain detached from the scene.
function preservePrecisePartPicking(merged, parts) {
  const sphere = new T.Sphere(), ray = new T.Ray(), inverse = new T.Matrix4();
  const sphereHit = new T.Vector3(), savedWorld = new T.Matrix4();
  for (const part of parts) {
    part.raycast = part.object.raycast;
    part.normalMatrix = new T.Matrix3().getNormalMatrix(part.transform);
    if (!part.object.geometry.boundingBox) part.object.geometry.computeBoundingBox();
  }
  merged.raycast = function raycastRigidParts(raycaster, intersections) {
    sphere.copy(this.geometry.boundingSphere).applyMatrix4(this.matrixWorld);
    ray.copy(raycaster.ray).recast(raycaster.near);
    if (!sphere.containsPoint(ray.origin)) {
      if (!ray.intersectSphere(sphere, sphereHit)) return;
      if (ray.origin.distanceToSquared(sphereHit) > (raycaster.far - raycaster.near) ** 2) return;
    }
    inverse.copy(this.matrixWorld).invert();
    ray.copy(raycaster.ray).applyMatrix4(inverse);
    if (!ray.intersectsBox(this.geometry.boundingBox)) return;
    for (const part of parts) {
      const object = part.object, start = intersections.length;
      savedWorld.copy(object.matrixWorld);
      object.matrixWorld.multiplyMatrices(this.matrixWorld, part.transform);
      try {
        // Each original Mesh cheaply rejects rays against its own sphere/box
        // before testing exact triangles, UVs, barycentrics and near/far limits.
        part.raycast.call(object, raycaster, intersections);
      } finally {
        object.matrixWorld.copy(savedWorld);
      }
      for (let i = start; i < intersections.length; i++) {
        const hit = intersections[i];
        hit.object = this;
        // Raycast normals are local to hit.object. Preserve that contract when
        // replacing the detached part with the visible merged mesh reference.
        if (hit.normal) hit.normal.applyNormalMatrix(part.normalMatrix);
        if (hit.face) {
          hit.face.normal.applyNormalMatrix(part.normalMatrix);
          const {a, b, c} = hit.face;
          hit.face.a = a + part.vertexOffset;
          hit.face.b = (part.mirrored ? c : b) + part.vertexOffset;
          hit.face.c = (part.mirrored ? b : c) + part.vertexOffset;
          if (part.mirrored && hit.barycoord) {
            const y = hit.barycoord.y; hit.barycoord.y = hit.barycoord.z; hit.barycoord.z = y;
          }
        }
        if (hit.faceIndex !== undefined) hit.faceIndex += part.triangleOffset;
      }
    }
  };
}

// Bake only within a rigid joint. The joint objects themselves stay in place so
// the existing head/arm animation and recursive character picking still work.
export function consolidateRigidCharacter(character, heads = [], arms = []) {
  const statistics = {
    before: 0, after: 0, batches: 0, mergedMeshes: 0, drawCallsSaved: 0,
    vertices: 0, triangles: 0, components: [], skipped: {},
  };
  if (!character?.isObject3D) return statistics;
  const countMeshes = () => {
    let count = 0;
    character.traverse(object => { if (object.isMesh) count++; });
    return count;
  };
  const skip = reason => { statistics.skipped[reason] = (statistics.skipped[reason] || 0) + 1; };
  const belongsToCharacter = object => {
    for (let p = object; p; p = p.parent) if (p === character) return true;
    return false;
  };
  const joints = new Set();
  const components = [];
  for (const [kind, source] of [['head', heads], ['arm', arms.map(entry => entry?.arm)]]) {
    for (const joint of source) {
      if (!joint?.isObject3D || joint === character || !belongsToCharacter(joint) || joints.has(joint)) continue;
      joints.add(joint);
      components.push({kind, root: joint});
    }
  }
  components.push({kind: 'body', root: character});
  statistics.before = countMeshes();
  character.updateWorldMatrix(true, true);

  const defaultHooks = T.Object3D.prototype;
  const hooks = ['onBeforeRender', 'onAfterRender', 'onBeforeShadow', 'onAfterShadow'];
  const vector = new T.Vector3(), normal = new T.Vector3();
  for (const {kind, root} of components) {
    const record = {kind, before: 0, after: 0, batches: 0, drawCallsSaved: 0};
    const buckets = new Map();
    const inverse = root.matrixWorld.clone();
    if (Math.abs(inverse.determinant()) < 1e-12) { skip('singular-joint'); continue; }
    inverse.invert();
    function visit(object) {
      if (object !== root && joints.has(object)) return;
      // Do not move a hidden subtree's geometry into a visible parent or flatten
      // an unregistered animated subgroup that a later controller might drive.
      if (object !== root && (!object.visible || object.isBone || object.userData.dynamic)) return;
      if (object.isMesh) {
        record.before++;
        const material = object.material, geometry = object.geometry;
        let reason = null;
        if (object === root || object.children.length) reason = 'mesh-transform-parent';
        else if (object.isSkinnedMesh || object.isInstancedMesh || geometry?.isInstancedBufferGeometry) reason = 'deformed-or-instanced';
        else if (!material || Array.isArray(material)) reason = 'multiple-materials';
        else if (material.transparent || material.opacity < 1 || !material.visible) reason = 'transparent-or-hidden';
        else if (material.isShaderMaterial || material.normalMapType === T.ObjectSpaceNormalMap) reason = 'object-space-shader';
        else if (hooks.some(hook => object[hook] !== defaultHooks[hook])) reason = 'render-hook';
        else if (!geometry?.isBufferGeometry || Object.values(geometry.morphAttributes).some(list => list.length)) reason = 'morph-or-unsupported-geometry';
        else if (Object.keys(geometry.attributes).some(name => !['position', 'normal', 'uv'].includes(name))) reason = 'extra-attributes';
        else if (!geometry.attributes.position || !geometry.attributes.normal) reason = 'missing-surface-attributes';
        if (!reason) {
          const {position, normal: normals, uv} = geometry.attributes;
          const count = geometry.index?.count ?? position.count;
          if (position.itemSize !== 3 || normals.itemSize !== 3 || normals.count !== position.count ||
              (uv && (uv.itemSize !== 2 || uv.count !== position.count)) || count % 3) reason = 'invalid-triangle-attributes';
          else if (geometry.drawRange.start !== 0 || geometry.drawRange.count < count) reason = 'partial-draw-range';
          // Group order comes from ancestor Groups in Three.js sorting. Avoid
          // flattening a separately ordered subgroup into this joint's order.
          for (let p = object.parent; !reason && p && p !== root; p = p.parent) {
            if (p.isGroup && p.renderOrder !== 0) reason = 'ordered-subgroup';
          }
        }
        if (reason) skip(reason);
        else {
          const transform = new T.Matrix4().multiplyMatrices(inverse, object.matrixWorld);
          if (Math.abs(transform.determinant()) < 1e-12) skip('singular-mesh');
          else {
            // All render-affecting mesh state is retained alongside the exact
            // material identity. No material or shared source geometry is disposed.
            const key = [material.uuid, object.castShadow, object.receiveShadow, object.renderOrder,
              object.layers.mask, object.frustumCulled, object.customDepthMaterial?.uuid || '',
              object.customDistanceMaterial?.uuid || ''].join('|');
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key).push({object, transform});
          }
        }
      }
      for (const child of object.children) visit(child);
    }
    visit(root);
    for (const list of buckets.values()) {
      if (list.length < 2) continue;
      let vertexCount = 0, indexCount = 0;
      const hasUv = list.some(({object}) => object.geometry.attributes.uv);
      for (const {object} of list) {
        vertexCount += object.geometry.attributes.position.count;
        indexCount += object.geometry.index?.count ?? object.geometry.attributes.position.count;
      }
      const positions = new Float32Array(vertexCount * 3), normals = new Float32Array(vertexCount * 3);
      const uvs = hasUv ? new Float32Array(vertexCount * 2) : null;
      const indices = vertexCount > 65535 ? new Uint32Array(indexCount) : new Uint16Array(indexCount);
      let vertexOffset = 0, indexOffset = 0;
      for (const part of list) {
        const {object, transform} = part;
        part.vertexOffset = vertexOffset;
        part.triangleOffset = indexOffset / 3;
        part.mirrored = transform.determinant() < 0;
        const geometry = object.geometry, attributes = geometry.attributes;
        const normalMatrix = new T.Matrix3().getNormalMatrix(transform);
        for (let i = 0; i < attributes.position.count; i++) {
          vector.fromBufferAttribute(attributes.position, i).applyMatrix4(transform);
          normal.fromBufferAttribute(attributes.normal, i).applyNormalMatrix(normalMatrix);
          vector.toArray(positions, (vertexOffset + i) * 3);
          normal.toArray(normals, (vertexOffset + i) * 3);
          if (uvs && attributes.uv) {
            uvs[(vertexOffset + i) * 2] = attributes.uv.getX(i);
            uvs[(vertexOffset + i) * 2 + 1] = attributes.uv.getY(i);
          }
        }
        const sourceIndex = geometry.index;
        const count = sourceIndex?.count ?? attributes.position.count;
        const mirrored = part.mirrored;
        for (let i = 0; i < count; i += 3) {
          const a = sourceIndex ? sourceIndex.getX(i) : i;
          const b = sourceIndex ? sourceIndex.getX(i + 1) : i + 1;
          const c = sourceIndex ? sourceIndex.getX(i + 2) : i + 2;
          indices[indexOffset++] = vertexOffset + a;
          indices[indexOffset++] = vertexOffset + (mirrored ? c : b);
          indices[indexOffset++] = vertexOffset + (mirrored ? b : c);
        }
        vertexOffset += attributes.position.count;
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new T.BufferAttribute(normals, 3));
      if (uvs) geometry.setAttribute('uv', new T.BufferAttribute(uvs, 2));
      geometry.setIndex(new T.BufferAttribute(indices, 1));
      geometry.computeBoundingBox(); geometry.computeBoundingSphere();
      const source = list[0].object, merged = new T.Mesh(geometry, source.material);
      merged.name = `character-${kind}-rigid-batch`;
      merged.castShadow = source.castShadow; merged.receiveShadow = source.receiveShadow;
      merged.renderOrder = source.renderOrder; merged.layers.mask = source.layers.mask;
      merged.frustumCulled = source.frustumCulled;
      merged.customDepthMaterial = source.customDepthMaterial;
      merged.customDistanceMaterial = source.customDistanceMaterial;
      merged.userData.rigidCharacterBatch = true;
      preservePrecisePartPicking(merged, list);
      root.add(merged);
      merged.updateWorldMatrix(false, false);
      for (const {object} of list) object.removeFromParent();
      record.batches++; record.drawCallsSaved += list.length - 1;
      statistics.batches++; statistics.mergedMeshes += list.length;
      statistics.drawCallsSaved += list.length - 1;
      statistics.vertices += vertexCount; statistics.triangles += indexCount / 3;
    }
    record.after = record.before - record.drawCallsSaved;
    statistics.components.push(record);
  }
  statistics.after = countMeshes();
  return statistics;
}
