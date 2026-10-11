// @ts-nocheck
// 3D house with the configured door in the front wall. three.js, loaded lazily from Stage.
// Units are metres. The front face of the house is the plane z = 0, the viewer starts at +z.
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { D } from './data';
import { useStore, door } from './store';
import { doorParts } from './lib/render';
import { WALLS, ROOFS } from './steps/View3D';

/* ---------- procedural textures ---------- */
const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
function canvasTex(size, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size, rng(7));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.repeat.set(rx, ry);
  return t;
}
// One tile = 4 bricks wide, 13 courses high = 0.86 m x 0.845 m, so UVs in metres need repeat 1/0.86, 1/0.845.
const brickTex = () => canvasTex(512, (g, s, r) => {
  g.fillStyle = '#b8afa0'; g.fillRect(0, 0, s, s);
  const rows = 13, bw = s / 4, bh = s / rows;
  for (let y = 0; y < rows; y++) for (let i = -1; i < 5; i++) {
    const x = i * bw + (y % 2 ? bw / 2 : 0);
    g.fillStyle = `hsl(${10 + r() * 10}, ${42 + r() * 12}%, ${33 + r() * 10}%)`;
    g.fillRect(x + 2, y * bh + 2, bw - 4, bh - 4);
  }
}, 1 / 0.86, 1 / 0.845);
const grassTex = () => canvasTex(256, (g, s, r) => {
  g.fillStyle = '#5f8f46'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `hsla(${85 + r() * 25}, ${35 + r() * 25}%, ${28 + r() * 22}%, .55)`; g.fillRect(r() * s, r() * s, 2, 3); }
}, 40, 40);
const stoneTex = () => canvasTex(256, (g, s, r) => {
  g.fillStyle = '#9b9a95'; g.fillRect(0, 0, s, s);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) { const l = 62 + r() * 14; g.fillStyle = `hsl(40, 6%, ${l}%)`; g.fillRect(x * 85 + 3 + (y % 2) * 20, y * 64 + 3, 79, 58); }
}, 1.5 / 1, 14 / 1);

/* ---------- geometry helpers ---------- */
// Box whose UVs are in metres, so one brick texture tiles consistently on every wall.
function box(w, h, d, mat, x, y, z, metric) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (metric) {
    const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]); }
  }
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  return m;
}
const hex = (c) => new THREE.Color(c);
const OPEN_ANGLE = 1.25; // radians, about 70 degrees: reads as clearly open from the front without going edge-on

export default function House3D() {
  const { cfg, night, doorOpen, scene3d, patch } = useStore();
  const hostRef = useRef(null), api = useRef(null);
  const [err, setErr] = useState('');

  /* ----- scene lifecycle ----- */
  useEffect(() => {
    const host = hostRef.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); } catch { setErr('3D view is not supported on this device.'); return; }
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none';
    renderer.domElement.setAttribute('aria-label', '3D view of your door on a house. Drag to rotate, pinch to zoom.');
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#a9d4f5', 35, 120);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false;
    controls.minDistance = 2.6; controls.maxDistance = 26;
    controls.minPolarAngle = 0.35; controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minAzimuthAngle = -1.35; controls.maxAzimuthAngle = 1.35;

    /* lights */
    const hemi = new THREE.HemisphereLight('#cfe6ff', '#6b7a5a', 0.9); scene.add(hemi);
    const sun = new THREE.DirectionalLight('#fff4e0', 2.6); sun.position.set(7, 12, 9); sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 50 }); sun.shadow.bias = -0.0005;
    scene.add(sun);
    const warm = (i, d) => { const l = new THREE.PointLight('#ffcf8a', 0, d || 14, 1.6); scene.add(l); return l; };
    const lampL = warm(), lampR = warm(), lantern = warm(), inner = warm();

    /* sky: stars + moon fade in at night */
    const starGeo = new THREE.BufferGeometry(), sp = [], r = rng(3);
    for (let i = 0; i < 500; i++) { const a = r() * Math.PI * 2, e = 0.12 + r() * 1.2, R = 160; sp.push(Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R, Math.sin(a) * Math.cos(e) * R); }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false })); scene.add(stars);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 16), new THREE.MeshBasicMaterial({ color: '#e8eefc', transparent: true, opacity: 0, fog: false }));
    moon.position.set(-50, 70, -90); scene.add(moon);

    /* ground */
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ map: grassTex(), roughness: 1 }));
    grass.rotation.x = -Math.PI / 2; grass.position.y = -0.05; grass.receiveShadow = true; scene.add(grass);

    /* shared materials (kept across rebuilds, animated by env) */
    const brick = brickTex(), stone = stoneTex();
    const wallMats = {
      brick: new THREE.MeshStandardMaterial({ map: brick, roughness: 0.95 }),
      white: new THREE.MeshStandardMaterial({ color: WALLS.white[1], roughness: 0.95 }),
      grey: new THREE.MeshStandardMaterial({ color: WALLS.grey[1], roughness: 0.95 }),
      stone: new THREE.MeshStandardMaterial({ color: WALLS.stone[1], roughness: 0.9 }),
    };
    const glassLit = new THREE.MeshStandardMaterial({ color: '#7f9fb8', metalness: 0.4, roughness: 0.08, emissive: '#ffc470', emissiveIntensity: 0 });
    const glassDark = new THREE.MeshStandardMaterial({ color: '#6f8aa0', metalness: 0.4, roughness: 0.08 });
    const trim = new THREE.MeshStandardMaterial({ color: '#f1efe9', roughness: 0.6 });
    const lampMat = new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffcf8a', emissiveIntensity: 0 });
    const interior = new THREE.MeshStandardMaterial({ color: '#e7dcc8', roughness: 0.9 });

    let house = null, leafPivot = null, leafMesh = null, openTarget = 0, token = 0;
    const env = { t: 0, target: 0 };
    const state = { open: false, wall: 'brick', roof: 'slate' };
    let dirty = true, camTween = null, innerBase = 0.6;

    const dispose = (g) => g.traverse((o) => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? [].concat(o.material) : []; ms.forEach((m) => { if (m.userData.own) { if (m.map) m.map.dispose(); m.dispose(); } }); });

    /* ----- (re)build the house + door for the current config ----- */
    async function rebuild(cfg) {
      const my = ++token;
      const parts = await doorParts(door, cfg, 1400);
      if (my !== token) return;
      if (house) { scene.remove(house); dispose(house); }
      house = new THREE.Group(); scene.add(house);
      const { TW, TH, rect } = parts, ow = TW / 1000, oh = TH / 1000;
      const Wh = 9.6, Dh = 7.5, H = 5.6, hw = Wh / 2, T = 0.35;
      const rw = Math.max(3.2, ow + 0.9), rh = Math.max(2.8, oh + 0.3), rd = 4;
      const wall = wallMats[state.wall];

      /* front slab with the door opening cut out */
      const shape = new THREE.Shape(); shape.moveTo(-hw, -0.05); shape.lineTo(hw, -0.05); shape.lineTo(hw, H); shape.lineTo(-hw, H); shape.closePath();
      const hole = new THREE.Path(); hole.moveTo(-ow / 2, 0); hole.lineTo(-ow / 2, oh); hole.lineTo(ow / 2, oh); hole.lineTo(ow / 2, 0); hole.closePath(); shape.holes.push(hole);
      const slabGeo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false }); slabGeo.translate(0, 0, -T);
      const slab = new THREE.Mesh(slabGeo, wall); slab.castShadow = slab.receiveShadow = true; house.add(slab);

      /* hollow body around a room behind the door so the open door shows an interior */
      const bodyH = H + 0.05, by = H / 2 - 0.025;
      house.add(box(hw - rw / 2, bodyH, Dh - T, wall, -(hw + rw / 2) / 2, by, -(Dh + T) / 2, true));
      house.add(box(hw - rw / 2, bodyH, Dh - T, wall, (hw + rw / 2) / 2, by, -(Dh + T) / 2, true));
      house.add(box(rw, bodyH, Dh - T - rd, wall, 0, by, -(T + rd + Dh) / 2, true));
      house.add(box(rw, H - rh, rd, wall, 0, (rh + H) / 2, -(T + rd / 2), true));
      const lining = (w, h, x, y, z, rx, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), interior); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; house.add(m); };
      lining(rw, rd, 0, 0.005, -(T + rd / 2), -Math.PI / 2, 0);                       // floor
      lining(rw, rd, 0, rh - 0.005, -(T + rd / 2), Math.PI / 2, 0);                   // ceiling
      lining(rw, rh, 0, rh / 2, -(T + rd) + 0.005, 0, 0);                             // back
      lining(rd, rh, -rw / 2 + 0.005, rh / 2, -(T + rd / 2), 0, Math.PI / 2);         // left
      lining(rd, rh, rw / 2 - 0.005, rh / 2, -(T + rd / 2), 0, -Math.PI / 2);         // right

      /* roof (gable along x), chimney */
      const roofMat = new THREE.MeshStandardMaterial({ color: ROOFS[state.roof][1], roughness: 0.85 }); roofMat.userData.own = true;
      const zf = 0.55, zb = -Dh - 0.45, apex = H + 2.5, rs = new THREE.Shape();
      rs.moveTo(-zf, H - 0.02); rs.lineTo(-zb, H - 0.02); rs.lineTo(-(zf + zb) / 2, apex); rs.closePath();
      const rg = new THREE.ExtrudeGeometry(rs, { depth: Wh + 1, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(-(Wh + 1) / 2, 0, 0);
      const roof = new THREE.Mesh(rg, roofMat); roof.castShadow = roof.receiveShadow = true; house.add(roof);
      house.add(box(0.9, 2.6, 0.9, wallMats.brick, 3.2, H + 1.2, -Dh + 2, true));

      /* door: static frame/sidelights plane + a leaf on a hinge */
      const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; };
      const frameMat = new THREE.MeshStandardMaterial({ map: tex(parts.full), transparent: true, alphaTest: 0.02, roughness: 0.55 }); frameMat.userData.own = true;
      const frame = new THREE.Mesh(new THREE.PlaneGeometry(ow, oh), frameMat); frame.position.set(0, oh / 2, -0.12); frame.receiveShadow = true; house.add(frame);
      const lw = (rect.x1 - rect.x0) / 1000, lh = (rect.y1 - rect.y0) / 1000, thick = 0.07;
      const inside = hex(D.colourById[cfg.colours.inside].hex), edge = hex(D.colourById[cfg.colours.frame].hex);
      const front = new THREE.MeshStandardMaterial({ map: tex(parts.leaf), roughness: 0.45, metalness: 0.05 }), back = new THREE.MeshStandardMaterial({ color: inside, roughness: 0.6 }), side = new THREE.MeshStandardMaterial({ color: edge, roughness: 0.6 });
      [front, back, side].forEach((m) => { m.userData.own = true; });
      leafMesh = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, thick), [side, side, side, side, front, back]); leafMesh.castShadow = true; leafMesh.name = 'leaf';
      const cx = (rect.x0 + rect.x1) / 2000 - ow / 2, cy = oh - (rect.y0 + rect.y1) / 2000;
      leafPivot = new THREE.Group();
      leafPivot.position.set(cx + (parts.hingeRight ? lw / 2 : -lw / 2), cy, -0.12 + thick / 2 + 0.005);
      leafMesh.position.x = parts.hingeRight ? -lw / 2 : lw / 2;
      leafPivot.add(leafMesh); house.add(leafPivot);
      leafPivot.userData.dir = (parts.hingeRight ? 1 : -1) * (parts.outward ? 1 : -1);
      leafPivot.rotation.y = state.open ? leafPivot.userData.dir * OPEN_ANGLE : 0;
      openTarget = leafPivot.rotation.y;

      /* windows on the front face */
      const win = (x, y, w, h, lit) => {
        const g = new THREE.Group(); g.position.set(x, y, 0);
        g.add(box(w + 0.2, h + 0.2, 0.1, trim, 0, 0, 0.05));
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lit ? glassLit : glassDark); gl.position.z = 0.108; g.add(gl);
        g.add(box(0.05, h, 0.04, trim, 0, 0, 0.12)); g.add(box(w, 0.05, 0.04, trim, 0, 0, 0.12));
        g.add(box(w + 0.4, 0.07, 0.22, trim, 0, -h / 2 - 0.13, 0.11));
        house.add(g);
      };
      win(-3.3, 1.9, 1.5, 1.5, true); win(3.3, 1.9, 1.5, 1.5, true);
      win(-3.3, 4.2, 1.3, 1.4, true); win(0, 4.2, 1.3, 1.4, false); win(3.3, 4.2, 1.3, 1.4, true);
      // side windows so the house reads as 3D when orbiting
      for (const sx of [-1, 1]) for (const z of [-2.6, -5.2]) for (const y of [1.9, 4.2]) {
        const g = new THREE.Group(); g.position.set(sx * (hw + 0.01), y, z); g.rotation.y = sx * Math.PI / 2;
        g.add(box(1.2, 1.3, 0.08, trim, 0, 0, 0.04)); const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.1), glassDark); gl.position.z = 0.09; g.add(gl); house.add(g);
      }

      /* garden */
      const path = box(1.6, 0.05, 15, new THREE.MeshStandardMaterial({ map: stone, roughness: 0.9 }), 0, -0.025, 8, false); house.add(path);
      house.add(box(ow + 0.5, 0.05, 1, new THREE.MeshStandardMaterial({ color: '#8d8c88', roughness: 0.9 }), 0, -0.012, 0.5, false));
      const leaves = new THREE.MeshStandardMaterial({ color: '#3f6f34', roughness: 1 });
      for (const sx of [-1, 1]) { house.add(box(2.6, 0.75, 0.8, leaves, sx * 3.1, 0.33, 1.6, false)); house.add(box(0.8, 0.75, 3, leaves, sx * 4.6, 0.33, 2.7, false)); }
      const tree = (x, z, s) => {
        const t = new THREE.Group(); t.position.set(x, 0, z);
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.22 * s, 2.2 * s, 8), new THREE.MeshStandardMaterial({ color: '#5a4332', roughness: 1 })); tr.position.y = 1.1 * s; tr.castShadow = true; t.add(tr);
        for (const [dx, dy, dz, rr] of [[0, 3.2, 0, 1.5], [0.7, 2.6, 0.3, 1.1], [-0.7, 2.7, -0.2, 1.1]]) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(rr * s, 1), new THREE.MeshStandardMaterial({ color: '#4a7c3a', roughness: 1, flatShading: true })); f.position.set(dx * s, dy * s, dz * s); f.castShadow = true; t.add(f); }
        house.add(t);
      };
      tree(-8, 3.5, 1.1); tree(7.8, 2.2, 1);
      for (const sx of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1, 8), new THREE.MeshStandardMaterial({ color: '#2a2c2e' })); post.position.set(sx * 1.25, 0.5, 5.2); house.add(post);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), lampMat); bulb.position.set(sx * 1.25, 1.08, 5.2); house.add(bulb);
      }
      const lan = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.14), lampMat); lan.position.set(ow / 2 + 0.4, Math.min(oh * 0.8, 2.2), 0.1); house.add(lan);
      lampL.position.set(-1.25, 1.2, 5.2); lampR.position.set(1.25, 1.2, 5.2); lantern.position.set(ow / 2 + 0.4, Math.min(oh * 0.8, 2.2), 0.7);
      inner.position.set(0, rh - 0.4, -1.8);
      dirty = true;
    }

    /* ----- day / night ----- */
    const sky = { d: hex('#a9d4f5'), n: hex('#060b20') }, tmp = new THREE.Color();
    function applyEnv() {
      const t = env.t;
      tmp.copy(sky.d).lerp(sky.n, t); scene.background = tmp.clone(); scene.fog.color.copy(tmp);
      hemi.intensity = 0.9 - 0.62 * t; hemi.color.set('#cfe6ff').lerp(hex('#243258'), t); hemi.groundColor.set('#6b7a5a').lerp(hex('#0c1018'), t);
      sun.intensity = 2.6 - 2.25 * t; sun.color.set('#fff4e0').lerp(hex('#5d6fa8'), t);
      glassLit.emissiveIntensity = t * 0.95; lampMat.emissiveIntensity = t * 2.2;
      lampL.intensity = lampR.intensity = t * 5; lantern.intensity = t * 4.5;
      inner.intensity = (innerBase + t * 4) * (state.open ? 1.6 : 1);
      stars.material.opacity = Math.max(0, t * 1.2 - 0.2); moon.material.opacity = Math.max(0, t * 1.4 - 0.4);
      dirty = true;
    }

    /* ----- camera presets ----- */
    const portrait = () => host.clientWidth / Math.max(1, host.clientHeight) < 0.85;
    const VIEWS = {
      front: () => { const a = host.clientWidth / Math.max(1, host.clientHeight); return [[0, 3.2, Math.max(13.5, 13 / a)], [0, 2.6, 0]]; },
      door: () => [[portrait() ? 1.3 : 1.8, 1.5, portrait() ? 5.6 : 4.4], [0, 1.2, 0]],
      left: () => [[-9.5, 2.6, 9.5], [0, 2, -1]],
      right: () => [[9.5, 2.6, 9.5], [0, 2, -1]],
    };
    function view(name, instant) {
      const [p, t] = VIEWS[name]();
      if (instant) { camera.position.set(...p); controls.target.set(...t); controls.update(); dirty = true; return; }
      camTween = { t0: performance.now(), dur: 900, p0: camera.position.clone(), t0v: controls.target.clone(), p1: new THREE.Vector3(...p), t1v: new THREE.Vector3(...t) };
    }

    /* ----- sizing + loop ----- */
    const resize = () => { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true; };
    const ro = new ResizeObserver(resize); ro.observe(host); resize();
    controls.addEventListener('change', () => { dirty = true; });

    let raf, last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.25, (now - last) / 1000); last = now;
      if (Math.abs(env.t - env.target) > 0.002) { env.t += Math.sign(env.target - env.t) * Math.min(Math.abs(env.target - env.t), dt / 1.4); applyEnv(); }
      if (leafPivot) { const d = openTarget - leafPivot.rotation.y; if (Math.abs(d) > 0.002) { leafPivot.rotation.y += d * Math.min(1, dt * 4.5); dirty = true; } }
      if (camTween) { const k = Math.min(1, (now - camTween.t0) / camTween.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; camera.position.lerpVectors(camTween.p0, camTween.p1, e); controls.target.lerpVectors(camTween.t0v, camTween.t1v, e); if (k >= 1) camTween = null; dirty = true; }
      if (controls.update()) dirty = true;
      if (dirty) { renderer.render(scene, camera); dirty = false; }
    };

    /* tap the door to open or close it */
    let down = null;
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    const onDown = (e) => { down = { x: e.clientX, y: e.clientY }; };
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 || !leafMesh) { down = null; return; }
      down = null;
      const r = renderer.domElement.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, camera);
      if (ray.intersectObject(leafMesh, false).length) useStore.getState().patch({ doorOpen: !useStore.getState().doorOpen });
    };
    renderer.domElement.addEventListener('pointerdown', onDown); renderer.domElement.addEventListener('pointerup', onUp);

    api.current = {
      rebuild: (c) => rebuild(c),
      setStyle: (s) => { const wallChanged = s.wall !== state.wall, roofChanged = s.roof !== state.roof; Object.assign(state, s); return { wallChanged, roofChanged }; },
      setOpen: (o) => { state.open = o; if (leafPivot) openTarget = o ? leafPivot.userData.dir * OPEN_ANGLE : 0; applyEnv(); },
      setNight: (n) => { env.target = n ? 1 : 0; },
      view,
      snapshot: () => { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/jpeg', 0.92); },
    };
    patch({ h3: api.current });
    const c0 = useStore.getState();
    state.open = c0.doorOpen; state.wall = c0.scene3d.wall; state.roof = c0.scene3d.roof; env.t = env.target = c0.night ? 1 : 0;
    applyEnv(); view('front', true);
    rebuild(c0.cfg);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); token++;
      renderer.domElement.removeEventListener('pointerdown', onDown); renderer.domElement.removeEventListener('pointerup', onUp);
      controls.dispose();
      if (house) dispose(house);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      [brick, stone, grass.material.map].forEach((t) => t && t.dispose());
      Object.values(wallMats).forEach((m) => m.dispose());
      renderer.dispose(); renderer.forceContextLoss();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      api.current = null; patch({ h3: null });
    };
  }, []);

  /* ----- react to store changes ----- */
  const first = useRef(true);
  useEffect(() => {
    if (!api.current) return;
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => api.current && api.current.rebuild(cfg), 120);
    return () => clearTimeout(t);
  }, [cfg]);
  useEffect(() => { api.current && api.current.setOpen(doorOpen); }, [doorOpen]);
  useEffect(() => { api.current && api.current.setNight(night); }, [night]);
  useEffect(() => {
    if (!api.current) return;
    const ch = api.current.setStyle(scene3d);
    if (ch.wallChanged || ch.roofChanged) api.current.rebuild(useStore.getState().cfg);
  }, [scene3d]);

  return (
    <div ref={hostRef} style={{ position: 'absolute', inset: 0, zIndex: 3, background: '#a9d4f5' }}>
      {err && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: '#EDEDEC', color: '#2B2D2F' }}>{err} Use the house photo step instead.</div>}
    </div>
  );
}
