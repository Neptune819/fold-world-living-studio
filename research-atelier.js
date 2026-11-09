import * as T from './vendor/three.module.js';
import {loadSurface,applySurface} from './surface-materials.js?v=5.6';

// A self-contained optical atelier. Its textures are generated locally, and every
// animated assembly has an explicit transform rather than moving a background image.
const TAU = Math.PI * 2;
const shapeCache = new Map();
function bevelGeometry(w, h, d, r = .06) {
  const key = [w, h, d, r].join(':');
  if (shapeCache.has(key)) return shapeCache.get(key);
  r = Math.min(r, w / 4, h / 4, d / 4);
  const shape = new T.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geometry = new T.ExtrudeGeometry(shape, {
    depth: d - r * 2, bevelEnabled: true, bevelThickness: r,
    bevelSize: r * .65, bevelSegments: 2, curveSegments: 3, steps: 1,
  });
  geometry.translate(0, 0, -d / 2 + r);
  shapeCache.set(key, geometry);
  return geometry;
}
function texture(draw, size = 512, colour = true) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = colour ? T.SRGBColorSpace : T.NoColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.anisotropy = 4;
  return map;
}
function relief() {
  return texture((c, n) => {
    c.fillStyle = '#a0a0a0'; c.fillRect(0, 0, n, n);
    let seed = 14923;
    const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 1500; i++) {
      const value = Math.round(70 + random() * 130);
      c.strokeStyle = `rgba(${value},${value},${value},.2)`;
      c.lineWidth = .3 + random() * .6;
      const x = random() * n;
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x + random() * 1.5, n); c.stroke();
    }
  }, 512, false);
}
function instrumentFace() {
  return texture((c, n) => {
    c.fillStyle = '#d6cfb8'; c.fillRect(0, 0, n, n);
    c.translate(n / 2, n / 2); c.strokeStyle = '#29413f';
    for (const r of [.35, .41, .44]) {
      c.lineWidth = r === .41 ? 3 : 1;
      c.beginPath(); c.arc(0, 0, n * r, 0, TAU); c.stroke();
    }
    for (let i = 0; i < 72; i++) {
      c.save(); c.rotate(i * TAU / 72);
      c.fillStyle = '#324846'; c.fillRect(-1.5, -n * .385, 3, i % 6 ? 9 : 21);
      if (!(i % 6)) {
        c.font = '17px serif'; c.textAlign = 'center';
        c.fillText(String(i * 5), 0, -n * .30);
      }
      c.restore();
    }
    c.textAlign = 'center'; c.fillStyle = '#6f5a39';
    c.font = '20px serif'; c.fillText('ASTROLABE', 0, n * .15);
    c.font = '13px serif'; c.fillText('OPTICAL STUDY · 019', 0, n * .22);
  }, 512);
}
function etchedDeck() {
  return texture((c, n) => {
    c.fillStyle = '#142c2b'; c.fillRect(0, 0, n, n);
    c.translate(n / 2, n / 2); c.strokeStyle = '#a98752';
    for (const r of [.17, .24, .32, .385, .42, .46, .475]) {
      c.lineWidth = r === .42 ? 2 : .85;
      c.beginPath(); c.arc(0, 0, n * r, 0, TAU); c.stroke();
    }
    for (let i = 0; i < 96; i++) {
      c.save(); c.rotate(i * TAU / 96);
      c.beginPath(); c.moveTo(0, -n * .46);
      c.lineTo(0, -n * (i % 8 ? .449 : .425)); c.stroke();
      if (!(i % 8)) {
        c.font = '12px serif'; c.textAlign = 'center';
        c.fillStyle = '#b49a69'; c.fillText(String(i * 3.75), 0, -n * .4);
        c.beginPath(); c.moveTo(0, -n * .385); c.lineTo(0, -n * .245); c.stroke();
      }
      c.restore();
    }
    for (let i = 0; i < 12; i++) {
      c.save(); c.rotate(i * TAU / 12);
      c.beginPath(); c.moveTo(0, -n * .24);
      c.bezierCurveTo(n * .19, -n * .22, n * .23, -n * .13, 0, -n * .17);
      c.stroke(); c.restore();
    }
  }, 1024);
}
function stonePaving() {
  return texture((c, n) => {
    c.fillStyle = '#15302d'; c.fillRect(0, 0, n, n);
    let seed = 8173;
    const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 19000; i++) {
      const v = 70 + Math.floor(random() * 85);
      c.fillStyle = `rgba(${v},${v + 20},${v + 10},.034)`;
      c.fillRect(random() * n, random() * n, 1 + random() * 2.5, .8);
    }
    for (let i = 0; i < 7; i++) {
      const x = random() * n, y = random() * n;
      c.strokeStyle = i % 3 ? 'rgba(116,150,125,.17)' : 'rgba(207,202,151,.20)';
      c.lineWidth = .6 + random() * 1.6;
      c.beginPath(); c.moveTo(x - 280, y + 280);
      c.bezierCurveTo(x - 90, y - 160, x + 80, y + 170, x + 240, y - 290); c.stroke();
    }
    c.strokeStyle = 'rgba(164,139,83,.54)'; c.lineWidth = 1.5;
    c.strokeRect(14, 14, n - 28, n - 28);
    c.strokeStyle = 'rgba(92,127,114,.45)'; c.lineWidth = 1;
    c.strokeRect(24, 24, n - 48, n - 48);
    for (const x of [35, n - 35]) for (const y of [35, n - 35]) {
      c.save(); c.translate(x, y); c.rotate(Math.PI / 4);
      c.strokeStyle = '#847951'; c.strokeRect(-5, -5, 10, 10); c.restore();
    }
  }, 512);
}
function windowEngraving() {
  return texture((c, n) => {
    c.fillStyle = '#102529'; c.fillRect(0, 0, n, n);
    c.strokeStyle = 'rgba(120,151,141,.19)'; c.lineWidth = .7;
    for (let i = 0; i < 18; i++) {
      c.beginPath(); c.moveTo(i * n / 17, 0); c.lineTo(i * n / 17, n); c.stroke();
      c.beginPath(); c.moveTo(0, i * n / 17); c.lineTo(n, i * n / 17); c.stroke();
    }
    c.strokeStyle = 'rgba(190,158,101,.28)';
    for (let i = 0; i < 7; i++) {
      c.beginPath(); c.ellipse(n / 2, n * .38, n * (.11 + i * .035), n * (.14 + i * .045), 0, 0, TAU); c.stroke();
    }
    for (let i = 0; i < 72; i++) {
      const a = i * TAU / 72;
      c.beginPath(); c.moveTo(n / 2 + Math.cos(a) * n * .36, n * .38 + Math.sin(a) * n * .45);
      c.lineTo(n / 2 + Math.cos(a) * n * (i % 6 ? .369 : .386), n * .38 + Math.sin(a) * n * (i % 6 ? .459 : .476)); c.stroke();
    }
    c.fillStyle = 'rgba(182,169,133,.62)'; c.textAlign = 'center'; c.font = '12px serif';
    c.fillText('OPTICAL ARCHIVE / No. 019', n / 2, n * .89);
  }, 512);
}

// Small-scale engraving carries the tooling history; the silhouette and seams
// still come from real geometry rather than a picture pasted across the room.
function opticalEtching() {
  return texture((c, n) => {
    c.fillStyle = '#132d30'; c.fillRect(0, 0, n, n);
    c.translate(n / 2, n / 2);
    for (const r of [.19, .215, .29, .315, .405, .442, .465]) {
      c.strokeStyle = r > .4 ? '#b19b65' : '#6d8173'; c.lineWidth = r === .442 ? 2 : 1;
      c.beginPath(); c.arc(0, 0, n * r, 0, TAU); c.stroke();
    }
    for (let i = 0; i < 120; i++) {
      c.save(); c.rotate(i * TAU / 120);
      c.strokeStyle = i % 5 ? '#71877d' : '#c1ac78';
      c.beginPath(); c.moveTo(0, -n * .447); c.lineTo(0, -n * (i % 5 ? .432 : .414)); c.stroke();
      if (!(i % 10)) {
        c.strokeStyle = '#8f805a'; c.beginPath(); c.moveTo(0, -n * .40); c.lineTo(0, -n * .34); c.stroke();
        c.font = '12px serif'; c.fillStyle = '#a69d7b'; c.textAlign = 'center'; c.fillText(String(i * 3), 0, -n * .37);
      }
      c.restore();
    }
    // Guilloche loops remain fine enough to read as metalwork, not signage.
    c.strokeStyle = 'rgba(184,157,96,.48)'; c.lineWidth = .8;
    for (let i = 0; i < 16; i++) {
      c.save(); c.rotate(i * TAU / 16); c.beginPath();
      c.ellipse(0, -n * .272, n * .052, n * .092, 0, 0, TAU); c.stroke(); c.restore();
    }
  }, 1024);
}

// Merge only repeated static parts. Groups that are later driven by controls remain
// independent and keep their own hit geometry for scene picking and dragging.
function batch(group) {
  group.updateWorldMatrix(true, true);
  const inverse = group.matrixWorld.clone().invert(), buckets = new Map();
  group.traverse(object => {
    if (!object.isMesh || object.isInstancedMesh || object.material.transparent || object.material.isShaderMaterial) return;
    for (let p = object; p && p !== group; p = p.parent) if (p.userData.dynamic) return;
    const geometryKey = object.geometry.parameters ? object.geometry.type + JSON.stringify(object.geometry.parameters) : object.geometry.uuid;
    const key = geometryKey + object.material.uuid;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(object);
  });
  for (const list of buckets.values()) {
    if (list.length < 4) continue;
    const instanced = new T.InstancedMesh(list[0].geometry, list[0].material, list.length);
    list.forEach((object, i) => {
      instanced.setMatrixAt(i, new T.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      object.removeFromParent();
    });
    instanced.castShadow = true; instanced.receiveShadow = true;
    group.add(instanced);
  }
}

export async function buildResearchAtelier(root, scene, h) {
  const {mesh, cyl, ring, rod, ball, core} = h;
  for (const child of [...root.children]) if (child !== core) root.remove(child);
  for (const child of [...core.children]) core.remove(child);
  core.userData.dynamic = true;
  core.position.set(0, 4, -3);
  // Old lights were positioned for the previous laboratory. Retire them rather
  // than retaining a flat, uniformly lit shell around the new installation.
  for (const object of scene.children) if (object.isLight) {object.intensity=0;object.visible=false;}
  scene.environmentIntensity = .28;
  scene.fog = new T.Fog(0x101d24, 48, 105);

  const [metalMaps,stoneMaps]=await Promise.all([loadSurface('metal_plate'),loadSurface('concrete_wall_004')]);
  const brushed = relief(), gaugeMap = instrumentFace();
  const enamel = new T.MeshPhysicalMaterial({color: 0x153d3c, roughness: .31, metalness: .48, clearcoat: .65, clearcoatRoughness: .2, bumpMap: brushed, bumpScale: .004});
  const bronze = new T.MeshStandardMaterial({color: 0xa7854c, metalness: .86, roughness: .39, roughnessMap: brushed, bumpMap: brushed, bumpScale: .006});
  const nickel = new T.MeshStandardMaterial({color: 0x92abb0, metalness: .92, roughness: .27, roughnessMap: brushed, bumpMap: brushed, bumpScale: .003});
  const ceramic = new T.MeshStandardMaterial({color: 0xc9c1a6, metalness: .08, roughness: .53, bumpMap: brushed, bumpScale: .012});
  const recess = new T.MeshStandardMaterial({color: 0x081416, metalness: .28, roughness: .75});
  const wall = new T.MeshStandardMaterial({color: 0x223b40, metalness: .18, roughness: .68, bumpMap: brushed, bumpScale: .012});
  const warm = new T.MeshStandardMaterial({color: 0xfde2a6, emissive: 0xffb967, emissiveIntensity: 1.55, roughness: .32});
  const cool = new T.MeshStandardMaterial({color: 0xb3d2d0, emissive: 0x58b5bc, emissiveIntensity: .85, roughness: .26});
  const indicator = new T.MeshStandardMaterial({color: 0xa2472a, emissive: 0xff5a25, emissiveIntensity: .4, roughness: .38});
  const transparent = new T.MeshPhysicalMaterial({color: 0x86bcb9, roughness: .16, metalness: .03, transparent: true, opacity: .15, depthWrite: false, side: T.DoubleSide, clearcoat: .85});
  const dialMaterial = new T.MeshStandardMaterial({map: gaugeMap, roughness: .7});
  const paving = new T.MeshStandardMaterial({map: stonePaving(), color: 0x93a599, roughness: .64, metalness: .19, bumpMap: brushed, bumpScale: .006});
  for(const m of [enamel,bronze,nickel]){
    applySurface(m,metalMaps,{normal:.10,roughness:m===enamel?.36:.45});
    m.onBeforeCompile=shader=>{shader.uniforms.finishTint={value:m.color};shader.fragmentShader='uniform vec3 finishTint;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nvec3 patina=texture2D(map,vMapUv).rgb;float wear=dot(patina,vec3(.2126,.7152,.0722));diffuseColor.rgb=finishTint*(.82+wear*.30);');};
  }
  applySurface(wall,stoneMaps,{repeat:2,normal:.42,roughness:.85});
  applySurface(paving,stoneMaps,{normal:.7,roughness:.71});
  paving.color.set(0x556e65);
  const engraving = new T.MeshStandardMaterial({map: windowEngraving(), color: 0xc0d4cd, roughness: .66, metalness: .16, transparent:true, opacity:.055, depthWrite:false});
  function bevel(parent, material, position, size, radius = .06) { return mesh(bevelGeometry(...size, radius), material, parent, position); }
  function group(parent, position = [0, 0, 0], dynamic = false) { const g = new T.Group(); g.position.set(...position); g.userData.dynamic = dynamic; parent.add(g); return g; }
  function horizontalRing(parent, material, position, radius, thickness = .03) { const r = ring(parent, material, position, radius, thickness); r.rotation.x = -Math.PI / 2; return r; }
  function frame(parent, material, position, width, height, depth = .12) {
    const g = group(parent, position);
    for (const side of [-1, 1]) {
      bevel(g, material, [side * width / 2, 0, 0], [.08, height, depth], .015);
      bevel(g, material, [0, side * height / 2, 0], [width, .08, depth], .015);
    }
    return g;
  }
  const needles = [], rotorAssemblies = [], specimenRotors = [];
  const etchedMetal = new T.MeshStandardMaterial({map: opticalEtching(), roughness: .42, metalness: .62});
  // A lathed sleeve exposes the lip, counterbore and retaining shoulder of a
  // machined part in one draw call, instead of a stack of unrelated cylinders.
  function sleeve(parent, material, position, profile, segments = 64) {
    const geometry = new T.LatheGeometry(profile.map(([r, y]) => new T.Vector2(r, y)), segments);
    const object = mesh(geometry, material, parent, position);
    object.rotation.x = Math.PI / 2;
    return object;
  }
  const fastenerGeometry = new T.CylinderGeometry(.045, .045, .045, 6);
  function screw(parent, position, radius = 1) {
    const bolt = mesh(fastenerGeometry, nickel, parent, position, [radius, 1, radius]);
    bolt.rotation.x = Math.PI / 2;
    return bolt;
  }
  function gauge(parent, position, radius = .4) {
    const [x, y, z] = position;
    ring(parent, bronze, position, radius, radius * .10);
    mesh(new T.CircleGeometry(radius * .94, 48), dialMaterial, parent, [x, y, z + .035]);
    const needle = group(parent, [x, y, z + .06], true);
    rod(needle, indicator, [0, -radius * .13, 0], [0, radius * .66, 0], .014);
    ball(needle, nickel, [0, 0, .015], [.045, .045, .02]); needles.push(needle);
    return needle;
  }

  // The gallery remains spacious around the entire orbit, not just in its front view.
  bevel(root, wall, [0, -.28, -3], [38, .36, 40], .08);
  for (let x = -16; x <= 16; x += 4) for (let z = -19; z <= 13; z += 4) {
    bevel(root, recess, [x, .018, z], [3.96, .035, 3.96], .008);
    const tile = mesh(new T.PlaneGeometry(3.90, 3.90), paving, root, [x, .075, z]);
    tile.rotation.x = -Math.PI / 2;
    tile.castShadow = false;
  }
  for (const x of [-17, 17]) bevel(root, bronze, [x, .041, -3], [.045, .02, 36], .006);
  for (const z of [-20, 14]) bevel(root, bronze, [0, .042, z], [34, .025, .045], .006);
  for (const side of [-1, 1]) {
    bevel(root, recess, [side * 19, 8, -3], [.4, 16, 40], .07);
    for (let z = -18; z <= 12; z += 6) {
      bevel(root, wall, [side * 18.7, 6.7, z], [.3, 13.4, 5.65], .07);
      for (const dz of [-2.65, 2.65]) rod(root, bronze, [side * 18.4, .5, z + dz], [side * 18.4, 13, z + dz], .027);
      bevel(root, warm, [side * 18.45, 10.8, z], [.04, 1.1, .65], .007);
    }
  }
  bevel(root, recess, [0, 16.5, -3], [38, .3, 40], .06);
  for (let z = -16; z <= 12; z += 7) {
    bevel(root, enamel, [0, 15.7, z], [37, .4, .48], .07);
    bevel(root, bronze, [0, 15.43, z], [36, .035, .18], .008);
  }

  // Shallow service cassettes and paired conduits make the dark side walls a
  // credible supporting environment without intruding into the camera orbit.
  for (const side of [-1, 1]) for (const z of [-15, -3, 9]) {
    const bay = group(root, [side * 18.35, 4.8, z]);
    bay.rotation.y = -side * Math.PI / 2;
    bevel(bay, recess, [0, 0, -.02], [3.6, 5.8, .16], .06);
    bevel(bay, enamel, [0, 0, .10], [3.36, 5.57, .18], .055);
    frame(bay, bronze, [0, 0, .23], 3.13, 5.32, .07);
    for (const x of [-1.35, 1.35]) {
      rod(bay, nickel, [x, -2.45, .25], [x, 2.45, .25], .045);
      for (const y of [-2.1, 0, 2.1]) {
        bevel(bay, bronze, [x, y, .30], [.15, .12, .12], .015);
        screw(bay, [x, y, .39], .7);
      }
    }
    bevel(bay, recess, [0, .15, .22], [1.95, 2.9, .08], .06);
    for (let i = 0; i < 9; i++) bevel(bay, nickel, [0, -1.03 + i * .29, .28], [1.7, .052, .08], .01);
    bevel(bay, recess, [0, 2.04, .23], [1.92, .32, .10], .035);
    bevel(bay, warm, [0, 2.04, .29], [1.67, .07, .025], .008);
    for (const x of [-.66, .66]) {
      bevel(bay, enamel, [x, -2.1, .29], [.46, .35, .18], .045);
      ring(bay, bronze, [x, -2.1, .41], .095, .02);
    }
  }

  // Rear windows combine a real stepped frame with deep ribs and a lit inner wall.
  // Real openings into the observation hall replace the closed backing wall.
  bevel(root, recess, [0, 15.3, -22], [38, 1.4, .65], .08);
  bevel(root, recess, [0, .2, -22], [38, .4, .65], .06);
  for(const x of [-18.5,-6,6,18.5]) bevel(root,recess,[x,7.6,-22],[2.1,15.2,.65],.08);
  for (const x of [-12, 0, 12]) {
    bevel(root, wall, [x, .4, -21.6], [9.7, .8, .24], .05);
    for (const side of [-1, 1]) {
      bevel(root, enamel, [x + side * 4.5, 5, -21.25], [.36, 10, .7], .07);
      bevel(root, bronze, [x + side * 4.3, 5, -20.8], [.05, 10, .07], .014);
      bevel(root, recess, [x + side * 4.84, 6.8, -21.08], [.16, 13.4, .24], .035);
      bevel(root, cool, [x + side * 4.79, 6.8, -20.92], [.025, 12.6, .035], .006);
      for (const [y, w, height] of [[.21, .75, .25], [.47, .60, .15], [9.62, .62, .12], [9.81, .74, .15]]) {
        bevel(root, y > 9 ? bronze : enamel, [x + side * 4.5, y, -20.9], [w, height, .9], .023);
      }
    }
    for (const [r, z, material, thickness] of [[4.5, -21.2, enamel, .19], [4.25, -20.82, bronze, .035]]) {
      mesh(new T.TorusGeometry(r, thickness, 8, 64, Math.PI), material, root, [x, 10, z]);
    }
    const windowShape = new T.Shape();
    windowShape.moveTo(-4.12, .45); windowShape.lineTo(-4.12, 10);
    windowShape.absarc(0, 10, 4.12, Math.PI, 0, true);
    windowShape.lineTo(4.12, .45); windowShape.closePath();
    const backPane = mesh(new T.ShapeGeometry(windowShape, 48), engraving, root, [x, 0, -21.37]);
    // ShapeGeometry's default UVs are world coordinates; map to the whole arch.
    const panePosition = backPane.geometry.attributes.position, paneUv = backPane.geometry.attributes.uv;
    for (let i = 0; i < panePosition.count; i++) paneUv.setXY(i, (panePosition.getX(i) + 4.12) / 8.24, panePosition.getY(i) / 14.12);
    paneUv.needsUpdate = true;
    mesh(backPane.geometry, transparent, root, [x, 0, -21.05]);
    for (let y = 1.4; y <= 8.6; y += 1.8) bevel(root, nickel, [x, y, -21], [8.35, .04, .08], .006);
    for (const dx of [-2.75, 0, 2.75]) rod(root, nickel, [x + dx, .4, -21], [x + dx, 12, -21], .022);
    bevel(root, cool, [x, 1.7, -21.3], [8, .035, .08], .007);
    for (const dx of [-2.75, 2.75]) bevel(root, bronze, [x + dx, 5.2, -20.93], [.055, 9.8, .13], .012);
    for (const y of [1.4, 8.6]) {
      bevel(root, recess, [x, y, -20.78], [8.35, .14, .22], .035);
      bevel(root, warm, [x, y - .045, -20.63], [8.25, .025, .045], .006);
    }
  }
  // Matching front architecture reads coherently when the user orbits behind the core.
  for (const side of [-1, 1]) {
    bevel(root, wall, [side * 12.7, 7.5, 16], [11.6, 15, .45], .07);
    for (const x of [side * 7.15, side * 17.9]) bevel(root, enamel, [x, 6.5, 15.65], [.45, 13, .55], .07);
    frame(root, bronze, [side * 12.7, 7, 15.72], 8.6, 11);
    for (let j = 0; j < 4; j++) bevel(root, recess, [side * 12.7, 3 + j * 2, 15.68], [7.4, .11, .1], .01);
  }
  mesh(new T.TorusGeometry(6.4, .25, 8, 64, Math.PI), enamel, root, [0, 8.8, 15.6]);
  mesh(new T.TorusGeometry(6.06, .04, 8, 64, Math.PI), bronze, root, [0, 8.8, 15.75]);

  // Stepped foundation and turntable: drag rotates this deck without rotating the room.
  const base = group(root, [0, 0, -3]);
  for (const [r, y, height, material] of [[5.2, .17, .32, recess], [4.9, .39, .18, nickel], [4.65, .59, .22, enamel]]) cyl(base, material, [0, y, 0], r, height);
  for (let i = 0; i < 32; i++) {
    const a = i * TAU / 32;
    const part = bevel(base, i % 4 ? enamel : bronze, [Math.cos(a) * 4.98, .29, Math.sin(a) * 4.98], [.16, .18, .6], .025);
    part.rotation.y = -a;
  }
  const turntable = group(root, [0, .74, -3], true);
  turntable.name = 'atelier-turntable';
  turntable.userData.draggable = true;
  cyl(turntable, bronze, [0, 0, 0], 4.58, .10);
  cyl(turntable, enamel, [0, .075, 0], 4.49, .10);
  const deckMaterial = new T.MeshStandardMaterial({map: etchedDeck(), roughness: .39, metalness: .58, bumpMap: brushed, bumpScale: .006});
  const engraved = mesh(new T.CircleGeometry(4.46, 128), deckMaterial, turntable, [0, .13, 0]);
  engraved.rotation.x = -Math.PI / 2;
  horizontalRing(turntable, bronze, [0, .142, 0], 4.34, .027);
  horizontalRing(turntable, cool, [0, .146, 0], 4.12, .012);
  for (let i = 0; i < 48; i++) {
    const a = i * TAU / 48;
    const tick = bevel(turntable, i % 4 ? nickel : bronze, [Math.cos(a) * 4.4, .168, Math.sin(a) * 4.4], [.06, .03, i % 4 ? .18 : .31], .005);
    tick.rotation.y = -a;
    if (!(i % 4)) ball(turntable, bronze, [Math.cos(a) * 4.15, .175, Math.sin(a) * 4.15], [.045, .02, .045]);
  }
  batch(turntable);
  // The stationary bearing race stays fixed while the engraved deck turns.
  // Inspection slots, clamped panels and recessed lamps give its edge a scale.
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12, shoe = group(base, [Math.cos(a) * 4.76, .39, Math.sin(a) * 4.76]);
    shoe.rotation.y = Math.PI / 2 - a;
    bevel(shoe, recess, [0, 0, 0], [.76, .15, .075], .018);
    bevel(shoe, bronze, [0, 0, .045], [.65, .07, .035], .008);
    for (const x of [-.31, .31]) screw(shoe, [x, 0, .074], .58);
    if (!(i % 3)) bevel(shoe, cool, [0, -.004, .065], [.24, .026, .012], .003);
  }
  // Tripod-bearing saddles have a visible mechanical attachment to the foundation.
  for (const side of [-1, 1]) {
    bevel(root, enamel, [side * 3.7, 1.1, -3], [1.1, .42, 1.2], .11);
    for (const dz of [-.4, .4]) rod(root, nickel, [side * 3.7, 1.25, -3 + dz], [side * 3.7, 3.95, -3 + dz], .09);
    bevel(root, enamel, [side * 3.7, 3.95, -3], [.6, .8, 1.15], .10);
    const bearing = cyl(root, bronze, [side * 3.47, 4, -3], .42, .32); bearing.rotation.z = Math.PI / 2;
    rod(root, nickel, [side * 3.3, 4, -3], [side * 2.97, 4, -3], .105);
    gauge(root, [side * 3.7, 3.96, -2.37], .23);
    for (const dz of [-.4, .4]) for (const y of [1.55, 3.48]) {
      cyl(root, bronze, [side * 3.7, y, -3 + dz], .15, .15);
      cyl(root, recess, [side * 3.7, y + .11, -3 + dz], .115, .055);
    }
    for (const dx of [-.36, .36]) for (const dz of [-.43, .43]) {
      const bolt = mesh(fastenerGeometry, nickel, root, [side * 3.7 + dx, 1.326, -3 + dz], [1.2, 1, 1.2]);
      bolt.castShadow = false;
    }
    // Open diagonal bracing reads from the side without concealing the core.
    rod(root, bronze, [side * 3.7, 1.34, -3.42], [side * 3.7, 3.60, -2.58], .045);
  }

  // The nucleus consists of articulated enamel petals around a faceted, lit lens.
  const heart = group(core, [0, 0, 0], true);
  const coreWarm = warm.clone();
  const lens = mesh(new T.IcosahedronGeometry(.83, 2), coreWarm, heart);
  lens.rotation.z = .2;
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12;
    mesh(new T.SphereGeometry(1.34, 12, 24, a + .042, TAU / 12 - .084, .24, Math.PI - .48), i % 3 ? enamel : nickel, heart);
    const path = [];
    for (let k = 0; k <= 24; k++) {
      const p = .21 + k / 24 * (Math.PI - .42);
      path.push(new T.Vector3(1.365 * Math.sin(p) * Math.cos(a), 1.365 * Math.cos(p), -1.365 * Math.sin(p) * Math.sin(a)));
    }
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(path), 24, .015, 5, false), bronze, heart);
  }
  for (const y of [-.9, 0, .9]) horizontalRing(heart, nickel, [0, y, 0], Math.sqrt(1.39 ** 2 - y ** 2), .035);
  for (const side of [-1, 1]) cyl(heart, bronze, [0, side * 1.29, 0], .28, .17);
  // An assembled optical pupil gives the nucleus a recognisable purpose. The
  // opaque outer petals remain, but a genuine glass/iris stack catches the key
  // and rim lights instead of leaving an unbroken grey sphere at the centre.
  const opticalHead = group(heart, [0, 0, 1.10]);
  sleeve(opticalHead, enamel, [0, 0, 0], [[.68, -.30], [.82, -.30], [.88, -.22], [.88, .07], [.84, .12], [.67, .12]]);
  sleeve(opticalHead, bronze, [0, 0, .12], [[.64, -.06], [.84, -.06], [.86, -.035], [.86, .055], [.79, .085], [.64, .085]]);
  mesh(new T.RingGeometry(.64, .80, 64), etchedMetal, opticalHead, [0, 0, .205]);
  mesh(new T.CircleGeometry(.63, 64), recess, opticalHead, [0, 0, .21]);
  const bladeShape = new T.Shape();
  bladeShape.moveTo(.23, -.06); bladeShape.lineTo(.61, -.16);
  bladeShape.quadraticCurveTo(.71, .08, .49, .26);
  bladeShape.lineTo(.20, .12); bladeShape.closePath();
  const irisBladeGeometry = new T.ShapeGeometry(bladeShape, 6);
  for (let i = 0; i < 10; i++) {
    const a = i * TAU / 10;
    const blade = mesh(irisBladeGeometry, i % 2 ? nickel : bronze, opticalHead, [0, 0, .227 + i * .0008]);
    blade.rotation.z = a; blade.castShadow = false;
    if (!(i % 2)) screw(opticalHead, [Math.cos(a) * .74, Math.sin(a) * .74, .24], .64);
  }
  ring(opticalHead, bronze, [0, 0, .265], .225, .017);
  const pupil = mesh(new T.SphereGeometry(.215, 24, 12), coreWarm, opticalHead, [0, 0, .23], [1, 1, .22]);
  pupil.castShadow = false;
  const lensGlass = new T.MeshPhysicalMaterial({color: 0x7bceca, metalness: .15, roughness: .075, clearcoat: 1, clearcoatRoughness: .035, transparent: true, opacity: .18, depthWrite: false});
  const frontLens = mesh(new T.SphereGeometry(.63, 40, 20), lensGlass, opticalHead, [0, 0, .255], [1, 1, .18]);
  frontLens.castShadow = false;
  ring(opticalHead, nickel, [0, 0, .273], .615, .018);
  for (let i = 0; i < 32; i++) {
    const a = i * TAU / 32;
    const grip = bevel(opticalHead, bronze, [Math.cos(a) * .875, Math.sin(a) * .875, .032], [.024, .065, .09], .004);
    grip.rotation.z = a;
  }
  for (let i = 0; i < 3; i++) {
    const axis = group(core, [0, 0, 0], true); axis.rotation.set(.35 + i * .64, .45 + i * .59, i * .17);
    const rotor = group(axis); const radius = 2.05 + i * .46;
    ring(rotor, i === 1 ? enamel : nickel, [0, 0, 0], radius, .11);
    for (const dz of [-.10, .10]) ring(rotor, bronze, [0, 0, dz], radius + (dz > 0 ? .14 : -.14), .023);
    for (let j = 0; j < 48; j++) {
      const a = j * TAU / 48;
      const part = bevel(rotor, j % 4 ? nickel : bronze, [Math.cos(a) * radius, Math.sin(a) * radius, 0], [.11, j % 4 ? .16 : .32, .26], .02);
      part.rotation.z = a;
      if (!(j % 8)) ball(rotor, bronze, [Math.cos(a) * radius, Math.sin(a) * radius, .17], [.046, .046, .025]);
    }
    for (const side of [-1, 1]) {
      bevel(rotor, enamel, [side * radius, 0, 0], [.41, .61, .45], .075);
      ring(rotor, bronze, [side * radius, 0, .24], .18, .022);
      mesh(new T.CircleGeometry(.15, 24), dialMaterial, rotor, [side * radius, 0, .25]);
      for (const dy of [-.24, .24]) for (const dx of [-.13, .13]) screw(rotor, [side * radius + dx, dy, .25], .55);
    }
    batch(rotor); rotorAssemblies.push({rotor, speed: .035 + i * .022});
  }
  batch(heart);

  // Glass specimens and instrument bays are pushed beyond the 13-unit camera orbit.
  for (const side of [-1, 1]) {
    for (const z of [-12, -3, 6]) {
      const station = group(root, [side * 15.5, 0, z]);
      bevel(station, enamel, [0, 2.15, 0], [2.65, 4.3, 1.8], .13);
      frame(station, bronze, [0, 2.25, 1], 2.36, 3.73);
      for (const dx of [-.93, .93]) for (const y of [.6, 3.9]) {
        const bolt = cyl(station, nickel, [dx, y, 1.075], .05, .05); bolt.rotation.x = Math.PI / 2;
      }
      gauge(station, [-.55, 3.13, 1.1], .38); gauge(station, [.52, 3.13, 1.1], .28);
      for (let i = 0; i < 7; i++) bevel(station, recess, [0, .65 + i * .13, 1.05], [1.87, .055, .04], .009);
      for (let i = 0; i < 3; i++) ball(station, i === 2 ? indicator : warm, [(i - 1) * .24, 2.03, 1.1], [.055, .055, .02]);
      // Recessed catalogue compartment and a physical handle separate service
      // access from the analogue instruments, even when seen in silhouette.
      bevel(station, recess, [0, 1.56, 1.045], [1.9, .4, .07], .035);
      frame(station, nickel, [0, 1.56, 1.09], 1.73, .28, .035);
      rod(station, bronze, [-.33, 1.55, 1.18], [.33, 1.55, 1.18], .034);
      for (const dx of [-.33, .33]) rod(station, nickel, [dx, 1.55, 1.09], [dx, 1.55, 1.18], .028);
      rod(station, nickel, [1.45, .3, 0], [1.45, 7.6, 0], .10);
      for (const y of [.9, 3.9, 7]) cyl(station, bronze, [1.45, y, 0], .15, .1);
    }
    for (const z of [-16, 1]) {
      const pod = group(root, [side * 15, 0, z]);
      for (const [y, radius, height, material] of [[.4, .92, .8, enamel], [.91, .87, .14, bronze], [4.65, .87, .14, bronze], [4.92, .92, .38, enamel]]) cyl(pod, material, [0, y, 0], radius, height);
      cyl(pod, transparent, [0, 2.8, 0], .81, 3.6);
      for (let j = 0; j < 8; j++) {
        const a = j * TAU / 8;
        rod(pod, nickel, [Math.cos(a) * .84, 1, Math.sin(a) * .84], [Math.cos(a) * .84, 4.6, Math.sin(a) * .84], j % 2 ? .022 : .044);
      }
      horizontalRing(pod, cool, [0, 1.1, 0], .7, .012);
      horizontalRing(pod, cool, [0, 4.5, 0], .7, .012);
      for (let j = 0; j < 12; j++) {
        const a = j * TAU / 12;
        for (const y of [1.03, 4.62]) {
          const catchPart = bevel(pod, nickel, [Math.cos(a) * .85, y, Math.sin(a) * .85], [.075, .095, .12], .01);
          catchPart.rotation.y = -a;
        }
      }
      const specimen = group(pod, [0, 2.8, 0], true);
      mesh(new T.OctahedronGeometry(.51, 0), nickel, specimen);
      for (let i = 0; i < 3; i++) { const halo = ring(specimen, bronze, [0, 0, 0], .65, .019); halo.rotation.set(.3 + i * .7, i * .8, 0); }
      specimenRotors.push(specimen);
    }
  }

  // Two actual control objects are exposed to the shared 3D picking registry.
  let coreEnabled = true, ringsRunning = true, turntableAngle = 0;
  const controlLights = [];
  function console(position, index) {
    const g = group(root, position, true);
    bevel(g, recess, [0, -1, -.15], [.65, 1.65, .55], .07);
    bevel(g, enamel, [0, .02, 0], [1.9, 1.45, .5], .11);
    frame(g, bronze, [0, .025, .28], 1.66, 1.2);
    gauge(g, [-.38, .1, .31], .32);
    const toggle = cyl(g, nickel, [.53, .05, .37], .17, .12); toggle.rotation.x = Math.PI / 2;
    ring(g, bronze, [.53, .05, .43], .23, .022);
    for (const x of [-.76, .76]) for (const y of [-.5, .5]) screw(g, [x, y, .32], .66);
    rod(g, indicator, [.53, .05, .4], [.53, .27, .56], .035);
    const lamp = ball(g, cool.clone(), [.53, -.35, .32], [.10, .10, .035]);
    controlLights.push(lamp.material);
    for (const side of [-1, 1]) rod(g, bronze, [side * .68, -.72, -.2], [side * .68, -1.8, -.2], .06);
    g.rotation.y = index ? -.13 : .13;
    batch(g);
    return g;
  }
  const energyControl = console([-5.8, 2.0, -.5], 0);
  const ringControl = console([5.8, 2.0, -.5], 1);
  const actions = [
    {id: 'atelier-energy', label: '核心能量', target: energyControl, anchor: [0, 1.15, .25], activate() {coreEnabled = !coreEnabled;}, getStatus() {return coreEnabled ? '已点亮 · 点击休眠' : '休眠中 · 点击点亮';}},
    {id: 'atelier-orbits', label: '观测环', target: ringControl, anchor: [0, 1.15, .25], activate() {ringsRunning = !ringsRunning;}, getStatus() {return ringsRunning ? '运行中 · 点击暂停' : '已暂停 · 点击运行';}},
  ];

  // One shadowed overhead spotlight and unshadowed local lights keep the lighting
  // directional and readable while avoiding additional shadow-map passes per lamp.
  const ambient = new T.HemisphereLight(0x95b8c7, 0x162a22, .26); root.add(ambient);
  const key = new T.SpotLight(0xffd19a, 1180, 45, .55, .38, 2);
  key.position.set(-8, 12, 5); key.target.position.set(0, 2.5, -3);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -.0002; key.shadow.normalBias = .035;
  key.shadow.camera.near = .5; key.shadow.camera.far = 38;
  root.add(key, key.target);
  const rim = new T.SpotLight(0x8bc9db, 390, 40, .72, .68, 2);
  rim.position.set(7.5, 9, -11); rim.target.position.set(0, 4, -3); root.add(rim, rim.target);
  const left = new T.PointLight(0xa2cbd4, 85, 25, 2); left.position.set(-9, 6, -6); root.add(left);
  const innerLight = new T.PointLight(0xffb66c, 22, 8, 2); core.add(innerLight);
  for (const side of [-1, 1]) {
    if(side<0){const workLight = new T.PointLight(0xffc681, 48, 20, 2); workLight.position.set(side * 8, 4.8, 4); root.add(workLight);}
  }
  for (const position of [[-8, 11.8, 5], [7.5, 8.9, -11]]) {
    cyl(root, enamel, position, .62, .22);
    horizontalRing(root, bronze, [position[0], position[1] - .13, position[2]], .57, .04);
    cyl(root, warm, [position[0], position[1] - .15, position[2]], .47, .03);
  }
  const beamMaterial = new T.ShaderMaterial({
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec2 vUv;void main(){float width=pow(max(0.,sin(vUv.x*3.14159)),3.);float a=width*(1.-vUv.y)*.035;gl_FragColor=vec4(.9,.72,.44,a);}',
    transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
  });
  const beam = mesh(new T.PlaneGeometry(2.2, 11), beamMaterial, root, [-4.2, 7.8, -.2]);
  beam.rotation.z = -.56; beam.castShadow = false;
  const dustPositions = [];
  for (let i = 0; i < 100; i++) dustPositions.push(Math.sin(i * 12.93) * 8, 1.7 + (i % 31) * .28, -3 + Math.cos(i * 5.13) * 8);
  const dustGeometry = new T.BufferGeometry(); dustGeometry.setAttribute('position', new T.Float32BufferAttribute(dustPositions, 3));
  const dust = new T.Points(dustGeometry, new T.PointsMaterial({color: 0xd8c298, size: .025, transparent: true, opacity: .35, depthWrite: false}));
  dust.userData.dynamic = true; root.add(dust);
  batch(root);

  let lastTime = null, ringTime = 0;
  function update(time, progress, reduced) {
    const dt = lastTime == null ? 0 : Math.max(0, Math.min(.1, time - lastTime));
    lastTime = time;
    if (!reduced && ringsRunning) ringTime += dt;
    rotorAssemblies.forEach(({rotor, speed}, i) => rotor.rotation.z = reduced ? 0 : ringTime * speed * (i % 2 ? -1 : 1));
    heart.rotation.y = reduced ? 0 : time * .065;
    core.position.y = 4 + (reduced || !coreEnabled ? 0 : Math.sin(time * .45) * .055);
    lens.scale.setScalar(coreEnabled ? 1 + (reduced ? 0 : Math.sin(time * 1.1) * .024) : .76);
    coreWarm.emissiveIntensity = coreEnabled ? 1.55 : .32;
    innerLight.intensity = coreEnabled ? 22 : 3;
    turntable.rotation.y = turntableAngle;
    specimenRotors.forEach((g, i) => {g.rotation.y = reduced ? 0 : time * (.05 + i * .009); g.rotation.z = reduced ? .2 : .2 + Math.sin(time * .18 + i) * .10;});
    needles.forEach((g, i) => g.rotation.z = -.55 + (reduced ? 0 : Math.sin(time * .31 + i * 1.8) * .16));
    controlLights[0].emissiveIntensity = coreEnabled ? 1 : .05;
    controlLights[1].emissiveIntensity = ringsRunning ? 1 : .05;
    dust.rotation.y = reduced ? 0 : Math.sin(time * .05) * .014;
    dust.position.y = reduced ? 0 : Math.sin(time * .16) * .07;
  }
  function setTurntable(angle) { if (Number.isFinite(angle)) {turntableAngle = angle; turntable.rotation.y = angle;} }
  return {
    update, actions, setTurntable, turntable,
    get state() {return {coreEnabled, ringsRunning, turntableAngle};},
  };
}
