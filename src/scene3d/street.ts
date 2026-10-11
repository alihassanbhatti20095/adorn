// @ts-nocheck
// A British residential street: Victorian/Edwardian brick terrace with sash and bay windows, slate roofs, chimney stacks,
// front walls and gates, Victorian tiled paths, pavement, kerb, double yellow lines, parked cars, lamp posts, a pillar box,
// wheelie bins, street trees and the houses opposite. Units are metres; every house front is at z = 0 (the hero house at x = 0).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as TX from './tex';

export const WH = 8.4, H = 5.4, DH = 8, T = 0.35, PITCH_RISE = 3.0;
export const WALL_KEY = { brick: 'brickRed', white: 'white', grey: 'grey', stone: 'stone' };

/* ------------------------------------------------------------------ materials */
export function makeMaterials() {
  const slG = TX.slate('#3b4046'), slT = TX.slate('#a4502f'), bR = TX.brick('red'), bS = TX.brick('stock'), sl = TX.slate('#59616b'), pv = TX.paving(), tm = TX.tarmac(), tp = TX.tilePath(), gr = TX.grass(), grain = TX.renderGrain();
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const M = {
    brickRed: std({ map: bR.map, bumpMap: bR.bump, bumpScale: 2.4, roughness: 0.95 }),
    brickStock: std({ map: bS.map, bumpMap: bS.bump, bumpScale: 2.4, roughness: 0.95 }),
    white: std({ color: '#ece8df', roughness: 0.95, bumpMap: grain, bumpScale: 1.2 }),
    grey: std({ color: '#b4b7b9', roughness: 0.95, bumpMap: grain, bumpScale: 1.2 }),
    stone: std({ color: '#d8ccb0', roughness: 0.92, bumpMap: grain, bumpScale: 1.6 }),
    trim: std({ color: '#f4f2ed', roughness: 0.5 }),
    stoneTrim: std({ color: '#d4cfc2', roughness: 0.85, bumpMap: grain, bumpScale: 1.2 }),
    lead: std({ color: '#6d7173', roughness: 0.6, metalness: 0.3 }),
    roof_slate: std({ map: sl.map, bumpMap: sl.bump, bumpScale: 2, roughness: 0.78 }),
    roof_graphite: std({ map: slG.map, bumpMap: slG.bump, bumpScale: 2, roughness: 0.78 }),
    roof_terracotta: std({ map: slT.map, bumpMap: slT.bump, bumpScale: 2, roughness: 0.85 }),
    doorA: std({ color: '#2a3f66', roughness: 0.4 }), doorB: std({ color: '#7a1f2b', roughness: 0.4 }), doorC: std({ color: '#1f4d3a', roughness: 0.4 }),
    ridge: std({ color: '#25282b', roughness: 0.7 }),
    pot: std({ color: '#b5532f', roughness: 0.85 }),
    glass: std({ color: '#b9cbd8', roughness: 0.03, metalness: 0.2, transparent: true, opacity: 0.4, envMapIntensity: 1.8 }),
    curtainDark: std({ color: '#3c3a3d', roughness: 1 }),
    curtainLit: std({ color: '#7a6a55', roughness: 1, emissive: '#ffc16e', emissiveIntensity: 0 }),
    iron: std({ color: '#1b1d1f', roughness: 0.5, metalness: 0.5 }),
    lampPost: std({ color: '#1f3d33', roughness: 0.5, metalness: 0.5 }),
    lampGlass: std({ color: '#fff0cf', roughness: 0.3, emissive: '#ffc878', emissiveIntensity: 0 }),
    paving: std({ map: pv.map, roughness: 0.92 }),
    kerb: std({ color: '#9a9a96', roughness: 0.9 }),
    tarmac: std({ map: tm.map, roughness: 0.92 }),
    tile: std({ map: tp.map, roughness: 0.6 }),
    grass: std({ map: gr.map, roughness: 1 }),
    bark: std({ color: '#4e3d2f', roughness: 1 }),
    foliage: std({ color: '#ffffff', roughness: 0.95 }),
    yellow: std({ color: '#e3c628', roughness: 0.8 }),
    pillar: std({ color: '#b2101b', roughness: 0.35, metalness: 0.2 }),
    binGreen: std({ color: '#2a5b3a', roughness: 0.6 }),
    binBlack: std({ color: '#202224', roughness: 0.6 }),
    binBlue: std({ color: '#1c4f8c', roughness: 0.6 }),
    carBlue: new THREE.MeshPhysicalMaterial({ color: '#1d3b63', roughness: 0.28, metalness: 0.7, clearcoat: 1, clearcoatRoughness: 0.08 }),
    carSilver: new THREE.MeshPhysicalMaterial({ color: '#b9bcc0', roughness: 0.3, metalness: 0.8, clearcoat: 1, clearcoatRoughness: 0.08 }),
    carGlass: std({ color: '#10161d', roughness: 0.05, metalness: 0.6 }),
    tyre: std({ color: '#141516', roughness: 0.9 }),
    hub: std({ color: '#c3c6c9', roughness: 0.3, metalness: 0.9 }),
    headlight: std({ color: '#ffffff', emissive: '#fff4d8', emissiveIntensity: 0.1 }),
    taillight: std({ color: '#7a0b10', emissive: '#ff2a2a', emissiveIntensity: 0.1 }),
    plantPot: std({ color: '#222426', roughness: 0.5 }),
    soil: std({ color: '#3a3128', roughness: 1 }),
  };
  const textures = [slG.map, slG.bump, slT.map, slT.bump, bR.map, bR.bump, bS.map, bS.bump, sl.map, sl.bump, pv.map, tm.map, tp.map, gr.map, grain];
  M.dispose = () => { Object.values(M).forEach((m) => m && m.dispose && m.dispose()); textures.forEach((t) => t && t.dispose()); };
  return M;
}

/* ------------------------------------------------------------------ batching: many boxes -> one draw call per material */
export class Batch {
  constructor(M) { this.M = M; this.map = {}; this.stack = [new THREE.Matrix4()]; }
  get m() { return this.stack[this.stack.length - 1]; }
  push(x = 0, y = 0, z = 0, ry = 0, rx = 0) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0)), new THREE.Vector3(1, 1, 1));
    this.stack.push(this.m.clone().multiply(m));
  }
  pop() { this.stack.pop(); }
  geo(g, key, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
    const gg = g.index ? g.toNonIndexed() : g;
    gg.applyMatrix4(this.m.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))));
    for (const k of Object.keys(gg.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') gg.deleteAttribute(k);
    (this.map[key] || (this.map[key] = [])).push(gg);
  }
  box(w, h, d, key, x, y, z, o = {}) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (o.metric) {
      const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]); }
    }
    this.geo(g, key, x, y, z, o.ry || 0, o.rx || 0, o.rz || 0);
  }
  plane(w, h, key, x, y, z, o = {}) { this.geo(new THREE.PlaneGeometry(w, h), key, x, y, z, o.ry || 0, o.rx || 0, 0); }
  cyl(rt, rb, h, seg, key, x, y, z) { this.geo(new THREE.CylinderGeometry(rt, rb, h, seg), key, x, y, z); }
  finish(parent, { shadow = true } = {}) {
    for (const key of Object.keys(this.map)) {
      const merged = mergeGeometries(this.map[key], false); this.map[key].forEach((g) => g.dispose());
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, this.M[key]); mesh.castShadow = shadow && key !== 'glass'; mesh.receiveShadow = true; parent.add(mesh);
    }
    this.map = {};
  }
}

/* ------------------------------------------------------------------ building blocks */
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) / 4294967296; };

// Sash window facing +z, centred on the origin of the current batch transform. 6-over-6 glazing bars, stone lintel and sill.
export function sash(B, x, y, w, h, lit, opt = {}) {
  B.push(x, y, 0);
  const t = 0.07;
  B.box(w + 0.1, t, 0.1, 'trim', 0, h / 2, 0.05); B.box(w + 0.1, t, 0.1, 'trim', 0, -h / 2, 0.05);
  B.box(t, h, 0.1, 'trim', -w / 2, 0, 0.05); B.box(t, h, 0.1, 'trim', w / 2, 0, 0.05);
  B.box(w, 0.055, 0.075, 'trim', 0, h * 0.06, 0.07);
  for (const vx of [-w / 6, w / 6]) B.box(0.022, h, 0.03, 'trim', vx, 0, 0.085);
  for (const hy of [h * 0.28, -h * 0.22]) B.box(w, 0.022, 0.03, 'trim', 0, hy, 0.085);
  B.plane(w - 0.04, h - 0.04, 'glass', 0, 0, 0.055);
  B.plane(w - 0.04, h - 0.04, lit ? 'curtainLit' : 'curtainDark', 0, 0, 0.035);
  if (!opt.noTrim) {
    B.box(w + 0.36, 0.16, 0.16, 'stoneTrim', 0, h / 2 + 0.14, 0.08);
    B.box(w + 0.3, 0.07, 0.2, 'stoneTrim', 0, -h / 2 - 0.08, 0.1);
  }
  B.pop();
}

// Three-sided ground floor bay with a lead roof.
function bayAt(B, cx, lit) {
  const w = 1.15, h = 1.5, yc = 1.5, base = yc - h / 2 - 0.08, zc = 0.8;
  // plinth
  B.push(cx, 0, zc); B.box(w + 0.2, base, 0.2, 'stoneTrim', 0, base / 2, -0.02); B.pop();
  for (const s of [-1, 1]) { B.push(cx + s * 0.95, 0, 0.42, s * Math.PI / 4); B.box(1.02, base, 0.2, 'stoneTrim', 0, base / 2, -0.02); B.pop(); }
  // windows
  B.push(cx, 0, zc); sash(B, 0, yc, w, h, lit, { noTrim: true }); B.pop();
  for (const s of [-1, 1]) { B.push(cx + s * 0.95, 0, 0.42, s * Math.PI / 4); sash(B, 0, yc, 0.9, h, lit, { noTrim: true }); B.pop(); }
  // roof + cill
  B.box(2.5, 0.1, 1.15, 'lead', cx, yc + h / 2 + 0.28, 0.5);
  B.box(2.62, 0.08, 1.25, 'stoneTrim', cx, yc + h / 2 + 0.17, 0.5);
}

// Painted door surround with a small flat canopy on brackets, used for every house.
function surround(B, x, ow, oh) {
  B.box(0.16, oh, 0.12, 'trim', x - ow / 2 - 0.08, oh / 2, 0.06); B.box(0.16, oh, 0.12, 'trim', x + ow / 2 + 0.08, oh / 2, 0.06);
  B.box(ow + 0.5, 0.22, 0.16, 'stoneTrim', x, oh + 0.11, 0.08);
  B.box(ow + 0.9, 0.08, 0.55, 'lead', x, oh + 0.42, 0.28);
  for (const s of [-1, 1]) B.box(0.07, 0.32, 0.4, 'trim', x + s * (ow / 2 + 0.3), oh + 0.22, 0.2);
}

/* ------------------------------------------------------------------ the house facade (the door itself is added in buildHero) */
function house(B, M, o) {
  const { ow } = o, lit = (a) => hash(5, a) > 0.42;
  // string course between floors and a stone plinth
  B.box(WH, 0.16, 0.08, 'stoneTrim', 0, 2.78, 0.04); B.box(WH, 0.45, 0.07, 'stoneTrim', 0, 0.2, 0.035);
  bayAt(B, Math.max(-(ow / 2 + 0.5 + 1.0), -2.9), lit(1));
  sash(B, ow / 2 + 1.25, 1.7, 1.15, 1.7, lit(2));
  for (const [k, sx] of [[3, -2.7], [4, 0], [5, 2.7]]) sash(B, sx, 4.1, 1.1, 1.75, lit(k));
  // side windows so the house reads as a real detached house when you orbit
  for (const sx of [-1, 1]) for (const z of [-2.6, -5.4]) for (const y of [1.7, 4.1]) { B.push(sx * WH / 2, 0, z, sx * Math.PI / 2); sash(B, 0, y, 1.0, 1.7, lit(Math.abs(z) * 3 + y)); B.pop(); }
  // gutter and downpipes at the corners
  B.box(WH + 0.1, 0.09, 0.1, 'iron', 0, H - 0.03, 0.06);
  for (const s of [-1, 1]) B.box(0.06, H - 0.2, 0.06, 'iron', s * (WH / 2 - 0.1), (H - 0.2) / 2, 0.09);
  // tiled path from the door to the pavement, no boundary wall
  B.box(1.3, 0.03, 5.9, 'tile', 0, 0.005, 3.2, { metric: true });
}

/* ------------------------------------------------------------------ roof across a run of houses */
export function buildRoof(parent, M, left, right, slateKey = 'roof_slate') {
  const B = new Batch(M), L = right - left + 0.5, cx = (left + right) / 2;
  const zf = 0.55, zb = -DH - 0.55, zc = (zf + zb) / 2, apex = H + PITCH_RISE, run = zf - zc, rise = apex - H, th = Math.atan2(rise, run), slope = Math.hypot(run, rise) + 0.1;
  B.push(cx, 0, 0);
  B.box(L, 0.14, slope, slateKey, 0, (H + apex) / 2 + 0.05, (zf + zc) / 2, { rx: th, metric: true });
  B.box(L, 0.14, slope, slateKey, 0, (H + apex) / 2 + 0.05, (zc + zb) / 2, { rx: -th, metric: true });
  B.box(L, 0.12, 0.34, 'ridge', 0, apex + 0.12, zc);
  B.box(L, 0.09, 0.1, 'iron', 0, H - 0.04, zf - 0.03);
  B.box(L, 0.09, 0.1, 'iron', 0, H - 0.04, zb + 0.03);
  B.pop();
  B.finish(parent);
  // gable ends
  for (const [x, ry] of [[left - 0.1, -Math.PI / 2], [right + 0.1, Math.PI / 2]]) {
    const s = new THREE.Shape(); const sgn = ry > 0 ? -1 : 1;
    s.moveTo(sgn * (zf - 0.1), H); s.lineTo(sgn * (zb + 0.1), H); s.lineTo(sgn * zc, apex); s.closePath();
    const g = new THREE.ShapeGeometry(s); g.rotateY(ry);
    const m = new THREE.Mesh(g, M.brickStock); m.position.x = x; m.castShadow = m.receiveShadow = true; parent.add(m);
  }
}
// Chimney stacks sit on the party walls.
export function buildStacks(parent, M, xs) {
  const B = new Batch(M), zc = (0.55 - DH - 0.55) / 2, apex = H + PITCH_RISE;
  for (const x of xs) {
    const top = apex + 1.25, bot = H + 0.3;
    B.box(0.95, top - bot, 0.85, 'brickStock', x, (top + bot) / 2, zc, { metric: true });
    B.box(1.1, 0.1, 1.0, 'stoneTrim', x, top + 0.05, zc);
    for (const dx of [-0.26, 0, 0.26]) B.cyl(0.09, 0.11, 0.5, 10, 'pot', x + dx, top + 0.35, zc);
  }
  B.finish(parent);
}

/* ------------------------------------------------------------------ street, cars, furniture, trees */
function lamp(B, x, z) {
  B.cyl(0.14, 0.18, 0.5, 10, 'lampPost', x, 0.25, z); B.cyl(0.05, 0.075, 3.4, 10, 'lampPost', x, 2.05, z);
  B.cyl(0.11, 0.09, 0.1, 10, 'lampPost', x, 3.78, z);
  B.cyl(0.2, 0.13, 0.42, 6, 'lampGlass', x, 4.04, z);
  B.cyl(0.02, 0.26, 0.2, 6, 'lampPost', x, 4.35, z);
  B.cyl(0.02, 0.02, 0.18, 6, 'lampPost', x, 4.54, z);
}
function bin(B, key, x, z, ry) {
  B.push(x, 0, z, ry);
  B.box(0.56, 0.9, 0.62, key, 0, 0.5, 0); B.box(0.6, 0.08, 0.68, key, 0, 0.99, 0.01);
  for (const s of [-1, 1]) B.cyl(0.08, 0.08, 0.05, 10, 'binBlack', s * 0.26, 0.08, -0.3);
  B.pop();
}
function pillarBox(B, x, z) {
  B.cyl(0.27, 0.29, 1.35, 20, 'pillar', x, 0.78, z); B.cyl(0.3, 0.3, 0.12, 20, 'pillar', x, 0.1, z);
  B.geo(new THREE.SphereGeometry(0.28, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), 'pillar', x, 1.45, z);
  B.box(0.3, 0.05, 0.04, 'binBlack', x, 1.1, z + 0.28);
}
function car(parent, M, key, x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, -0.12, z); g.rotation.y = ry; parent.add(g);
  const prof = (pts) => { const s = new THREE.Shape(); pts.forEach(([a, b], i) => (i ? s.lineTo(a, b) : s.moveTo(a, b))); s.closePath(); return s; };
  const ext = (s, depth, mat, bevel) => { const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 6 }); geo.translate(-2.05, 0, -depth / 2); const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  ext(prof([[0, 0.3], [0, 0.62], [0.25, 0.8], [1.15, 0.92], [3.5, 0.92], [4.05, 0.84], [4.1, 0.62], [4.1, 0.3]]), 1.62, M[key], 0.07);
  ext(prof([[1.05, 0.92], [1.85, 1.4], [3.0, 1.4], [3.7, 0.92]]), 1.4, M.carGlass, 0.05);
  for (const sx of [-1.28, 1.25]) for (const sz of [-0.84, 0.84]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.22, 24), M.tyre); w.rotation.x = Math.PI / 2; w.position.set(sx + 0.0, 0.31, sz); w.castShadow = true; g.add(w);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.235, 16), M.hub); h.rotation.x = Math.PI / 2; h.position.copy(w.position); g.add(h);
  }
  for (const sz of [-0.6, 0.6]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.3), M.headlight); hl.position.set(-2.03, 0.72, sz); g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.26), M.taillight); tl.position.set(2.03, 0.72, sz); g.add(tl);
  }
  return g;
}

/** Everything that does not depend on the configured door. Returns { foliage, lights } for the engine to animate. */
export function buildWorld(scene, M) {
  const world = new THREE.Group(); scene.add(world);
  const B = new Batch(M);
  const foliage = [];
  const blob = (x, y, z, r, c) => foliage.push({ x, y, z, r, c });
  const leafCol = (a) => new THREE.Color().setHSL(0.26 + hash(a, 3) * 0.06, 0.4 + hash(a, 4) * 0.2, 0.2 + hash(a, 5) * 0.12);

  /* ground planes */
  const plane = (w, d, key, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M[key]); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; world.add(m); return m; };
  plane(600, 600, 'grass', 0, -0.13, 0);
  plane(130, 15.4, 'grass', 0, -0.012, -2.3);          // front gardens + house footprint ground
  plane(130, 6.4, 'grass', 0, -0.012, 24);             // opposite gardens
  // pavement (near), kerb, road, kerb, pavement (opposite)
  B.box(130, 0.12, 2.9, 'paving', 0, -0.06, 7.55, { metric: true });
  B.box(130, 0.2, 0.2, 'kerb', 0, -0.1, 9.1, { metric: true });
  B.box(130, 0.12, 9.1, 'tarmac', 0, -0.18, 13.55, { metric: true });
  B.box(130, 0.2, 0.2, 'kerb', 0, -0.1, 18.1, { metric: true });
  B.box(130, 0.12, 2.9, 'paving', 0, -0.06, 19.55, { metric: true });
  // road markings: double yellow lines at the near kerb, dashed white centre line
  B.box(130, 0.004, 0.09, 'yellow', 0, -0.118, 9.42); B.box(130, 0.004, 0.09, 'yellow', 0, -0.118, 9.56);
  for (let x = -60; x < 60; x += 4) B.box(2, 0.004, 0.11, 'trim', x, -0.118, 13.7);

  /* street furniture */
  for (const x of [-WH / 2 - 0.5, WH / 2 + 0.5]) lamp(B, x, 7.7);
  pillarBox(B, -11.4, 8.0);
  bin(B, 'binGreen', 5.6, 4.9, 0.2); bin(B, 'binBlack', 6.3, 5.0, -0.1); bin(B, 'binBlue', -WH * 1.0 - 3.6, 5.1, 0.1);

  /* greenery */
  const shrub = (x, z, s, n) => { for (let i = 0; i < n; i++) blob(x + (hash(i, x) - 0.5) * 0.9 * s, 0.45 * s + hash(i, z) * 0.3, z + (hash(i, z + 9) - 0.5) * 0.5 * s, 0.4 * s + hash(i, 7) * 0.2, leafCol(i + x)); };
  for (const sx of [-1, 1]) { shrub(sx * (WH / 2 + 0.9), 1.2, 1.1, 7); shrub(sx * (WH / 2 + 2.4), 2.4, 0.9, 5); }
  const tree = (x, z, s, kind) => {
    B.cyl(0.14 * s, 0.22 * s, 3.2 * s, 10, 'bark', x, 1.6 * s, z);
    const n = 16, tint = kind === 'blossom' ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const a = hash(i, x) * Math.PI * 2, rr = hash(i, z) * 1.5 * s, c = tint ? new THREE.Color().setHSL(0.95, 0.5 + hash(i, 2) * 0.2, 0.78 + hash(i, 3) * 0.1) : leafCol(i + x * 3);
      blob(x + Math.cos(a) * rr, 3.7 * s + hash(i, 8) * 1.8 * s, z + Math.sin(a) * rr, (0.9 + hash(i, 6) * 0.7) * s, c);
    }
  };
  tree(-WH, 8.15, 1.15, 'plane'); tree(WH + 0.4, 8.15, 1.1, 'blossom'); tree(-WH * 2 - 1.5, 8.15, 1.2, 'plane'); tree(WH * 2 + 1.2, 8.15, 1.05, 'plane');
  for (const [x, z, s] of [[-26, 14, 1.6], [28, 12, 1.5], [-30, -8, 2], [31, -6, 2.2]]) tree(x, z, s, 'plane');

  B.finish(world);

  /* cars on the near side of the road */
  car(world, M, 'carBlue', -6.5, 10.6, 0);
  car(world, M, 'carSilver', 12.5, 16.7, Math.PI);

  /* instanced foliage */
  const fm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), M.foliage, foliage.length);
  const mtx = new THREE.Matrix4();
  foliage.forEach((f, i) => { mtx.compose(new THREE.Vector3(f.x, f.y, f.z), new THREE.Quaternion(), new THREE.Vector3(f.r, f.r * 0.85, f.r)); fm.setMatrixAt(i, mtx); fm.setColorAt(i, f.c); });
  fm.castShadow = true; fm.receiveShadow = true; world.add(fm);

  return { world };
}

/* ------------------------------------------------------------------ hero house: depends on the configured door */
export function buildHero(group, M, d) {
  const { ow, oh, wallKey, parts, cfg, tex, number } = d;
  const hw = WH / 2, rw = Math.max(3.2, ow + 0.9), rh = Math.max(2.8, oh + 0.3), rd = 4.2, wall = M[wallKey];
  const B = new Batch(M);

  // front slab with the opening cut out
  const shape = new THREE.Shape(); shape.moveTo(-hw, -0.05); shape.lineTo(hw, -0.05); shape.lineTo(hw, H); shape.lineTo(-hw, H); shape.closePath();
  const hole = new THREE.Path(); hole.moveTo(-ow / 2, 0); hole.lineTo(-ow / 2, oh); hole.lineTo(ow / 2, oh); hole.lineTo(ow / 2, 0); hole.closePath(); shape.holes.push(hole);
  const slabGeo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false }); slabGeo.translate(0, 0, -T);
  const slab = new THREE.Mesh(slabGeo, wall); slab.castShadow = slab.receiveShadow = true; group.add(slab);

  // hollow body around a room behind the door
  const bodyH = H + 0.05, by = H / 2 - 0.025, bd = DH - T;
  B.box(hw - rw / 2, bodyH, bd, wallKey, -(hw + rw / 2) / 2, by, -(DH + T) / 2, { metric: true });
  B.box(hw - rw / 2, bodyH, bd, wallKey, (hw + rw / 2) / 2, by, -(DH + T) / 2, { metric: true });
  B.box(rw, bodyH, DH - T - rd, wallKey, 0, by, -(T + rd + DH) / 2, { metric: true });
  B.box(rw, H - rh, rd, wallKey, 0, (rh + H) / 2, -(T + rd / 2), { metric: true });
  // interior lining (warm, painted)
  const interior = M.interior || (M.interior = new THREE.MeshStandardMaterial({ color: '#e9dfcd', roughness: 0.9 }));
  const lining = (w, h, x, y, z, rx, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), interior); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; group.add(m); };
  lining(rw, rd, 0, 0.005, -(T + rd / 2), -Math.PI / 2, 0); lining(rw, rd, 0, rh - 0.005, -(T + rd / 2), Math.PI / 2, 0);
  lining(rw, rh, 0, rh / 2, -(T + rd) + 0.005, 0, 0); lining(rd, rh, -rw / 2 + 0.005, rh / 2, -(T + rd / 2), 0, Math.PI / 2); lining(rd, rh, rw / 2 - 0.005, rh / 2, -(T + rd / 2), 0, -Math.PI / 2);
  // hallway floor tiles + a runner so an open door looks lived in
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(rw - 0.1, rd - 0.1), M.tile); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.01, -(T + rd / 2)); group.add(floor);
  const uv = floor.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (rw - 0.1), uv.getY(i) * (rd - 0.1));

  // facade details shared with the neighbours
  house(B, M, { x: 0, key: wallKey, i: 5, hero: true, ow });
  surround(B, 0, ow, oh);
  B.box(ow + 0.5, 0.06, 0.5, 'stoneTrim', 0, 0.02, 0.25);

  B.finish(group);

  // door frame plane + leaf on a hinge
  const frameMat = new THREE.MeshStandardMaterial({ map: tex(parts.full), transparent: true, alphaTest: 0.02, roughness: 0.5 }); frameMat.userData.own = true;
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(ow, oh), frameMat); frame.position.set(0, oh / 2, -0.12); frame.receiveShadow = true; group.add(frame);
  const { rect } = parts, lw = (rect.x1 - rect.x0) / 1000, lh = (rect.y1 - rect.y0) / 1000, thick = 0.07;
  const inside = new THREE.Color(cfg.insideHex), edge = new THREE.Color(cfg.frameHex);
  const front = new THREE.MeshStandardMaterial({ map: tex(parts.leaf), roughness: 0.4, metalness: 0.08 }), back = new THREE.MeshStandardMaterial({ color: inside, roughness: 0.55 }), side = new THREE.MeshStandardMaterial({ color: edge, roughness: 0.55 });
  [front, back, side].forEach((m) => { m.userData.own = true; });
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, thick), [side, side, side, side, front, back]); leaf.castShadow = true;
  const cx = (rect.x0 + rect.x1) / 2000 - ow / 2, cy = oh - (rect.y0 + rect.y1) / 2000;
  const pivot = new THREE.Group(); pivot.position.set(cx + (parts.hingeRight ? lw / 2 : -lw / 2), cy, -0.12 + thick / 2 + 0.005);
  leaf.position.x = parts.hingeRight ? -lw / 2 : lw / 2; pivot.add(leaf); group.add(pivot);
  pivot.userData.dir = (parts.hingeRight ? 1 : -1) * (parts.outward ? 1 : -1);

  // house number plate and lantern
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.17), new THREE.MeshStandardMaterial({ map: TX.numberPlate(number), roughness: 0.4, metalness: 0.4 })); plate.material.userData.own = true; plate.position.set(-(ow / 2 + 0.38), 1.55, 0.02); group.add(plate);
  const lanternY = Math.min(oh * 0.8, 2.2), lx = ow / 2 + 0.38;
  const lan = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.26, 6), M.lampGlass); lan.position.set(lx, lanternY, 0.12); group.add(lan);
  const lcap = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.09, 6), M.iron); lcap.position.set(lx, lanternY + 0.17, 0.12); group.add(lcap);

  // clipped bay trees in black planters either side of the door
  for (const s of [-1, 1]) {
    const x = s * (ow / 2 + 1.15), z = 0.8;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 16), M.plantPot); pot.position.set(x, 0.2, z); pot.castShadow = true; group.add(pot);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.7, 8), M.bark); stem.position.set(x, 0.75, z); group.add(stem);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), new THREE.MeshStandardMaterial({ color: '#2f5a2c', roughness: 0.95 })); crown.material.userData.own = true; crown.position.set(x, 1.3, z); crown.castShadow = true; group.add(crown);
  }
  return { pivot, leaf, rw, rh, rd, lanternPos: new THREE.Vector3(lx, lanternY, 0.7), handleX: cx + (parts.hingeRight ? -lw / 2 + 0.07 : lw / 2 - 0.07), lw };
}
