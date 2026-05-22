import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── Archetype visual configs ──────────────────────────────────────────────────
const CONFIGS = {
  warrior: {
    bodyColor:  0x2C3E50, pantsColor: 0x1C2833,
    accent:     0xC0392B, hairColor:  0x1E1E1E,
    metalness:  0.65,     roughness:  0.35,     bodyWidth: 0.56,
  },
  sage: {
    bodyColor:  0x7D3C98, pantsColor: 0x6C3483,
    accent:     0xBB8FCE, hairColor:  0xC8D0D0,
    metalness:  0.15,     roughness:  0.75,     bodyWidth: 0.42,
  },
  royal: {
    bodyColor:  0x1A237E, pantsColor: 0x283593,
    accent:     0xD4AF37, hairColor:  0x1E1E2E,
    metalness:  0.50,     roughness:  0.40,     bodyWidth: 0.48,
  },
  grinder: {
    bodyColor:  0x2C2C2C, pantsColor: 0x1A1A1A,
    accent:     0xE67E22, hairColor:  0xE8770A,
    metalness:  0.10,     roughness:  0.90,     bodyWidth: 0.50,
  },
  // 'street' is the onboarding name for grinder
  street: {
    bodyColor:  0x2C2C2C, pantsColor: 0x1A1A1A,
    accent:     0xE67E22, hairColor:  0xE8770A,
    metalness:  0.10,     roughness:  0.90,     bodyWidth: 0.50,
  },
  builder: {
    bodyColor:  0x1E8449, pantsColor: 0x1A5276,
    accent:     0x27AE60, hairColor:  0x8B5E3C,
    metalness:  0.12,     roughness:  0.88,     bodyWidth: 0.47,
  },
};

const SKINS = [0xFDBCB4, 0xF1C27D, 0xE8B89A, 0xC68642, 0x8D5524];

// Per-tier: [glow intensity, extra metalness, has crown, full gold]
const TIER_FX = [
  [0,    0,    false, false],
  [0,    0,    false, false],
  [0.08, 0.08, false, false],
  [0.20, 0.15, true,  false],
  [0.42, 0.28, true,  true],
];

function djb2(str) {
  let h = 5381;
  for (let i = 0; i < (str || '').length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return Math.abs(h);
}

function buildCharacter(rawArchetype, tier, seed) {
  const archetype = rawArchetype === 'street' ? 'grinder' : (rawArchetype || 'builder');
  const cfg  = CONFIGS[archetype] || CONFIGS.builder;
  const t    = Math.min(Math.max(tier || 0, 0), 4);
  const [glowInt, metalAdd, hasCrown, golden] = TIER_FX[t];
  const skin = SKINS[djb2(String(seed || 'x')) % 5];
  const bodyHex = golden ? 0xD4AF37 : cfg.bodyColor;

  function mat(hex, opts = {}) {
    return new THREE.MeshStandardMaterial({
      color: hex,
      metalness: Math.min(1, (opts.metalness ?? cfg.metalness) + metalAdd),
      roughness:  Math.max(0, opts.roughness ?? cfg.roughness),
      emissive:  new THREE.Color(hex),
      emissiveIntensity: (opts.emissiveMult ?? 0.5) * glowInt,
    });
  }

  const skinMat   = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.85, metalness: 0 });
  const bodyMat   = mat(bodyHex);
  const pantsMat  = mat(cfg.pantsColor);
  const accentMat = mat(cfg.accent, { emissiveMult: 1.3 });
  const hairMat   = mat(cfg.hairColor, { metalness: 0, roughness: 0.9 });
  const bootMat   = mat(0x111111, { metalness: 0.30, roughness: 0.50 });
  const eyeMat    = new THREE.MeshStandardMaterial({ color: 0x111111 });

  const group = new THREE.Group();

  function box(w, h, d, m, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  }
  function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, rx = 0) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 10), m);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    group.add(mesh);
    return mesh;
  }
  function sph(r, m, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 14), m);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  }

  const bw = cfg.bodyWidth;

  // ── Head & face ──
  box(0.38, 0.42, 0.36, skinMat,  0, 1.20, 0);
  box(0.40, 0.18, 0.38, hairMat,  0, 1.44, 0);       // hair top
  box(0.40, 0.10, 0.12, hairMat,  0, 1.30, -0.17);   // hair back
  box(0.06, 0.044, 0.01, eyeMat, -0.09, 1.21,  0.175);
  box(0.06, 0.044, 0.01, eyeMat,  0.09, 1.21,  0.175);

  // ── Neck ──
  cyl(0.075, 0.085, 0.10, skinMat, 0, 1.04, 0);

  // ── Torso ──
  box(bw,        0.54, 0.28, bodyMat,   0, 0.73, 0);
  box(bw * 0.55, 0.16, 0.30, accentMat, 0, 0.86, 0);  // chest plate

  // ── Arms ──
  const ax = bw / 2 + 0.12;
  box(0.14, 0.30, 0.14, bodyMat,  -ax, 0.78, 0);   // upper left
  box(0.14, 0.30, 0.14, bodyMat,   ax, 0.78, 0);   // upper right
  box(0.12, 0.28, 0.12, skinMat,  -ax, 0.47, 0);   // lower left
  box(0.12, 0.28, 0.12, skinMat,   ax, 0.47, 0);   // lower right

  // ── Belt ──
  box(bw * 1.05, 0.08, 0.30, pantsMat,  0, 0.455, 0);
  box(0.09,      0.07, 0.31, accentMat, 0, 0.455, 0);  // buckle

  // ── Legs ──
  box(0.21, 0.34, 0.22, pantsMat, -0.145, 0.22, 0);
  box(0.21, 0.34, 0.22, pantsMat,  0.145, 0.22, 0);
  box(0.19, 0.32, 0.21, bootMat,  -0.145, -0.10, 0);
  box(0.19, 0.32, 0.21, bootMat,   0.145, -0.10, 0);

  // ── Feet ──
  box(0.22, 0.10, 0.30, bootMat, -0.145, -0.32, 0.04);
  box(0.22, 0.10, 0.30, bootMat,  0.145, -0.32, 0.04);

  // ── Crown (tier ≥ 3) ──────────────────────────────────────────────────────
  if (hasCrown) {
    const gMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37, metalness: 1, roughness: 0.14,
      emissive: new THREE.Color(0xD4AF37), emissiveIntensity: 0.36,
    });
    cyl(0.195, 0.195, 0.07, gMat, 0, 1.52, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.030, 0.13, 6), gMat);
      spike.position.set(Math.cos(a) * 0.13, 1.635, Math.sin(a) * 0.13);
      group.add(spike);
    }
  }

  // ── Archetype props ───────────────────────────────────────────────────────
  if (archetype === 'warrior') {
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.92, roughness: 0.08 });
    box(0.040, 0.52, 0.018, bladeMat, ax + 0.14, 0.60, 0);
    box(0.220, 0.038, 0.020, accentMat, ax + 0.14, 0.37, 0);  // guard
  }

  if (archetype === 'sage') {
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.82 });
    cyl(0.022, 0.022, 0.88, staffMat, ax + 0.15, 0.55, 0);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xA855F7, roughness: 0.08, metalness: 0,
      emissive: new THREE.Color(0xA855F7), emissiveIntensity: 1.0,
    });
    sph(0.085, orbMat, ax + 0.15, 1.03, 0);
  }

  if (archetype === 'royal') {
    const sMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37, metalness: 1, roughness: 0.14,
      emissive: new THREE.Color(0xD4AF37), emissiveIntensity: 0.42,
    });
    cyl(0.022, 0.022, 0.52, sMat, ax + 0.15, 0.67, 0);
    sph(0.065, sMat, ax + 0.15, 0.95, 0);
  }

  if (archetype === 'grinder') {
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.55 });
    const bandMat = mat(cfg.accent, { metalness: 0.1 });
    cyl(0.060, 0.048, 0.14, cupMat, ax + 0.16, 0.47, 0);
    cyl(0.062, 0.062, 0.03, bandMat, ax + 0.16, 0.52, 0);  // logo band
  }

  if (archetype === 'builder') {
    const potMat  = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.92 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x27AE60, roughness: 0.88 });
    cyl(0.065, 0.050, 0.14, potMat, ax + 0.15, 0.44, 0);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.082, 0.21, 6), leafMat);
    leaf.position.set(ax + 0.15, 0.62, 0);
    group.add(leaf);
  }

  return group;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Avatar3D({
  archetype = 'builder',
  userId,
  seed,
  equipment = [],
  overrides = {},
  size = 160,
  showGlow = false,
  accentColor,
  tier = 0,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    // Bust for leaderboard (≤80px), full body for profile/larger
    const isBust = size <= 80;
    camera.position.set(0, isBust ? 1.15 : 0.60, isBust ? 2.5 : 4.8);
    camera.lookAt(0, isBust ? 1.15 : 0.55, 0);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(1.5, 3.5, 2.5);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x6688CC, 0.30);
    fill.position.set(-2, 0.5, 1);
    scene.add(fill);
    const cfg       = CONFIGS[archetype] || CONFIGS.builder;
    const accentHex = accentColor ? parseInt(accentColor.replace('#', ''), 16) : cfg.accent;
    const acLight   = new THREE.PointLight(accentHex, 0.6, 6);
    acLight.position.set(0, 1.4, 2.2);
    scene.add(acLight);
    if (showGlow) {
      const glowLight = new THREE.PointLight(accentHex, 1.2, 3.5);
      glowLight.position.set(0, 0.8, 1.5);
      scene.add(glowLight);
    }

    const character = buildCharacter(archetype, tier, seed ?? userId);
    scene.add(character);

    let animId;
    const t0 = performance.now();
    function animate() {
      animId = requestAnimationFrame(animate);
      const t = (performance.now() - t0) / 1000;
      character.position.y = Math.sin(t * 1.1) * 0.028;
      character.rotation.y = Math.sin(t * 0.38) * 0.14;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      scene.traverse(obj => {
        if (obj.isMesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material?.dispose();
        }
      });
      renderer.dispose();
    };
  }, [archetype, tier, seed, userId, size]);  // eslint-disable-line

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, display: 'block' }}
    />
  );
}
