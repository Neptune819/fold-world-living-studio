import * as T from "./vendor/three.module.js";

export function detailedColumn(root, x, z, height, h) {
  const { mesh, cyl, box, cream, stone, dark, gold } = h;
  const group = new T.Group();
  group.position.set(x, 0, z);
  root.add(group);
  box(group, dark, [0, 0.1, 0], [1.2, 0.2, 1.2]);
  box(group, stone, [0, 0.26, 0], [1.05, 0.16, 1.05]);
  for (const [y, r, d, mat] of [
    [0.42, 0.58, 0.16, cream],
    [0.57, 0.47, 0.12, gold],
    [height - 0.47, 0.44, 0.12, gold],
    [height - 0.29, 0.52, 0.22, cream],
    [height - 0.11, 0.64, 0.13, dark],
    [height, 0.72, 0.1, gold],
  ])
    cyl(group, mat, [0, y, 0], r, d);
  const points = [], uvs = [],
    normals = [],
    indices = [],
    sides = 144,
    rows = 20;
  for (let j = 0; j <= rows; j++) {
    const f = j / rows,
      y = 0.63 + f * (height - 1.15),
      radius = 0.39 - 0.08 * f + 0.023 * Math.sin(f * Math.PI);
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2,
        r = radius - 0.038 * (0.5 + 0.5 * Math.cos(a * 18));
      points.push(r * Math.cos(a), y, r * Math.sin(a));
      uvs.push(i / sides, f);
      if (j < rows && i < sides) {
        const k = j * (sides + 1) + i;
        indices.push(
          k,
          k + sides + 1,
          k + 1,
          k + 1,
          k + sides + 1,
          k + sides + 2,
        );
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(points, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  mesh(geometry, cream, group);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    box(
      group,
      gold,
      [0.49 * Math.cos(a), height - 0.32, 0.49 * Math.sin(a)],
      [0.11, 0.18, 0.11],
    );
  }
}

export function detailPlaza(roots, scenes, portals, scenery, h) {
  const {
      mesh,
      box,
      ball,
      cyl,
      ring,
      rod,
      cream,
      stone,
      dark,
      gold,
      red,
      silver,
      light,
    } = h,
    plaza = roots[0];
  const enamel = new T.MeshStandardMaterial({
    color: 0x183d36,
    metalness: 0.38,
    roughness: 0.29,
  });
  const bronze = new T.MeshStandardMaterial({
    color: 0x88744d,
    metalness: 0.75,
    roughness: 0.43,
  });
  const brushed = document.createElement("canvas");
  brushed.width = brushed.height = 256;
  const ctx = brushed.getContext("2d");
  ctx.fillStyle = "#909090";
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y++) {
    ctx.fillStyle = `rgb(${110 + (y % 37)},${110 + (y % 37)},${110 + (y % 37)})`;
    ctx.fillRect(0, y, 256, 1);
  }
  const map = new T.CanvasTexture(brushed);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.repeat.set(3, 3);
  bronze.roughnessMap = map;
  silver.roughnessMap = map;
  silver.roughness = 0.38;
  cream.color.set(0xd2c6a9);
  cream.roughness = 0.73;
  stone.color.set(0x94947c);
  gold.color.set(0x9e8150);
  scenes[0].environmentIntensity = 0.28;
  scenes[0].children
    .filter((o) => o.isHemisphereLight)
    .forEach((o) => (o.intensity = 0.95));
  const rim = new T.DirectionalLight(0xb6d9e2, 2.7);
  rim.position.set(-5, 12, -10);
  scenes[0].add(rim);
  // Equally spaced service bays replace the unbroken white drum.
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2,
      g = new T.Group();
    g.position.set(11.86 * Math.sin(a), -0.58, 11.86 * Math.cos(a));
    g.rotation.y = a;
    plaza.add(g);
    box(g, i % 4 ? enamel : bronze, [0, 0, 0], [1.97, 0.75, 0.1]);
    box(g, dark, [0, 0, 0.065], [1.32, 0.48, 0.025]);
    for (let j = 0; j < 4; j++)
      box(g, bronze, [-0.48 + j * 0.32, 0, 0.09], [0.08, 0.38, 0.04]);
    for (const x of [-0.86, 0.86])
      for (const y of [-0.27, 0.27])
        ball(g, silver, [x, y, 0.075], [0.035, 0.035, 0.025]);
    if (i % 4 === 0) {
      box(g, red, [0, -0.27, 0.12], [0.4, 0.055, 0.025]);
      rod(
        plaza,
        dark,
        [10.7 * Math.sin(a), -1.25, 10.7 * Math.cos(a)],
        [7 * Math.sin(a), -3.8, 7 * Math.cos(a)],
        0.15,
      );
    }
  }
  for (const [radius, y] of [
    [11.7, -0.15],
    [11.65, -1.07],
    [8, -3.35],
  ]) {
    const r = ring(plaza, bronze, [0, y, 0], radius, 0.095);
    r.rotation.x = Math.PI / 2;
  }
  // Individual curved panels retain the portal's exact original clear aperture.
  const movingRings = [],
    lamps = [];
  portals.forEach(({ frame }, index) => {
    const rotor = new T.Group();
    frame.add(rotor);
    movingRings.push(rotor);
    for (let j = 0; j < 18; j++) {
      const a = (j / 18) * Math.PI * 2;
      const segment = mesh(
        new T.TorusGeometry(4.58, 0.33, 8, 10, (Math.PI * 2) / 18 - 0.035),
        j % 3 ? enamel : bronze,
        frame,
        [0, 0, 0.16],
      );
      segment.rotation.z = a;
      const clamp = box(
        frame,
        silver,
        [4.63 * Math.cos(a), 4.63 * Math.sin(a), 0.57],
        [0.12, 0.35, 0.08],
      );
      clamp.rotation.z = a;
      const tooth = box(
        rotor,
        bronze,
        [4.34 * Math.cos(a), 4.34 * Math.sin(a), 0.5],
        [0.09, 0.24, 0.07],
      );
      tooth.rotation.z = a;
      const lm = new T.MeshStandardMaterial({
        color: 0xc2a15f,
        emissive: 0xfacb73,
        emissiveIntensity: 0.2,
      });
      const lamp = box(
        frame,
        lm,
        [4.49 * Math.cos(a), 4.49 * Math.sin(a), 0.55],
        [0.13, 0.055, 0.035],
      );
      lamp.rotation.z = a;
      lamps.push({ material: lm, index, step: j });
    }
    for (const side of [-1, 1]) {
      box(roots[index], enamel, [side * 5, 2.3, -13.95], [0.72, 4.6, 1.3]);
      box(roots[index], bronze, [side * 5, 4.45, -13.2], [0.52, 0.13, 0.13]);
      rod(
        roots[index],
        silver,
        [side * 5.48, 0.5, -13.3],
        [side * 5.48, 4.7, -13.3],
        0.065,
      );
    }
  });
  // A curved mid-distance route keeps wrap points behind the camera for every journey position.
  const airship = new T.Group();
  airship.scale.setScalar(2);
  scenery.atmosphere.add(airship);
  ball(airship, dark, [0, 0, 0], [3.3, 0.85, 0.85]);
  for (let i = -2; i <= 2; i++) {
    const r = ring(
      airship,
      bronze,
      [i, 0, 0],
      0.85 * Math.sqrt(1 - (i * i) / 12),
      0.025,
    );
    r.rotation.y = Math.PI / 2;
  }
  ball(airship, enamel, [0, -0.85, 0], [1, 0.25, 0.38]);
  box(airship, red, [-2.6, 0.5, 0], [1.3, 1, 0.05]);
  box(airship, bronze, [-2.6, 0, 0], [1, 0.05, 1.4]);
  const prop = new T.Group();
  prop.position.set(-1, -0.9, 0);
  airship.add(prop);
  box(prop, silver, [0, 0, 0], [0.08, 0.85, 0.08]);
  const pods = [],
    observatories = [];
  for (const side of [-1, 1]) {
    const pod = new T.Group();
    plaza.add(pod);
    ball(pod, enamel, [0, 0, 0], [0.8, 0.3, 0.36]);
    box(pod, bronze, [0, 0.18, 0], [1, 0.12, 0.45]);
    box(pod, light, [0.65, 0, 0], [0.07, 0.08, 0.25]);
    pods.push({ pod, side });
    const scope = new T.Group();
    scope.position.set(side * 19, 1.1, -5);
    plaza.add(scope);
    ring(scope, bronze, [0, 0, 0], 1.2, 0.06);
    rod(scope, dark, [-1, 0, 0], [1, 0, 0], 0.085);
    const telescope = cyl(scope, enamel, [0, 0.2, 0], 0.35, 2.3);
    telescope.rotation.z = Math.PI / 3;
    ball(scope, silver, [0.98, 0.76, 0], [0.1, 0.3, 0.3]);
    observatories.push(scope);
  }
  // Replace static rectangular flags with tessellated cloth, fixed along the upper edge.
  const flags = [];
  plaza.children
    .filter(
      (o) =>
        o.isMesh && o.material === red && Math.abs(o.position.y - 4.9) < 0.01,
    )
    .forEach((o) => (o.visible = false));
  for (const side of [-1, 1]) {
    const geo = new T.PlaneGeometry(1.18, 3.2, 10, 20),
      mat = red.clone();
    mat.side = T.DoubleSide;
    const flag = mesh(geo, mat, plaza, [side * 6.25, 4.9, -7.25]);
    flags.push({ flag, rest: geo.attributes.position.array.slice(), side });
  }
  // Soft local cloud cards; no full-screen fog wash and no external texture fetch.
  const cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = cloudCanvas.height = 128;
  const cc = cloudCanvas.getContext("2d"),
    grad = cc.createRadialGradient(64, 64, 3, 64, 64, 64);
  grad.addColorStop(0, "rgba(225,225,206,.3)");
  grad.addColorStop(0.5, "rgba(219,223,204,.12)");
  grad.addColorStop(1, "rgba(219,223,204,0)");
  cc.fillStyle = grad;
  cc.fillRect(0, 0, 128, 128);
  const cloudTex = new T.CanvasTexture(cloudCanvas),
    mist = [];
  for (let i = 0; i < 5; i++) {
    const mat = new T.SpriteMaterial({
      map: cloudTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.42,
    });
    const sprite = new T.Sprite(mat);
    sprite.scale.set(11 + i, 3 + i * 0.3, 1);
    sprite.position.set((i - 2) * 7, -2.8 - i * 0.4, 3 - i * 3);
    plaza.add(sprite);
    mist.push({ sprite, x: sprite.position.x, y: sprite.position.y });
  }
  function update(time, scroll, reduced) {
    const t = reduced ? 0 : time;
    airship.position.set(
      55 * Math.cos((t * Math.PI * 2) / 100 + 4.0),
      -8 + Math.sin(t * 0.06),
      -25 + 85 * Math.sin((t * Math.PI * 2) / 100 + 4.0),
    );
    airship.rotation.y = -((t * Math.PI * 2) / 100 + 4.0);
    prop.rotation.x = t * 7;
    pods.forEach(({ pod, side }, i) => {
      const a = (t * Math.PI * 2) / 45 + i * Math.PI;
      pod.position.set(side * 3 + 16 * Math.cos(a), -2.5, 16 * Math.sin(a));
      pod.rotation.y = -a;
    });
    observatories.forEach((o, i) => (o.rotation.y = t * 0.07 + i * Math.PI));
    movingRings.forEach((r, i) => (r.rotation.z = t * (0.065 + i * 0.01)));
    lamps.forEach(({ material, index, step }) => {
      const approach = T.MathUtils.clamp((scroll - (index ? 13 : 8)) / 2, 0, 1);
      material.emissiveIntensity = step / 18 < approach ? 2.3 : 0.12;
    });
    flags.forEach(({ flag, rest, side }) => {
      const p = flag.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const free = (1.6 - rest[i * 3 + 1]) / 3.2;
        p.setZ(
          i,
          rest[i * 3 + 2] +
            (reduced
              ? 0
              : free *
                0.1 *
                Math.sin(rest[i * 3] * 3 + free * 4 + t * 1.4 + side)),
        );
      }
      p.needsUpdate = true;
      flag.geometry.computeVertexNormals();
    });
    mist.forEach(({ sprite, x, y }, i) => {
      sprite.position.x = x + Math.sin(t * 0.07 + i) * 2;
      sprite.position.y = y + Math.sin(t * 0.11 + i) * 0.17;
    });
  }
  update(0, 0, true);
  return { update, airship, pods, movingRings, flags, mist };
}
