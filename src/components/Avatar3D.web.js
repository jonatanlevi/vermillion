import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import * as THREE from 'three';

const SKIN_TONES = ['#FDBCB4', '#F1C27D', '#E8B89A', '#C68642', '#8D5524'];

function djb2(str) {
  let h = 5381;
  for (let i = 0; i < (str || '').length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return Math.abs(h);
}

function buildCharacter(overrides, equipment, accentColor, seed) {
  const n    = djb2(seed || '');
  const skin = new THREE.MeshPhongMaterial({ color: SKIN_TONES[n % SKIN_TONES.length], shininess: 20 });
  const body = new THREE.MeshPhongMaterial({ color: overrides.clothesColor ? `#${overrides.clothesColor}` : accentColor, shininess: 70 });
  const dark = new THREE.MeshPhongMaterial({ color: '#111827', shininess: 15 });
  const gold = new THREE.MeshPhongMaterial({ color: '#D4AF37', shininess: 220 });
  const eyeM = new THREE.MeshPhongMaterial({ color: '#111', shininess: 300 });
  const whtM = new THREE.MeshPhongMaterial({ color: '#EEE' });
  const smiM = new THREE.MeshPhongMaterial({ color: '#8B4513' });

  const g = new THREE.Group();

  function add(geo, mat, pos, euler) {
    const m = new THREE.Mesh(geo, mat);
    if (pos)   m.position.set(...pos);
    if (euler) m.rotation.set(...euler);
    g.add(m);
    return m;
  }

  // ── HEAD GROUP (animates independently) ──────────────────────
  const hG = new THREE.Group();
  hG.position.y = 1.60;
  g.add(hG);

  function hadd(geo, mat, pos, euler) {
    const m = new THREE.Mesh(geo, mat);
    if (pos)   m.position.set(...pos);
    if (euler) m.rotation.set(...euler);
    hG.add(m);
    return m;
  }

  hadd(new THREE.SphereGeometry(0.23, 16, 14), skin);

  [-0.09, 0.09].forEach(x => {
    hadd(new THREE.SphereGeometry(0.058, 8, 8), whtM, [x, 0.05, 0.19]);
    hadd(new THREE.SphereGeometry(0.038, 8, 8), eyeM, [x, 0.05, 0.215]);
  });

  hadd(new THREE.TorusGeometry(0.065, 0.013, 6, 12, Math.PI), smiM,
       [0, -0.07, 0.21], [0, 0, Math.PI]);

  // Accessories
  if (overrides.accessories === 'sunglasses') {
    const lM = new THREE.MeshPhongMaterial({ color: '#111', transparent: true, opacity: 0.85 });
    const fM = new THREE.MeshPhongMaterial({ color: '#D4AF37', shininess: 200 });
    [-0.09, 0.09].forEach(x => hadd(new THREE.CircleGeometry(0.062, 12), lM, [x, 0.05, 0.228]));
    hadd(new THREE.BoxGeometry(0.06, 0.012, 0.01), fM, [0, 0.05, 0.226]);
  }

  if (overrides.accessories === 'prescription01') {
    const fM = new THREE.MeshPhongMaterial({ color: '#444', shininess: 80 });
    [-0.09, 0.09].forEach(x => hadd(new THREE.TorusGeometry(0.062, 0.013, 8, 16), fM, [x, 0.05, 0.22]));
    hadd(new THREE.BoxGeometry(0.06, 0.012, 0.01), new THREE.MeshPhongMaterial({ color: '#444' }), [0, 0.05, 0.22]);
  }

  if (overrides.facialHair === 'beardMedium') {
    const bM = new THREE.MeshPhongMaterial({ color: '#3D1A00' });
    hadd(new THREE.SphereGeometry(0.145, 10, 8, 0, Math.PI * 2, Math.PI / 3, Math.PI / 2),
         bM, [0, -0.11, 0.13]);
  }

  if (overrides.top === 'hat') {
    const hM = new THREE.MeshPhongMaterial({ color: '#111', shininess: 40 });
    hadd(new THREE.CylinderGeometry(0.32, 0.32, 0.045, 16), hM, [0, 0.23]);
    hadd(new THREE.CylinderGeometry(0.185, 0.225, 0.27, 16), hM, [0, 0.37]);
  }

  // ── BODY ─────────────────────────────────────────────────────
  add(new THREE.CylinderGeometry(0.09, 0.11, 0.13, 8),    skin, [0, 1.43]);  // neck
  add(new THREE.CylinderGeometry(0.21, 0.18, 0.50, 8),    body, [0, 1.14]);  // torso
  add(new THREE.CylinderGeometry(0.205, 0.205, 0.065, 8), dark, [0, 0.89]);  // belt
  add(new THREE.CylinderGeometry(0.19, 0.16, 0.23, 8),    body, [0, 0.77]);  // hips

  // ── ARMS ─────────────────────────────────────────────────────
  [-1, 1].forEach(s => {
    const x = s * 0.32;
    add(new THREE.SphereGeometry(0.11, 8, 8),              body, [x, 1.30]);  // shoulder
    add(new THREE.CylinderGeometry(0.075, 0.065, 0.32, 8), skin, [x, 1.10]);  // upper arm
    add(new THREE.SphereGeometry(0.07, 8, 8),              skin, [x, 0.93]);  // elbow
    add(new THREE.CylinderGeometry(0.065, 0.058, 0.28, 8), skin, [x, 0.76]);  // forearm
    add(new THREE.SphereGeometry(0.08, 8, 8),              skin, [x, 0.61]);  // hand
  });

  // ── LEGS ─────────────────────────────────────────────────────
  [-1, 1].forEach(s => {
    const x = s * 0.11;
    add(new THREE.CylinderGeometry(0.115, 0.105, 0.38, 8), dark, [x, 0.56]);  // thigh
    add(new THREE.SphereGeometry(0.105, 8, 8),             dark, [x, 0.37]);  // knee
    add(new THREE.CylinderGeometry(0.095, 0.085, 0.30, 8), dark, [x, 0.20]);  // shin
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.25), dark);
    foot.position.set(x, 0.04, 0.04);
    g.add(foot);
  });

  // ── EQUIPMENT (upgrades) ──────────────────────────────────────
  if (equipment.includes('crown')) {
    const cr = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.037, 8, 20), gold);
    cr.position.set(0, 1.84, 0); cr.rotation.x = Math.PI / 2;
    g.add(cr);
    for (let i = 0; i < 5; i++) {
      const a  = (i / 5) * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.15, 6), gold);
      sp.position.set(Math.sin(a) * 0.215, 1.98, Math.cos(a) * 0.215);
      g.add(sp);
    }
  }

  if (equipment.includes('halo')) {
    const hM = new THREE.MeshPhongMaterial({ color: '#FFD700', emissive: '#FFD700', emissiveIntensity: 0.9 });
    const h  = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.025, 8, 32), hM);
    h.position.set(0, 2.09, 0); h.rotation.x = 0.25;
    g.add(h);
  }

  if (equipment.includes('cape')) {
    const cColor = overrides.clothesColor ? `#${overrides.clothesColor}` : accentColor;
    const cM = new THREE.MeshPhongMaterial({ color: cColor, side: THREE.DoubleSide, shininess: 40 });
    const c  = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.31, 0.70, 4, 1, true), cM);
    c.position.set(0, 1.06, -0.17);
    g.add(c);
  }

  if (equipment.includes('aura')) {
    const aM = new THREE.MeshPhongMaterial({
      color: accentColor, transparent: true, opacity: 0.13,
      side: THREE.DoubleSide, emissive: accentColor, emissiveIntensity: 0.5,
    });
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.88, 16, 12), aM);
    a.position.y = 1.0;
    g.add(a);
  }

  return { group: g, headG: hG };
}

export default function Avatar3D({
  avatarUrl, userId, seed, equipment = [], overrides = {},
  size = 100, showGlow, accentColor = '#C0392B',
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isSmall = size <= 100;
    const scene   = new THREE.Scene();
    const camera  = new THREE.PerspectiveCamera(isSmall ? 18 : 42, 1, 0.1, 100);

    if (isSmall) {
      // Head close-up
      camera.position.set(0, 1.63, 0.85);
      camera.lookAt(0, 1.63, 0);
    } else {
      // Full body
      camera.position.set(0, 0.95, 3.2);
      camera.lookAt(0, 0.95, 0);
    }

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (isSmall) renderer.domElement.style.borderRadius = `${size / 2}px`;
    el.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(2, 4, 3);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8888ff, 0.25);
    fill.position.set(-2, 1, -1);
    scene.add(fill);
    const rimL = new THREE.PointLight(new THREE.Color(accentColor), 0.9, 8);
    rimL.position.set(-1.5, 2, -1);
    scene.add(rimL);

    const { group, headG } = buildCharacter(overrides, equipment, accentColor, seed);
    scene.add(group);

    if (showGlow && !isSmall) {
      const dM = new THREE.MeshPhongMaterial({
        color: accentColor, transparent: true, opacity: 0.15,
        emissive: accentColor, emissiveIntensity: 0.5,
      });
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.02, 32), dM);
      scene.add(disc);
    }

    const clock = new THREE.Clock();
    let fId;
    const tick = () => {
      fId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      group.position.y   = Math.sin(t * 1.6) * 0.018;   // gentle bob
      headG.rotation.y   = Math.sin(t * 0.65) * 0.09;   // head sway
      if (!isSmall) group.rotation.y = Math.sin(t * 0.28) * 0.22; // slow body turn
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(fId);
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        }
      });
      renderer.dispose();
      try { el.removeChild(renderer.domElement); } catch {}
    };
  }, [seed, size, accentColor, JSON.stringify(equipment), JSON.stringify(overrides)]);

  return <View ref={ref} style={{ width: size, height: size }} />;
}
