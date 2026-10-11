// @ts-nocheck
// 3D British street with the configured door in the hero house. three.js, loaded lazily from Stage.
// Units are metres. House fronts are on z = 0 and the viewer starts on the road at +z. Scene content lives in ./scene3d.
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { D } from './data';
import { useStore, door } from './store';
import { doorParts } from './lib/render';
import { makeMaterials, buildWorld, buildHero, buildRoof, buildStacks, WALL_KEY, WH } from './scene3d/street';
import { createPerson } from './scene3d/person';
import * as TX from './scene3d/tex';

const OPEN_ANGLE = 1.25; // radians, about 70 degrees: reads as clearly open from the front without going edge-on
const hex = (c) => new THREE.Color(c);
const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

export default function House3D() {
  const { cfg, night, doorOpen, scene3d, patch } = useStore();
  const hostRef = useRef(null), api = useRef(null);
  const [err, setErr] = useState('');

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
    renderer.domElement.setAttribute('aria-label', '3D view of your door on a British street. Drag to rotate, pinch to zoom, tap the door to open it.');
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#c9d8e6', 45, 230);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.2, 1000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false;
    controls.minDistance = 2.4; controls.maxDistance = 24;
    controls.minPolarAngle = 0.3; controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minAzimuthAngle = -1.3; controls.maxAzimuthAngle = 1.3;

    /* image based lighting gives the glass, paint and metal something to reflect */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04); scene.environment = envRT.texture;

    /* sky */
    const sky = new Sky(); sky.scale.setScalar(450); scene.add(sky);
    const su = sky.material.uniforms;
    /* lights */
    const hemi = new THREE.HemisphereLight('#dbe8f5', '#6b7a5a', 0.3); scene.add(hemi);
    const sun = new THREE.DirectionalLight('#fff1dc', 3); sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 14, bottom: -14, near: 1, far: 90 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
    sun.target.position.set(0, 0, 3); scene.add(sun, sun.target);
    const warm = (d) => { const l = new THREE.PointLight('#ffc878', 0, d, 2); scene.add(l); return l; };
    const lampL = warm(16), lampR = warm(16), lantern = warm(7), inner = warm(12);
    lampL.position.set(-WH / 2, 4.0, 7.2); lampR.position.set(WH / 2, 4.0, 7.2);

    /* stars, moon, clouds, halos */
    const r = rng(3), sp = [];
    for (let i = 0; i < 600; i++) { const a = r() * Math.PI * 2, e = 0.15 + r() * 1.2, R = 700; sp.push(Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R, Math.sin(a) * Math.cos(e) * R); }
    const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); scene.add(stars);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 16), new THREE.MeshBasicMaterial({ color: '#e8eefc', transparent: true, opacity: 0, fog: false })); moon.position.set(-260, 330, -520); scene.add(moon);
    const cloudTex = TX.cloud(), cloudMats = [];
    for (let i = 0; i < 16; i++) {
      const m = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.85, fog: false, depthWrite: false, color: '#ffffff' }); cloudMats.push(m);
      const s = new THREE.Sprite(m), a = r() * Math.PI * 1.1 - 0.55 * Math.PI, rad = 450 + r() * 150;
      s.position.set(Math.sin(a) * rad, 90 + r() * 90, -Math.cos(a) * rad * 0.9 + 60); s.scale.set(220 + r() * 160, 80 + r() * 40, 1); scene.add(s);
    }
    const glowTex = TX.glow(), halos = [];
    const halo = (x, y, z, size) => { const m = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); const s = new THREE.Sprite(m); s.position.set(x, y, z); s.scale.set(size, size, 1); scene.add(s); halos.push(m); return s; };
    for (const x of [-WH / 2, WH / 2, -WH * 1.5, WH * 1.5]) halo(x, 4.06, 7.7, 3.2);

    /* world + materials */
    const M = makeMaterials();
    const { world } = buildWorld(scene, M);
    const roofGroup = new THREE.Group(); scene.add(roofGroup);
    const person = createPerson(); scene.add(person.group); person.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });

    let hero = null, heroInfo = null, token = 0, openTarget = 0, dirty = true, camTween = null, lanternHalo = null;
    const env = { t: 0, target: 0 };
    const state = { want: false, open: false, wall: 'brick', roof: 'slate', person: true };
    const disposeGroup = (g) => g.traverse((o) => { if (o.geometry) o.geometry.dispose(); [].concat(o.material || []).forEach((m) => { if (m.userData && m.userData.own) { if (m.map) m.map.dispose(); m.dispose(); } }); });

    function buildRoofs() {
      while (roofGroup.children.length) { const c = roofGroup.children[0]; roofGroup.remove(c); disposeGroup(c); }
      buildRoof(roofGroup, M, -2.5 * WH, 2.5 * WH, `roof_${state.roof}`);
      buildStacks(roofGroup, M, [-2 * WH + WH / 2, -WH / 2, WH / 2, 2 * WH - WH / 2, 2.5 * WH - 0.5, -2.5 * WH + 0.5]);
      dirty = true;
    }

    /* ----- (re)build the hero house for the current door ----- */
    async function rebuild(c) {
      const my = ++token;
      const parts = await doorParts(door, c, 1400);
      if (my !== token) return;
      if (hero) { scene.remove(hero); disposeGroup(hero); }
      hero = new THREE.Group(); scene.add(hero);
      const tex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; };
      heroInfo = buildHero(hero, M, {
        ow: parts.TW / 1000, oh: parts.TH / 1000, wallKey: WALL_KEY[state.wall], parts, tex, number: 24,
        cfg: { insideHex: D.colourById[c.colours.inside].hex, frameHex: D.colourById[c.colours.frame].hex },
      });
      heroInfo.pivot.rotation.y = state.open ? heroInfo.pivot.userData.dir * OPEN_ANGLE : 0; openTarget = heroInfo.pivot.rotation.y;
      inner.position.set(0, heroInfo.rh - 0.4, -1.8);
      lantern.position.copy(heroInfo.lanternPos);
      if (lanternHalo) { scene.remove(lanternHalo); }
      lanternHalo = halo(heroInfo.lanternPos.x, heroInfo.lanternPos.y, 0.3, 1.6);
      // where the person stands: in front of the handle (outward doors: just beside it so the leaf swings clear)
      const hx = heroInfo.handleX, spotX = parts.outward ? hx + (parts.hingeRight ? -0.55 : 0.55) : hx;
      person.setTask({ spot: [spotX, 0.75], handleX: hx, start: [0.1, 8.1] });
      applyEnv(); dirty = true;
    }

    /* ----- day / night ----- */
    const tmp = new THREE.Color(), sunDir = new THREE.Vector3();
    function applyEnv() {
      const t = env.t, lerp = (a, b) => a + (b - a) * t;
      // sky: low sun in the day, blue hour at night
      const elev = THREE.MathUtils.degToRad(lerp(36, -3.5)), azim = THREE.MathUtils.degToRad(150);
      sunDir.set(Math.sin(azim) * Math.cos(elev), Math.sin(elev), Math.cos(azim) * Math.cos(elev));
      su.sunPosition.value.copy(sunDir); su.turbidity.value = lerp(7, 2.5); su.rayleigh.value = lerp(1.3, 0.55); su.mieCoefficient.value = 0.005; su.mieDirectionalG.value = 0.82;
      renderer.toneMappingExposure = lerp(0.62, 0.7);
      scene.environmentIntensity = lerp(0.55, 0.07);
      tmp.set('#c4d3e2').lerp(hex('#0a1124'), t); scene.fog.color.copy(tmp);
      hemi.intensity = lerp(0.3, 0.06); hemi.color.set('#dbe8f5').lerp(hex('#223056'), t);
      const ld = new THREE.Vector3(0.55, lerp(0.8, 0.9), 0.62).normalize(); sun.position.copy(sun.target.position).addScaledVector(ld, 45);
      sun.intensity = lerp(3.2, 0.5); sun.color.set('#fff0d8').lerp(hex('#6f86c4'), t);
      M.curtainLit.emissiveIntensity = t * 1.25; M.lampGlass.emissiveIntensity = t * 3; M.headlight.emissiveIntensity = 0.1 + t * 0.6; M.taillight.emissiveIntensity = 0.1 + t * 0.9;
      lampL.intensity = lampR.intensity = t * 55; lantern.intensity = t * 5;
      inner.intensity = (0.8 + t * 9) * (state.open ? 1.5 : 0.8);
      stars.material.opacity = Math.max(0, t * 1.3 - 0.35); moon.material.opacity = Math.max(0, t * 1.4 - 0.5);
      cloudMats.forEach((m) => { m.color.set('#ffffff').lerp(hex('#202b4a'), t); m.opacity = lerp(0.9, 0.35); });
      halos.forEach((m) => { m.opacity = Math.max(0, t * 1.2 - 0.1) * 0.85; });
      dirty = true;
    }

    /* ----- camera presets ----- */
    const aspect = () => host.clientWidth / Math.max(1, host.clientHeight);
    const VIEWS = {
      front: () => [[0, 3.4, Math.max(21, 19 / aspect())], [0, 3.1, 0]],
      door: () => [[aspect() < 0.9 ? 1.4 : 1.9, 1.55, aspect() < 0.9 ? 6.4 : 4.9], [0, 1.25, 0]],
      left: () => [[-12.5, 3.0, 13], [0, 2.3, 0]],
      right: () => [[12.5, 3.0, 13], [0, 2.3, 0]],
    };
    function view(name, instant, from) {
      const [p, t] = VIEWS[name]();
      if (instant) { camera.position.set(...p); controls.target.set(...t); controls.update(); dirty = true; return; }
      camTween = { t0: performance.now(), dur: from ? 3000 : 1000, p0: from ? new THREE.Vector3(...from) : camera.position.clone(), t0v: controls.target.clone(), p1: new THREE.Vector3(...p), t1v: new THREE.Vector3(...t) };
    }

    const resize = () => { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true; };
    const ro = new ResizeObserver(resize); ro.observe(host); resize();
    controls.addEventListener('change', () => { dirty = true; });

    const hooks = { open: () => { state.open = true; openTarget = heroInfo.pivot.userData.dir * OPEN_ANGLE; applyEnv(); }, close: () => { state.open = false; openTarget = 0; applyEnv(); } };
    let raf, last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.25, (now - last) / 1000); last = now;
      if (Math.abs(env.t - env.target) > 0.002) { env.t += Math.sign(env.target - env.t) * Math.min(Math.abs(env.target - env.t), dt / 1.6); applyEnv(); }
      if (heroInfo) {
        if (state.person) { if (person.update(Math.min(dt, 0.1), state.want, hooks)) dirty = true; }
        const d = openTarget - heroInfo.pivot.rotation.y;
        if (Math.abs(d) > 0.002) { heroInfo.pivot.rotation.y += d * Math.min(1, dt * 3.2); dirty = true; }
      }
      if (camTween) { const k = Math.min(1, (now - camTween.t0) / camTween.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; camera.position.lerpVectors(camTween.p0, camTween.p1, e); controls.target.lerpVectors(camTween.t0v, camTween.t1v, e); if (k >= 1) camTween = null; dirty = true; }
      if (controls.update()) dirty = true;
      if (dirty) { renderer.render(scene, camera); dirty = false; }
    };

    /* tap the door to open or close it */
    let down = null;
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    const onDown = (e) => { down = { x: e.clientX, y: e.clientY }; };
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 || !heroInfo) { down = null; return; }
      down = null;
      const b = renderer.domElement.getBoundingClientRect(); mouse.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(mouse, camera);
      if (ray.intersectObject(heroInfo.leaf, false).length) useStore.getState().patch({ doorOpen: !useStore.getState().doorOpen });
    };
    renderer.domElement.addEventListener('pointerdown', onDown); renderer.domElement.addEventListener('pointerup', onUp);

    api.current = {
      rebuild: (c) => rebuild(c),
      setStyle: (s) => {
        const wallChanged = s.wall !== state.wall, roofChanged = s.roof !== state.roof, personChanged = s.person !== state.person;
        Object.assign(state, { wall: s.wall, roof: s.roof, person: s.person });
        if (roofChanged) buildRoofs();
        if (personChanged) { person.group.visible = s.person; if (!s.person) { person.reset(); if (heroInfo) { state.open = state.want; openTarget = state.want ? heroInfo.pivot.userData.dir * OPEN_ANGLE : 0; } } dirty = true; }
        return { wallChanged };
      },
      setOpen: (o) => { state.want = o; if (!state.person && heroInfo) { state.open = o; openTarget = o ? heroInfo.pivot.userData.dir * OPEN_ANGLE : 0; applyEnv(); } },
      setNight: (n) => { env.target = n ? 1 : 0; },
      view,
      snapshot: () => { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/jpeg', 0.92); },
    };
    patch({ h3: api.current });
    const c0 = useStore.getState();
    Object.assign(state, { want: c0.doorOpen, wall: c0.scene3d.wall, roof: c0.scene3d.roof, person: c0.scene3d.person });
    person.group.visible = state.person; env.t = env.target = c0.night ? 1 : 0;
    buildRoofs(); applyEnv(); view('front', true); view('front', false, [-13, 2.8, 20]);
    rebuild(c0.cfg).then(() => { if (state.want && !state.person) { state.open = true; openTarget = heroInfo.pivot.userData.dir * OPEN_ANGLE; } });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); token++;
      renderer.domElement.removeEventListener('pointerdown', onDown); renderer.domElement.removeEventListener('pointerup', onUp);
      controls.dispose();
      if (hero) disposeGroup(hero); disposeGroup(world); disposeGroup(roofGroup); disposeGroup(person.group);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      [starGeo, cloudTex, glowTex, envRT.texture].forEach((t) => t && t.dispose && t.dispose()); envRT.dispose(); pmrem.dispose();
      M.dispose(); sky.material.dispose();
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
    if (ch.wallChanged) api.current.rebuild(useStore.getState().cfg);
  }, [scene3d]);

  return (
    <div ref={hostRef} style={{ position: 'absolute', inset: 0, zIndex: 3, background: '#c4d3e2' }}>
      {err && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: '#EDEDEC', color: '#2B2D2F' }}>{err} Use the house photo step instead.</div>}
    </div>
  );
}
