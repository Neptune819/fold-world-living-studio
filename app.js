import {createWorlds} from "./enchanted-world.js?v=5.8.1";
import {setupInteraction} from "./exploration.js?v=5.7";
import * as T from "./vendor/three.module.js";
import { buildLucy, enrichWorlds } from "./art-direction.js?v=5.6";
import { detailedColumn, detailPlaza } from "./plaza-detail.js?v=5.6";
import {setupViewControls} from './view-controls.js?v=5.8';
import {setupSoundscape} from './soundscape.js?v=5.6';
import {sampleLakeVoyage} from './lake-voyage.js?v=5.7';
import {refinePlazaCraft} from './plaza-craft.js?v=5.8';
import {balanceShadowCasters} from './shadow-budget.js?v=5.8';
import {consolidateRigidCharacter} from './character-batching.js?v=5.8.1';

const $ = (s) => document.querySelector(s),
  clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
const renderer = new T.WebGLRenderer({
  antialias: true,
  alpha: true,
  stencil: true,
  powerPreference: "high-performance",
});
renderer.setClearColor(0xdedbd0, 0);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.autoClear = false;
renderer.info.autoReset = false;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
$("#stage").append(renderer.domElement);
const camera = new T.PerspectiveCamera(40, innerWidth / innerHeight, 0.08, 350);
const cream = new T.MeshStandardMaterial({ color: 0xe6dfc9, roughness: 0.7 });
const stone = new T.MeshStandardMaterial({ color: 0xb9b6a2, roughness: 0.86 });
const silver = new T.MeshStandardMaterial({
  color: 0xc5d0cc,
  metalness: 1,
  roughness: 0.19,
});
const dark = new T.MeshStandardMaterial({
  color: 0x313f3b,
  metalness: 0.7,
  roughness: 0.35,
});
const red = new T.MeshStandardMaterial({
  color: 0x9f3027,
  metalness: 0.35,
  roughness: 0.36,
});
const gold = new T.MeshStandardMaterial({
  color: 0xac8b4f,
  metalness: 0.8,
  roughness: 0.3,
});
const light = new T.MeshStandardMaterial({
  color: 0xffefbc,
  emissive: 0xffd591,
  emissiveIntensity: 1.7,
});
const leaf = new T.MeshStandardMaterial({
  color: 0x4d6845,
  roughness: 0.7,
  side: T.DoubleSide,
});
const leaf2 = new T.MeshStandardMaterial({
  color: 0x83946b,
  roughness: 0.7,
  side: T.DoubleSide,
});
const glass = new T.MeshPhysicalMaterial({
  color: 0xa9c4b8,
  metalness: 0.2,
  roughness: 0.08,
  transparent: true,
  opacity: 0.28,
  side: T.DoubleSide,
  depthWrite: false,
});
const sphereG = new T.SphereGeometry(1, 24, 16),
  boxG = new T.BoxGeometry(1, 1, 1),
  cylG = new T.CylinderGeometry(1, 1, 1, 48);
function mesh(g, m, p, pos = [0, 0, 0], scale = [1, 1, 1]) {
  const o = new T.Mesh(g, m);
  o.position.set(...pos);
  o.scale.set(...scale);
  o.castShadow = !m.transparent;
  o.receiveShadow = true;
  p.add(o);
  return o;
}
function box(p, m, pos, size) {
  return mesh(boxG, m, p, pos, size);
}
function ball(p, m, pos, size) {
  return mesh(sphereG, m, p, pos, size);
}
function cyl(p, m, pos, r, h) {
  return mesh(cylG, m, p, pos, [r, h, r]);
}
function ring(p, m, pos, r, t = 0.08) {
  return mesh(new T.TorusGeometry(r, t, 10, 72), m, p, pos);
}
function rod(p, m, a, b, r) {
  const start = new T.Vector3(...a),
    end = new T.Vector3(...b),
    d = end.clone().sub(start);
  const o = mesh(
    cylG,
    m,
    p,
    start.clone().add(end).multiplyScalar(0.5).toArray(),
    [r, d.length(), r],
  );
  o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  return o;
}
// Procedural studio environment supplies real reflections without a remote HDR dependency.
const studio = new T.Scene();
studio.background = new T.Color(0x727e79);
for (const [pos, size, color, intensity] of [
  [[0, 16, 0], [35, 1, 30], 0xfff5dc, 5],
  [[-14, 5, 2], [1, 18, 22], 0xffffff, 4],
  [[12, 4, 0], [1, 15, 18], 0xe0ecf5, 3],
  [[0, 5, -16], [24, 15, 1], 0x252d2b, 1],
])
  box(
    studio,
    new T.MeshBasicMaterial({
      color: new T.Color(color).multiplyScalar(intensity),
    }),
    pos,
    size,
  );
const pmrem = new T.PMREMGenerator(renderer);
const env = pmrem.fromScene(studio, 0.03).texture;
pmrem.dispose();
const scenes = [],
  roots = [],
  portals = [],
  portalRotors = [],
  heads = [],
  arms = [];
function world(index) {
  const scene = new T.Scene();
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  scene.fog = new T.Fog(0xdedbd0, 45, 125);
  const root = new T.Group();
  root.position.z = -28 * index;
  scene.add(root);
  scene.add(new T.HemisphereLight(0xfff5df, 0x586957, 1.6));
  const sun = new T.DirectionalLight(0xffe6bf, 3);
  sun.position.set(-10, 22, 14 - 28 * index);
  sun.target.position.set(0, 0, -28 * index);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -20,
    right: 20,
    top: 20,
    bottom: -20,
    near: 1,
    far: 75,
  });
  sun.shadow.normalBias = 0.035;
  scene.add(sun, sun.target);
  const rim = new T.DirectionalLight(0xd4e9ed, 2);
  rim.position.set(12, 8, -10);
  scene.add(rim);
  scenes.push(scene);
  roots.push(root);
  return root;
}
function label(parent, text, pos, size = 1.2, color = "#9f3027") {
  // Keep the exploration view free of oversized scene captions.
  return new T.Group();
}
function floor(root) {
  cyl(root, stone, [0, -0.6, 0], 11.8, 1.15);
  cyl(root, cream, [0, 0.02, 0], 11.5, 0.12);
  cyl(root, dark, [0, -1.18, 0], 10.9, 0.15);
  for (const radius of [3, 7, 10.8]) {
    const r = ring(root, gold, [0, 0.095, 0], radius, 0.025);
    r.rotation.x = -Math.PI / 2;
  }
  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI) / 16;
    const o = box(
      root,
      i % 4 === 0 ? red : stone,
      [10.2 * Math.cos(a), 0.1, 10.2 * Math.sin(a)],
      [0.06, 0.02, 0.65],
    );
    o.rotation.y = -a + Math.PI / 2;
  }
  box(root, cream, [0, -0.08, -11.3], [8, 0.3, 6]);
}
function column(root, x, z, h = 7) {
  if (root === roots[0]) return detailedColumn(root, x, z, h, artHelpers);
  cyl(root, stone, [x, 0.2, z], 0.65, 0.4);
  cyl(root, cream, [x, h / 2, z], 0.34, h);
  cyl(root, gold, [x, h - 0.3, z], 0.38, 0.2);
  cyl(root, cream, [x, h, z], 0.65, 0.35);
  for (let j = 0; j < 6; j++) {
    let a = (j * Math.PI) / 3;
    rod(
      root,
      stone,
      [x + 0.34 * Math.cos(a), 0.5, z + 0.34 * Math.sin(a)],
      [x + 0.34 * Math.cos(a), h - 0.6, z + 0.34 * Math.sin(a)],
      0.025,
    );
  }
}
function portal(root, index) {
  const frame = new T.Group();
  frame.position.set(0, 4.4, -14);
  root.add(frame);
  ring(frame, cream, [0, 0, 0], 4.55, 0.42);
  ring(frame, dark, [0, 0, 0.15], 4.16, 0.13);
  ring(frame, light, [0, 0, 0.32], 4.25, 0.045);
  const rot = new T.Group();
  frame.add(rot);
  for (let j = 0; j < 12; j++) {
    let a = (j * Math.PI) / 6;
    const o = box(
      rot,
      j % 3 === 0 ? red : gold,
      [4.6 * Math.cos(a), 4.6 * Math.sin(a), 0.35],
      [0.25, 0.8, 0.18],
    );
    o.rotation.z = a - Math.PI / 2;
  }
  portalRotors.push(rot);
  for (let j = 1; j < 4; j++)
    ring(frame, j % 2 ? gold : cream, [0, 0, -j * 0.55], 4.3, 0.085);
  box(root, cream, [-5, 3.1, -14], [0.7, 6.2, 1.2]);
  box(root, cream, [5, 3.1, -14], [0.7, 6.2, 1.2]);
  label(
    root,
    index === 0 ? "02 / BOTANICA" : "03 / NUCLEUS",
    [0, 9.6, -14],
    0.6,
  );
  const maskScene = new T.Scene();
  const mask = mesh(
    new T.CircleGeometry(4.13, 96),
    new T.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
      side: T.DoubleSide,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: T.AlwaysStencilFunc,
      stencilZPass: T.ReplaceStencilOp,
    }),
    maskScene,
  );
  portals.push({ frame, mask, scene: maskScene });
}
const plaza = world(0);
floor(plaza);
const artHelpers = {
  box,
  ball,
  cyl,
  rod,
  ring,
  mesh,
  silver,
  dark,
  gold,
  cream,
  stone,
  red,
  light,
  leaf,
  leaf2,
  heads,
  arms,
};
const character=buildLucy(plaza, artHelpers);
const characterBatching=consolidateRigidCharacter(character,heads,arms);
portal(plaza, 0);
for (let i = 0; i < 11; i++) {
  const a = Math.PI * 0.07 + i * Math.PI * 0.086;
  const x = 9.4 * Math.cos(a),
    z = -9.4 * Math.sin(a);
  if (Math.abs(x) < 2) continue;
  column(plaza, x, z, 6.9);
  const crown = box(plaza, cream, [x, 7.2, z], [2.6, 0.6, 1.3]);
  crown.rotation.y = -a + Math.PI / 2;
}
for (const side of [-1, 1]) {
  box(plaza, cream, [side * 7, 1.3, 2.5], [2.2, 2.6, 2.2]);
  const g = new T.Group();
  g.position.set(side * 7, 3.7, 2.5);
  plaza.add(g);
  ring(g, gold, [0, 0, 0], 1.25, 0.1).rotation.y = side * 0.4;
  ball(g, silver, [0, 0, 0], [0.55, 0.55, 0.55]);
  box(plaza, red, [side * 7, 1.4, 3.62], [1.3, 0.06, 0.02]);
}
label(plaza, "М И Р", [0, 7.8, -8.8], 1);
label(plaza, "UTOPIA / 01", [0, 0.45, 10.5], 0.48);
const garden = world(1);
floor(garden);
portal(garden, 1);
for (let i = 0; i < 7; i++) {
  const z = 7 - i * 3;
  for (const side of [-1, 1]) column(garden, side * 7, z, 6.6);
  const arch = mesh(new T.TorusGeometry(7,.1,10,64,Math.PI),cream,garden,[0,6.6,z]);
  arch.scale.y = 0.7;
  box(garden, gold, [0, 11.5, z], [0.1, 0.1, 1]);
}
let seed = 37;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
for (let i = 0; i < 40; i++) {
  const side = i % 2 ? 1 : -1,
    x = side * (3 + rand() * 6),
    z = 9 - rand() * 20,
    h = 1.5 + rand() * 3.4;
  const a = [x, 0.3, z],
    b = [x + rand() - 0.5, h, z];
  rod(garden, gold, a, b, 0.045);
  cyl(garden, stone, [x, 0.23, z], 0.42, 0.46);
  for (let j = 0; j < 5; j++) {
    const theta = rand() * Math.PI * 2;
    const o = ball(
      garden,
      j % 2 ? leaf : leaf2,
      [
        x + Math.cos(theta) * 0.6,
        h * (0.35 + j * 0.13),
        z + Math.sin(theta) * 0.6,
      ],
      [0.19, 0.7, 0.07],
    );
    o.rotation.set(0.4 + rand(), theta, Math.sin(theta) * 0.8);
  }
}
for (let i = 0; i < 8; i++) {
  const angle = i * 0.8;
  ball(
    garden,
    red,
    [Math.sin(angle) * 6, 2 + i * 0.35, -4 + Math.cos(angle) * 3],
    [0.15, 0.15, 0.15],
  );
}
label(garden, "BOTANICA", [0, 9.8, -4], 0.7);
const lab = world(2);
floor(lab);
const core = new T.Group();
core.position.set(0, 4, -3);
lab.add(core);
const nucleus = ball(core, silver, [0, 0, 0], [1.5, 1.5, 1.5]);
const coreRings = [];
for (let i = 0; i < 3; i++) {
  const r = ring(core, i === 1 ? red : gold, [0, 0, 0], 2.2 + i * 0.5, 0.09);
  r.rotation.set(i * 0.6, 0.3 + i * 0.8, 0);
  coreRings.push(r);
}
cyl(lab, dark, [0, 0.4, -3], 2.6, 0.8);
cyl(lab, light, [0, 0.84, -3], 2.2, 0.035);
for (const side of [-1, 1])
  for (let i = 0; i < 4; i++) {
    const x = side * 6,
      z = 6 - i * 4;
    cyl(lab, dark, [x, 0.4, z], 0.95, 0.8);
    cyl(lab, glass, [x, 3, z], 0.8, 4.8);
    cyl(lab, silver, [x, 5.5, z], 0.95, 0.3);
    ball(lab, silver, [x, 3, z], [0.38, 1.1, 0.38]);
    rod(lab, red, [x, 1, z], [x, 5, z], 0.07);
    rod(lab, silver, [x, 0.3, z], [side * 9, 0.3, z], 0.12);
  }
for (let i = 0; i < 9; i++) {
  const a = (i * Math.PI) / 8;
  if (i === 4) continue;
  column(lab, 10 * Math.cos(a), -10 * Math.sin(a), 9);
}
label(lab, "СЕРДЦЕ", [0, 9, -8], 0.85);
label(lab, "THE HEART OF THE SYSTEM", [0, 7.9, -8], 0.4);

const scenery = enrichWorlds(scenes, roots, artHelpers);
const detail = detailPlaza(roots, scenes, portals, scenery, artHelpers);
await refinePlazaCraft(plaza,artHelpers);
core.userData.dynamic=true;
character.userData.dynamic=true;
const worlds=await createWorlds(roots,scenes,portals,{...artHelpers,glass,scenery,detail,core,nucleus,coreRings,character});
const shadowBudget=balanceShadowCasters(roots,[character]);
let paused=false,currentWorld=0;
for(const obj of scenes[2].children){if(obj.isLight)obj.position.z-=28;if(obj.target)obj.target.position.z-=28;}
const ui=await setupInteraction({renderer,camera,character,plaza,roots,portals,worlds,getState:()=>({world:currentWorld,reduced,progress,target}),onPause:value=>{paused=value;}});
const sound=setupSoundscape();
if(new URLSearchParams(location.search).has('debug'))window.foldAudio={get state(){return sound.state;}};
const axis = new T.Vector3(0, 1, 0),
  look = new T.Vector3(),
  pos = new T.Vector3();
const keys = [
  { s: 7, p: [19, 15, 34], l: [0, 2, 0] },
  { s: 9, p: [0, 4.4, -5], l: [0, 4.4, -18] },
  { s: 11, p: [0, 1.15, -21], l: [0, 1.29, -33] },
  { s: 11.6, p: [0, 4.4, -21], l: [4, 4.4, -28] },
  { s: 12.25, p: [4, 6.4, -28], l: [0, 6.4, -37] },
  { s: 12.65, p: [4, 6.4, -28], l: [0, 6.4, -37] },
  { s: 13.35, p: [0, 8.4, -37], l: [0, 8.4, -45] },
  { s: 14, p: [0, 1.15, -65], l: [0, 1.29, -77] },
  { s: 15.45, p: [0, 4.6, -70.2], l: [0, 4.6, -82] },
  { s: 16, p: [0, 9.2, -71.2], l: [0, 7.3, -87] },
  { s: 19, p: [0, 9.5, -71.5], l: [0, 7.2, -87] },
];
// Shared keyframes make any scroll position independently reproducible, including reverse jumps.
function sample(s) {
  if(s>=11 && s<=14){sampleLakeVoyage(s,pos,look);return;}
  if (s <= 7) {
    pos.set(...keys[0].p);
    look.set(...keys[0].l);
    return;
  }
  let i = 0;
  while (i < keys.length - 2 && s > keys[i + 1].s) i++;
  const a = keys[i],
    b = keys[i + 1],
    t = smooth((s - a.s) / (b.s - a.s));
  pos.fromArray(a.p).lerp(new T.Vector3(...b.p), t);
  look.fromArray(a.l).lerp(new T.Vector3(...b.l), t);
}
let reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
  manualMotion = false,
  scrollHeight = innerHeight,
  target = scrollY / innerHeight,
  progress = target;
const view=setupViewControls({renderer,camera,roots,worlds,getState:()=>({world:currentWorld,progress,reduced,opened:ui.opened})});
const startScene=Number(new URLSearchParams(location.search).get('start'));
if(Number.isFinite(startScene)&&startScene>0){progress=target=clamp(startScene,0,19);scrollTo(0,innerHeight*target);}
if(new URLSearchParams(location.search).has('debug'))window.foldView={get state(){return view.state;},get environment(){return worlds.environmentState;},get shadowBudget(){return shadowBudget;},get characterBatching(){return characterBatching;},get camera(){return{position:camera.position.toArray(),fov:camera.fov};},groundHit:(x,y)=>view.groundHit(x,y)};
const media = matchMedia("(prefers-reduced-motion: reduce)");
function motionUI() {
  $("#motion").setAttribute("aria-pressed", String(reduced));
  $("#motion span").textContent = reduced ? "●" : "○";
}
media.addEventListener("change", (e) => {
  if (!manualMotion) {
    reduced = e.matches;
    motionUI();
  }
});
motionUI();
$("#motion").addEventListener("click", () => {
  manualMotion = true;
  reduced = !reduced;
  motionUI();
});
addEventListener(
  "scroll",
  () => {
    // Ignore the browser's interim scroll adjustment while the viewport changes.
    if (innerHeight !== scrollHeight || paused) return;
    target = clamp(scrollY / scrollHeight, 0, 19);
  },
  { passive: true },
);
for (const button of document.querySelectorAll("[data-jump]"))
  button.addEventListener("click", () =>
    scrollTo({
      top: Number(button.dataset.jump) * scrollHeight,
      behavior: "instant",
    }),
  );
addEventListener("resize", () => {
  const ratio = target;
  scrollHeight = innerHeight;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  scrollTo({ top: ratio * scrollHeight, behavior: "instant" });
  target = ratio;
});
let lost = false;
renderer.domElement.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  lost = true;
  $("#error").hidden = false;
  $("#error-text").textContent = "图形设备连接中断，请重新加载场景。";
});
const materials = new Set();
for (const scene of scenes)
  scene.traverse((o) => {
    if (o.material) materials.add(o.material);
  });
for(const bg of worlds.backgrounds)materials.add(bg.quad.material);
$("#diagnostics").hidden=!new URLSearchParams(location.search).has("debug");
function stencil(enabled, reference = 1) {
  for (const m of materials) {
    m.stencilWrite = enabled;
    m.stencilRef = reference;
    m.stencilFunc = T.EqualStencilFunc;
    m.stencilFail = T.KeepStencilOp;
    m.stencilZFail = T.KeepStencilOp;
    m.stencilZPass = T.KeepStencilOp;
  }
}
function renderWorld(index) {
  renderer.clear(true, true, true);
  stencil(false);
  renderer.render(worlds.backgrounds[index].scene,worlds.backgroundCamera);
  if(index===0){renderer.render(scenery.atmosphere,camera);renderer.clearDepth();}
  renderer.render(scenes[index],camera);
  worlds.drawTransit(renderer);
}
const labels = ["01 — 纪念广场", "02 — 失序植物园", "03 — 机械之心"];
let environmentTime = 0;
addEventListener("visibilitychange", () => {
  previous = performance.now();
});
let previous = performance.now(),
  frames = 0,
  elapsed = 0,
  fps = 60,
  lastWorld = -1,
  lastPhase = "",
  pixelRatio = renderer.getPixelRatio();
let previousProgress=progress,scrollSpeed=0,rowingForward=false,rowingBack=false,rowingHintShown=false;
addEventListener('keydown',e=>{
  if(currentWorld!==1||paused||e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('button,a,input,textarea,select,[role=button],[role=slider],[contenteditable],dialog'))return;
  if(e.code==='KeyW'||e.code==='ArrowUp'){rowingForward=true;e.preventDefault();}
  if(e.code==='KeyS'||e.code==='ArrowDown'){rowingBack=true;e.preventDefault();}
});
addEventListener('keyup',e=>{if(e.code==='KeyW'||e.code==='ArrowUp')rowingForward=false;if(e.code==='KeyS'||e.code==='ArrowDown')rowingBack=false;});
addEventListener('blur',()=>{rowingForward=rowingBack=false;});
addEventListener('focusin',e=>{if(e.target.closest?.('button,a,input,textarea,select,[role=button],[role=slider],[contenteditable],dialog'))rowingForward=rowingBack=false;});
renderer.domElement.tabIndex=-1;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button===0&&!ui.opened)renderer.domElement.focus({preventScroll:true});});
addEventListener('visibilitychange',()=>{if(document.hidden)rowingForward=rowingBack=false;});
function frame(now) {
  if (lost) return;
  const realDt = (now - previous) / 1000;
  const dt = Math.min(realDt, 0.1);
  previous = now;
  if(currentWorld===1&&!paused&&(rowingForward||rowingBack)){
    target=clamp(target+(Number(rowingForward)-Number(rowingBack))*dt*.27,0,19);
    scrollTo(0,target*scrollHeight);
  }
  if(!paused) progress += (target - progress) * (reduced ? 1 : 1 - Math.exp(-dt * 13));
  if (!paused && Math.abs(target - progress) < 0.0001) progress = target;
  if (!document.hidden && !reduced) environmentTime += dt;
  const s = progress,
    t = environmentTime;
  const velocity=(progress-previousProgress)/Math.max(dt,.001);previousProgress=progress;
  scrollSpeed+=(velocity-scrollSpeed)*(1-Math.exp(-dt*8));
  detail.update(t, s, reduced);
  plaza.quaternion.setFromAxisAngle(
    axis,
    reduced ? 0 : clamp(s / 7) * Math.PI * 2,
  );
  garden.quaternion.copy(plaza.quaternion);
  garden.position.set(0, 0, -28).applyQuaternion(plaza.quaternion);
  lab.quaternion.copy(plaza.quaternion);
  lab.position.set(0, 4, -84).applyQuaternion(plaza.quaternion);
  heads[0].rotation.y = reduced ? 0 : Math.sin(t * 0.45) * 0.09;
  for (const { arm, side } of arms)
    arm.rotation.z = reduced ? 0 : side * (0.035 + Math.sin(t * 0.5) * 0.025);
  core.position.y = 4 + (reduced ? 0 : Math.sin(t * 0.6) * 0.12);
  coreRings.forEach((r, i) => {
    r.rotation.z = reduced ? 0 : t * 0.09 * (i % 2 ? 1 : -1);
  });
  scenery.particles.rotation.y = reduced ? 0 : Math.sin(t * 0.025) * 0.03;
  sample(s);
  const worldIndex=pos.z < -70 ? 2 : pos.z < -14 ? 1 : 0;
  currentWorld=worldIndex;
  if(worldIndex===1&&!rowingHintShown){rowingHintShown=true;const hint=$('#hint');hint.textContent='滚轮划船 · W 前进 / S 后退 · 点击两岸物件';hint.hidden=false;setTimeout(()=>{hint.hidden=true;},5500);}
  // Keep the heavier material gallery within its measured pixel budget. HTML
  // remains at native resolution; only the WebGL drawing buffer is adjusted.
  const pixelBudget=worldIndex===2?1500000:worldIndex===1?1650000:1850000;
  const renderRatio=Math.min(devicePixelRatio,1.5,Math.max(.78,Math.sqrt(pixelBudget/(innerWidth*innerHeight))));
  if(Math.abs(renderer.getPixelRatio()-renderRatio)>.01){renderer.setPixelRatio(renderRatio);renderer.setSize(innerWidth,innerHeight);pixelRatio=renderRatio;}
  const viewing=view.update(dt,{world:worldIndex,progress:s,reduced,opened:ui.opened});
  pos.y+=viewing.height;look.y+=viewing.height*(worldIndex===2?.25:.65);
  camera.position.copy(pos);
  if(viewing.yaw){camera.position.sub(look).applyAxisAngle(axis,viewing.yaw).add(look);}
  const baseFov=worldIndex===2?46:worldIndex===1?52:40;
  // A narrow desktop panel still fits the scene's important horizontal span.
  const desiredFov=Math.min(82,2*T.MathUtils.radToDeg(Math.atan(Math.tan(T.MathUtils.degToRad(baseFov)/2)*Math.max(1,1.5/camera.aspect))));
  if(Math.abs(camera.fov-desiredFov)>.001){camera.fov=desiredFov;camera.updateProjectionMatrix();}
  camera.up.set(0, 1, 0);
  camera.lookAt(look);
  if(worldIndex===1&&s>=11&&s<=14&&!reduced){camera.position.y+=Math.sin(t*.92)*.006;camera.rotateZ(Math.sin(t*.63)*.002);}
  // Unwrapped angles: never interpolate quaternions through the shorter return arc.
  const orbitDegrees = reduced ? 0 : clamp(s / 7) * 360;
  let roll = reduced
    ? 0
    : 2 * Math.PI * (smooth((s - 9) / 2) + smooth((s - 14) / 2));
  camera.rotateZ(roll);
  worlds.backgrounds[0].quad.rotation.z=-roll;
  const aspect=innerWidth/innerHeight;
  worlds.backgrounds[0].quad.scale.setScalar(1.02*(Math.abs(Math.cos(roll))+Math.max(aspect,1/aspect)*Math.abs(Math.sin(roll))));
  portalRotors.forEach((r, i) => {
    r.rotation.z = reduced ? 0 : t * (0.035 + i * 0.005);
  });
  scenes[worldIndex].updateMatrixWorld(true);camera.updateMatrixWorld(true);
  worlds.update(t,s,reduced,ui.hovered,camera,scrollSpeed);
  ui.update(now,t);
  sound.update(worldIndex,ui.opened);
  renderer.info.reset();
  renderWorld(worldIndex);
  document.querySelectorAll('.worlds button').forEach((b,i)=>{b.classList.toggle('active',i===worldIndex);b.setAttribute('aria-current',i===worldIndex?'true':'false');});
  frames++;
  elapsed += realDt;
  if (elapsed >= 1) {
    fps = Math.round(frames / elapsed);
    frames = 0;
    elapsed = 0;
    $("#metrics").textContent =
      `${fps} FPS · ${innerWidth} × ${innerHeight}\n进度 ${s.toFixed(3)} / 19 · 世界 ${worldIndex + 1}\n箱庭 ${orbitDegrees.toFixed(1)}° · 穿门累计 ${((roll * 180) / Math.PI).toFixed(1)}° · 像素比 ${pixelRatio}\n月海泛舟 · 镜头 Z ${camera.position.z.toFixed(2)}\n绘制 ${renderer.info.render.calls} · 三角形 ${renderer.info.render.triangles}\n${reduced ? "减少动态" : "完整动态"} · 环境 ${t.toFixed(1)}s`;
  }
  requestAnimationFrame(frame);
}
renderer.compile(scenes[0], camera);
$("#loading").hidden = true;
requestAnimationFrame(frame);

