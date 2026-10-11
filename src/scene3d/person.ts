// @ts-nocheck
// A simple but properly proportioned person (1.75 m, camel wool coat, jeans, scarf) built from primitives.
// A small state machine walks them up the path, has them open the door and, on request, close it again.
import * as THREE from 'three';

const mat = (color, rough = 0.75, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

export function createPerson() {
  const root = new THREE.Group();
  const skin = mat('#d2a07c', 0.65), coat = mat('#b08a5e', 0.9), jeans = mat('#2c3a55', 0.85), shoe = mat('#e9e7e2', 0.6), hair = mat('#3a2a20', 0.8), scarf = mat('#7a2433', 0.95);
  const cast = (m) => { m.castShadow = true; return m; };

  const body = new THREE.Group(); root.add(body);                 // bobs while walking
  const hips = new THREE.Group(); hips.position.y = 0.92; body.add(hips);

  const leg = (x) => {
    const p = new THREE.Group(); p.position.set(x, 0, 0); hips.add(p);
    const l = cast(new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.62, 6, 12), jeans)); l.position.y = -0.43; p.add(l);
    const f = cast(new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.075, 0.27), shoe)); f.position.set(0, -0.87, 0.06); p.add(f);
    return p;
  };
  const legL = leg(0.1), legR = leg(-0.1);

  const torso = new THREE.Group(); hips.add(torso);
  const chest = cast(new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.34, 8, 16), coat)); chest.scale.set(1.12, 1, 0.78); chest.position.y = 0.36; torso.add(chest);
  const skirt = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.25, 0.4, 16, 1, true), coat)); skirt.material = coat.clone(); skirt.material.side = THREE.DoubleSide; skirt.position.y = -0.1; skirt.scale.z = 0.8; torso.add(skirt);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 12), skin); neck.position.y = 0.64; torso.add(neck);
  const sc = cast(new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.045, 10, 18), scarf)); sc.rotation.x = Math.PI / 2; sc.position.y = 0.6; torso.add(sc);
  const head = cast(new THREE.Mesh(new THREE.SphereGeometry(0.108, 20, 16), skin)); head.scale.set(0.92, 1.12, 1); head.position.y = 0.76; torso.add(head);
  const cap = cast(new THREE.Mesh(new THREE.SphereGeometry(0.114, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), hair)); cap.scale.set(0.96, 1.12, 1.04); cap.position.set(0, 0.775, -0.012); cap.rotation.x = -0.25; torso.add(cap);
  const bob = cast(new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), hair)); bob.scale.set(1.05, 1.1, 0.8); bob.position.set(0, 0.7, -0.07); torso.add(bob);

  const arm = (x) => {
    const p = new THREE.Group(); p.position.set(x, 0.55, 0); torso.add(p);
    const a = cast(new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.46, 6, 12), coat)); a.position.y = -0.27; p.add(a);
    const h = cast(new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), skin)); h.position.y = -0.58; p.add(h);
    return p;
  };
  const armL = arm(0.225), armR = arm(-0.225);

  /* ----- animation state ----- */
  const S = { mode: 'idle', t: 0, phase: 0, yaw: Math.PI, fired: false, start: new THREE.Vector3(0, 0, 8), spot: new THREE.Vector3(0, 0, 0.8), dx: 0, reach: 0 };
  root.position.copy(S.start); root.rotation.y = Math.PI;
  const moveTo = (target, dt, speed) => {
    const d = new THREE.Vector3().subVectors(target, root.position); d.y = 0;
    const dist = d.length();
    if (dist < 0.05) return true;
    d.normalize(); const step = Math.min(dist, speed * dt);
    root.position.addScaledVector(d, step);
    S.yaw = Math.atan2(d.x, d.z);       // local +z is the character's front
    S.phase += step * 5.2;
    return false;
  };
  const turnTo = (yaw, dt) => { let d = yaw - root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); root.rotation.y += d * Math.min(1, dt * 7); };
  const pose = (dt, walking, reachAmt) => {
    const s = walking ? Math.sin(S.phase) : 0;
    legL.rotation.x += ((s * 0.6) - legL.rotation.x) * Math.min(1, dt * 14);
    legR.rotation.x += ((-s * 0.6) - legR.rotation.x) * Math.min(1, dt * 14);
    const swing = walking ? 0.5 : 0;
    const side = S.dx >= 0 ? armR : armL, free = side === armR ? armL : armR;
    free.rotation.x += ((walking ? s * swing : 0.04) - free.rotation.x) * Math.min(1, dt * 12);
    free.rotation.z += (0 - free.rotation.z) * Math.min(1, dt * 10);
    const target = walking ? -s * swing : -0.85 * reachAmt;
    side.rotation.x += (target - side.rotation.x) * Math.min(1, dt * 12);
    const zt = (S.dx >= 0 ? -1 : 1) * Math.min(0.7, Math.abs(S.dx)) * reachAmt;
    side.rotation.z += (zt - side.rotation.z) * Math.min(1, dt * 12);
    body.position.y = walking ? Math.abs(Math.cos(S.phase)) * 0.025 : Math.sin(performance.now() / 900) * 0.002;
    torso.rotation.y = walking ? Math.sin(S.phase) * 0.06 : 0;
    torso.scale.y = 1 + (walking ? 0 : Math.sin(performance.now() / 1100) * 0.004);
  };

  return {
    group: root,
    /** spot: [x, z] to stand at; handleX: world x of the handle; start: [x, z] where they begin. */
    setTask({ spot, handleX, start }) {
      S.spot.set(spot[0], 0, spot[1]); S.dx = handleX - spot[0];
      if (start) S.start.set(start[0], 0, start[1]);
      if (S.mode === 'idle') { root.position.copy(S.start); }
    },
    /** Advance one frame. want = door should be open. hooks fire at the moment the hand reaches the handle. Returns whether the figure is moving. */
    update(dt, want, hooks) {
      let walking = false, reach = 0;
      switch (S.mode) {
        case 'idle': if (want) S.mode = 'walkTo'; turnTo(Math.PI, dt); break;
        case 'walkTo': {
          // go up the path in a straight line from the gate, then sidestep to the spot
          const via = new THREE.Vector3(S.spot.x, 0, Math.max(S.spot.z + 1.2, 2));
          const waypoint = root.position.z > via.z + 0.1 ? via : S.spot;
          walking = !moveTo(waypoint, dt, 1.45);
          turnTo(S.yaw, dt);
          if (!walking && waypoint === S.spot) { S.mode = 'reachOpen'; S.t = 0; S.fired = false; }
          break;
        }
        case 'reachOpen':
          S.t += dt; turnTo(Math.PI, dt);
          reach = Math.min(1, S.t / 0.55);
          if (S.t > 0.7 && !S.fired) { S.fired = true; hooks.open(); }
          if (S.t > 1.7) { reach = Math.max(0, 1 - (S.t - 1.7) / 0.4); }
          if (S.t > 2.1) S.mode = 'standing';
          break;
        case 'standing': turnTo(Math.PI + 0.7, dt); if (!want) { S.mode = 'reachClose'; S.t = 0; S.fired = false; } break;
        case 'reachClose':
          S.t += dt; turnTo(Math.PI, dt);
          reach = Math.min(1, S.t / 0.55);
          if (S.t > 0.7 && !S.fired) { S.fired = true; hooks.close(); }
          if (S.t > 1.7) { reach = Math.max(0, 1 - (S.t - 1.7) / 0.4); }
          if (S.t > 2.1) S.mode = 'walkBack';
          break;
        case 'walkBack': {
          walking = !moveTo(S.start, dt, 1.45);
          turnTo(S.yaw, dt);
          if (want) S.mode = 'walkTo';
          else if (!walking) S.mode = 'idle';
          break;
        }
      }
      pose(dt, walking, reach);
      return S.mode !== 'idle' || walking;
    },
    /** True once they have finished opening and are standing at the door. */
    get atDoor() { return S.mode === 'standing' || S.mode === 'reachClose'; },
    get mode() { return S.mode; },
    reset() { S.mode = 'idle'; root.position.copy(S.start); root.rotation.y = Math.PI; },
  };
}
