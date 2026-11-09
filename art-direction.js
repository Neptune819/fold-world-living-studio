import * as T from "./vendor/three.module.js";

// Sculpted surfaces stay three dimensional from every angle; no billboard character.
export function buildLucy(root, h) {
  const {
    ball,
    box,
    cyl,
    ring,
    rod,
    mesh,
    silver,
    dark,
    gold,
    cream,
    heads,
    arms,
  } = h;
  const coat = new T.MeshStandardMaterial({
    color: 0x182725,
    roughness: 0.63,
    side: T.DoubleSide,
  });
  const weave=document.createElement('canvas');weave.width=weave.height=128;
  const weaveContext=weave.getContext('2d');weaveContext.fillStyle='#858585';weaveContext.fillRect(0,0,128,128);
  for(let i=0;i<128;i+=4){weaveContext.fillStyle=i%8?'#979797':'#737373';weaveContext.fillRect(i,0,1,128);weaveContext.fillStyle='#7b7b7b';weaveContext.fillRect(0,i,128,1);}
  const weaveMap=new T.CanvasTexture(weave);weaveMap.wrapS=weaveMap.wrapT=T.RepeatWrapping;weaveMap.repeat.set(12,24);coat.bumpMap=weaveMap;coat.bumpScale=.009;coat.roughness=.82;
  const fur = new T.MeshStandardMaterial({ color: 0xd8d2ba, roughness: 1 });
  const chrome = new T.MeshStandardMaterial({
    color: 0xced8d6,
    metalness: 1,
    roughness: 0.22,
  });
  const g = new T.Group();
  g.position.set(-0.7, 0.6, 1);
  g.scale.setScalar(1.35);
  root.add(g);
  cyl(root, dark, [-0.7, 0.18, 1], 1.95, 0.36);
  cyl(root, gold, [-0.7, 0.4, 1], 1.88, 0.08);
  cyl(root, cream, [-0.7, 0.51, 1], 1.8, 0.14);
  function lathe(points, mat, parent, pos, depth = 1) {
    const o = mesh(
      new T.LatheGeometry(
        points.map((p) => new T.Vector2(...p)),
        48,
      ),
      mat,
      parent,
      pos,
    );
    o.scale.z = depth;
    return o;
  }
  function tube(parent, mat, points, r = 0.03) {
    return mesh(
      new T.TubeGeometry(
        new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
        32,
        r,
        7,
        false,
      ),
      mat,
      parent,
    );
  }
  lathe(
    [
      [0.32, 0],
      [0.48, 0.2],
      [0.4, 0.45],
      [0.31, 0.68],
      [0.33, 0.95],
      [0.49, 1.28],
      [0.56, 1.48],
      [0.47, 1.7],
      [0.22, 1.87],
    ],
    chrome,
    g,
    [0, 2.8, 0],
    0.68,
  );
  ball(g, chrome, [-0.23, 4.13, 0.18], [0.3, 0.28, 0.2]);
  ball(g, chrome, [0.23, 4.13, 0.18], [0.3, 0.28, 0.2]);
  for (let i = 0; i < 5; i++) {
    const a = ring(
      g,
      i % 2 ? dark : silver,
      [0, 3.0 + i * 0.15, 0],
      0.36,
      0.027,
    );
    a.rotation.x = Math.PI / 2;
    a.scale.y = 0.74;
  }
  cyl(g, dark, [0, 4.76, 0], 0.13, 0.4);
  for (let i = 0; i < 4; i++)
    cyl(g, silver, [0, 4.63 + i * 0.08, 0], 0.18, 0.035);
  const head = new T.Group();
  head.position.set(0, 5.28, 0);
  g.add(head);
  heads.push(head);
  lathe(
    [
      [0.04, -0.48],
      [0.22, -0.4],
      [0.32, -0.2],
      [0.36, 0.06],
      [0.34, 0.3],
      [0.25, 0.47],
      [0.06, 0.52],
    ],
    chrome,
    head,
    [0, 0, 0],
    0.83,
  );
  tube(
    head,
    dark,
    [
      [-0.32, 0, 0.16],
      [-0.2, -0.035, 0.3],
      [0, -0.05, 0.32],
      [0.2, -0.035, 0.3],
      [0.32, 0, 0.16],
    ],
    0.039,
  );
  tube(
    head,
    gold,
    [
      [-0.3, 0, 0.18],
      [-0.16, -0.025, 0.325],
      [0, -0.04, 0.344],
      [0.16, -0.025, 0.325],
      [0.3, 0, 0.18],
    ],
    0.014,
  );
  // Overlapping swept metal locks describe Lucy's sculpted, asymmetric bob.
  for (let i = 0; i < 15; i++) {
    let a = (i / 15) * Math.PI * 2;
    const x = Math.sin(a),
      z = Math.cos(a);
    tube(
      head,
      i % 3 ? chrome : dark,
      [
        [x * 0.18, 0.48, z * 0.18],
        [x * 0.36, 0.44, z * 0.32],
        [x * 0.44, 0.18, z * 0.37],
        [x * 0.41, -0.11, z * 0.37],
      ],
      0.055,
    );
  }
  for (let i = 0; i < 5; i++)
    tube(
      head,
      chrome,
      [
        [-0.28 + i * 0.08, 0.49, 0.12],
        [-0.1 + i * 0.065, 0.43, 0.35],
        [-0.27 + i * 0.06, 0.2, 0.4],
        [-0.36 + i * 0.025, 0.1, 0.27],
      ],
      0.06,
    );
  for (const side of [-1, 1]) {
    ball(head, gold, [side * 0.355, -0.08, 0], [0.045, 0.1, 0.1]);
    const knee = [side * 0.3, 1.48, side * 0.08],
      hip = [side * 0.27, 2.85, 0],
      ankle = [side * 0.29, 0.25, side * 0.09];
    rod(g, dark, hip, ankle, 0.1);
    rod(g, chrome, hip, knee, 0.23);
    ball(g, dark, knee, [0.19, 0.19, 0.18]);
    ball(
      g,
      gold,
      [side * 0.3, 1.48, 0.16 + side * 0.08],
      [0.105, 0.105, 0.035],
    );
    rod(g, chrome, knee, ankle, 0.135);
    rod(g, gold, [side * 0.42, 2.48, -0.03], [side * 0.39, 1.65, -0.03], 0.027);
    rod(g, gold, [side * 0.35, 1.32, -0.1], [side * 0.35, 0.4, -0.1], 0.025);
    ball(
      g,
      chrome,
      [side * 0.29, 0.17, 0.16 + side * 0.09],
      [0.16, 0.15, 0.34],
    );
    box(g, dark, [side * 0.29, 0.08, -0.08 + side * 0.09], [0.13, 0.16, 0.12]);
    const arm = new T.Group();
    arm.position.set(side * 0.57, 4.4, 0);
    g.add(arm);
    const elbow = [side * 0.52, -0.94, 0.23],
      wrist = side === 1 ? [-0.42, 0.28, 0.45] : [0.62, -1.24, 0.54];
    ball(arm, gold, [0, 0, 0], [0.21, 0.21, 0.21]);
    rod(arm, chrome, [0, 0, 0], elbow, 0.16);
    ball(arm, dark, elbow, [0.15, 0.15, 0.15]);
    rod(arm, chrome, elbow, wrist, 0.13);
    ball(arm, chrome, wrist, [0.13, 0.17, 0.07]);
    for (let f = 0; f < 4; f++) {
      const start = [wrist[0] - 0.09 + f * 0.055, wrist[1], wrist[2] + 0.045],
        end = [start[0], start[1] + 0.25, start[2] + 0.035];
      rod(arm, chrome, start, end, 0.023);
      ball(
        arm,
        dark,
        [start[0], start[1] + 0.13, start[2] + 0.02],
        [0.025, 0.025, 0.025],
      );
    }
    arms.push({ arm, side });
  }
  // An open draped coat, with curved panels and a folded hem, instead of a rigid cone.
  const vertices = [],
    uv = [],
    indices = [],
    rows = 24,
    cols = 56;
  for (let y = 0; y <= rows; y++) {
    const v = y / rows,
      yy = 0.52 + v * 4.08,
      r = 1.12 - 0.28 * v + 0.13 * Math.sin(v * Math.PI);
    for (let j = 0; j <= cols; j++) {
      const u = j / cols,
        a = 0.75 + u * (Math.PI * 2 - 1.5),
        fold = 0.045 * Math.sin(a * 12) * (1 - v);
      vertices.push(
        Math.sin(a) * (r + fold),
        yy + 0.05 * Math.cos(a * 8) * (1 - v),
        Math.cos(a) * (r * 0.55 + fold) - 0.15,
      );
      uv.push(u, v);
      if (y < rows && j < cols) {
        const n = y * (cols + 1) + j;
        indices.push(n, n + 1, n + cols + 1, n + 1, n + cols + 2, n + cols + 1);
      }
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  mesh(geo, coat, g);
  for (const side of [-1, 1]) {
    tube(
      g,
      gold,
      [
        [side * 0.62, 4.56, 0.25],
        [side * 0.71, 3.5, 0.26],
        [side * 0.83, 2, 0.31],
        [side * 0.78, 0.55, 0.31],
      ],
      0.018,
    );
    for (let i = 0; i < 30; i++) {
      const t = i / 29;
      const o = ball(
        g,
        fur,
        [
          side * (0.46 + 0.35 * Math.sin(t * Math.PI * 0.65)),
          4.66 - t * 1.75,
          0.28 + 0.07 * Math.sin(t * 5),
        ],
        [0.17, 0.095, 0.14],
      );
      o.rotation.z = side * 0.45;
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 11) * Math.PI;
      ball(
        g,
        fur,
        [side * (0.27 + (0.61 * i) / 11), 4.68 + 0.12 * Math.sin(a), -0.13],
        [0.14, 0.11, 0.24],
      );
    }
    ball(g, gold, [side * 0.84, 4.24, -0.01], [0.1, 0.1, 0.035]);
  }
  tube(
    g,
    gold,
    [
      [-0.32, 4.51, 0.27],
      [0, 3.77, 0.39],
      [0.4, 4.5, 0.25],
    ],
    0.027,
  );
  ring(g, gold, [0, 3.67, 0.4], 0.07, 0.02);
  rod(g, gold, [0, 3.6, 0.4], [0, 3.3, 0.4], 0.025);
  box(g, gold, [0.065, 3.34, 0.4], [0.14, 0.045, 0.045]);
  return g;
}

export function enrichWorlds(scenes, roots, h) {
  const {
    box,
    ball,
    cyl,
    rod,
    ring,
    mesh,
    cream,
    stone,
    dark,
    gold,
    red,
    light,
    leaf,
    leaf2,
  } = h;
  let seed = 871;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  // Stone pores and seams alter highlights, rather than adding a uniform flat color.
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#bcb9ad";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16000; i++) {
    const v = 145 + Math.floor(rand() * 75);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rand() * 256, rand() * 256, 1 + rand() * 2, 1);
  }
  const texture = new T.CanvasTexture(c);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(4, 4);
  cream.bumpMap = texture;
  cream.bumpScale = 0.035;
  stone.bumpMap = texture;
  stone.bumpScale = 0.06;
  cream.roughness = 0.52;
  for (let n = 0; n < 3; n++) {
    const root = roots[n];
    for (let i = 0; i < 80; i++) {
      const a = (i / 80) * Math.PI * 2;
      const p = [11.72 * Math.cos(a), -0.6, 11.72 * Math.sin(a)];
      const panel = box(
        root,
        i % 10 === 0 ? gold : stone,
        p,
        [0.035, 0.65, 0.32],
      );
      panel.rotation.y = -a;
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + 0.2;
      if (Math.sin(a) < -0.7) continue;
      const x = 10.4 * Math.cos(a),
        z = 10.4 * Math.sin(a);
      cyl(root, dark, [x, 0.6, z], 0.07, 1.2);
      ball(root, light, [x, 1.3, z], [0.14, 0.14, 0.14]);
      ring(root, gold, [x, 1.3, z], 0.24, 0.025).rotation.x = Math.PI / 2;
    }
    // Outlying islands and observatories frame each diorama without filling its route.
    for (const side of [-1, 1]) {
      const island = new T.Group();
      island.position.set(side * 19, -4, -5);
      root.add(island);
      cyl(island, stone, [0, -0.3, 0], 3.2, 0.6);
      cyl(island, dark, [0, -0.8, 0], 2.65, 0.35);
      cyl(island, cream, [0, 1.35, 0], 2.25, 2.7);
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        box(
          island,
          dark,
          [2.26 * Math.sin(a), 1.3, 2.26 * Math.cos(a)],
          [0.2, 1.7, 0.2],
        );
      }
      mesh(
        new T.SphereGeometry(2.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        gold,
        island,
        [0, 2.7, 0],
      );
      rod(island, gold, [0, 4.9, 0], [0, 6.9, 0], 0.055);
      ball(island, light, [0, 6.9, 0], [0.14, 0.14, 0.14]);
      const track = ring(root, gold, [side * 3, -2.5, 0], 16, 0.04);
      track.rotation.x = Math.PI / 2;
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2,
        x = 14 * Math.cos(a),
        z = 14 * Math.sin(a);
      if (Math.abs(x) < 6) continue;
      const shard = box(
        root,
        i % 3 ? stone : red,
        [x, -2 + rand() * 5, z],
        [0.6, 0.8 + rand() * 1.4, 0.6],
      );
      shard.rotation.set(rand(), rand(), rand());
    }
  }
  const plaza = roots[0];
  for (const [height, radius, thickness, mat] of [
    [7.22, 9.4, 0.3, cream],
    [7.56, 9.4, 0.14, gold],
    [7.77, 9.4, 0.24, cream],
  ]) {
    const cornice = mesh(
      new T.TorusGeometry(radius, thickness, 10, 72, Math.PI),
      mat,
      plaza,
      [0, height, 0],
    );
    cornice.rotation.x = -Math.PI / 2;
  }
  for (const side of [-1, 1]) {
    const banner = box(
      plaza,
      red,
      [side * 6.25, 4.9, -7.25],
      [1.18, 3.2, 0.07],
    );
    rod(
      plaza,
      gold,
      [side * 6.25 - 0.75, 6.6, -7.25],
      [side * 6.25 + 0.75, 6.6, -7.25],
      0.04,
    );
    ring(plaza, gold, [side * 6.25, 5.2, -7.19], 0.28, 0.026);
    rod(
      plaza,
      gold,
      [side * 6.25, 4.45, -7.19],
      [side * 6.25, 5.9, -7.19],
      0.018,
    );
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const line = box(
      plaza,
      stone,
      [6 * Math.cos(a), 0.09, 6 * Math.sin(a)],
      [0.016, 0.01, 9],
    );
    line.rotation.y = -a + Math.PI / 2;
  }
  // Volumetric foliage clusters, fern fronds and crimson flowers break up the regular arches.
  const garden = roots[1];
  for (let i = 0; i < 30; i++) {
    const x = (i % 2 ? 1 : -1) * (4 + rand() * 5),
      z = 9 - rand() * 20,
      y = 0.3 + rand() * 0.6;
    for (let j = 0; j < 7; j++) {
      const a = (j / 7) * Math.PI * 2;
      const tip = [
        x + Math.cos(a) * (1 + rand()),
        y + 0.7 + rand(),
        z + Math.sin(a),
      ];
      rod(garden, leaf, [x, y, z], tip, 0.025);
      for (let k = 1; k < 6; k++) {
        const t = k / 6;
        for (const sign of [-1, 1]) {
          const o = ball(
            garden,
            k % 2 ? leaf : leaf2,
            [
              x + (tip[0] - x) * t + Math.cos(a + (sign * Math.PI) / 2) * 0.16,
              y + (tip[1] - y) * t,
              z + (tip[2] - z) * t + Math.sin(a + (sign * Math.PI) / 2) * 0.16,
            ],
            [0.08, 0.04, 0.27 * (1 - t) + 0.06],
          );
          o.rotation.y = -a;
        }
      }
    }
    if (i % 4 === 0)
      for (let j = 0; j < 5; j++) {
        const a = j * Math.PI * 0.4;
        ball(
          garden,
          red,
          [x + Math.cos(a) * 0.16, y + 1.4, z + Math.sin(a) * 0.16],
          [0.18, 0.08, 0.14],
        );
      }
  }
  // Background geometry is distant, so the full-circle sculpture remains the focus.
  const atmosphere = new T.Scene();
  atmosphere.fog = new T.FogExp2(0xc5c8b7, 0.011);
  atmosphere.environment = scenes[0].environment;
  atmosphere.environmentIntensity = 0.4;
  atmosphere.add(new T.HemisphereLight(0xffe7bb, 0x425d57, 2));
  const sun = new T.DirectionalLight(0xffe1a0, 2);
  sun.position.set(-20, 40, 20);
  atmosphere.add(sun);
  for (let i = 0; i < 3; i++) {
    const r = ring(atmosphere, gold, [0, -10, -i * 35], 32, 0.13);
    r.rotation.set(Math.PI * 0.42, 0.15, 0);
  }
  const dustGeo = new T.BufferGeometry(),
    dust = [];
  for (let i = 0; i < 250; i++)
    dust.push((rand() - 0.5) * 70, rand() * 35 - 8, -rand() * 100);
  dustGeo.setAttribute("position", new T.Float32BufferAttribute(dust, 3));
  const particles = new T.Points(
    dustGeo,
    new T.PointsMaterial({
      color: 0xf0dfba,
      size: 0.045,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }),
  );
  atmosphere.add(particles);
  // Thousands of fern leaflets share a few draw calls, including their shadow pass.
  garden.updateWorldMatrix(true,true);
  const inverseGarden=garden.matrixWorld.clone().invert(), batches=new Map();
  garden.traverse(o=>{if(o.isMesh&&(o.material===leaf||o.material===leaf2)){const key=o.geometry.uuid+o.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);}});
  for(const objects of batches.values()){
    const instanced=new T.InstancedMesh(objects[0].geometry,objects[0].material,objects.length);
    objects.forEach((o,i)=>{instanced.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inverseGarden,o.matrixWorld));o.removeFromParent();});
    instanced.castShadow=true;instanced.receiveShadow=true;instanced.instanceMatrix.needsUpdate=true;garden.add(instanced);
  }
  return { atmosphere, particles };
}
