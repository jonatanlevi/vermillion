import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

const SKIN_TONES = ['#FDBCB4', '#F1C27D', '#E8B89A', '#C68642', '#8D5524'];

function djb2(str) {
  let h = 5381;
  for (let i = 0; i < (str || '').length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return Math.abs(h);
}

function adj(hex, amt) {
  const h = (hex || '#888888').replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(h.slice(0,2)||'88',16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(h.slice(2,4)||'88',16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(h.slice(4,6)||'88',16) + amt));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

const CONFIGS = {
  warrior: { hair:'#1E1E1E', hairStyle:'short',  mood:'frown',  brows:'furrow', accent:'#C0392B', clothColor:'#5D6D7E', pantColor:'#1C2833', shoeColor:'#111' },
  sage:    { hair:'#C8D0D0', hairStyle:'long',   mood:'calm',   brows:'raised', accent:'#9B59B6', clothColor:'#7D3C98', pantColor:'#6C3483', shoeColor:'#9A7D0A' },
  royal:   { hair:'#1E1E2E', hairStyle:'neat',   mood:'smirk',  brows:'arch',   accent:'#D4AF37', clothColor:'#1A237E', pantColor:'#1A237E', shoeColor:'#111' },
  grinder: { hair:'#E8770A', hairStyle:'messy',  mood:'focus',  brows:'normal', accent:'#E67E22', clothColor:'#E67E22', pantColor:'#2C2C2C', shoeColor:'#F5F5F5' },
  builder: { hair:'#8B5E3C', hairStyle:'wavy',   mood:'smile',  brows:'normal', accent:'#27AE60', clothColor:'#27AE60', pantColor:'#2471A3', shoeColor:'#6D4C41' },
};

// ── DEFS + STYLE ─────────────────────────────────────────────────────────────

function buildDefsAndStyle(uid, skin, cfg, archetype) {
  const C = cfg;
  const defs = `
<linearGradient id="${uid}sk" x1="0.3" y1="0" x2="0.7" y2="1">
  <stop offset="0%"   stop-color="${adj(skin,18)}"/>
  <stop offset="55%"  stop-color="${skin}"/>
  <stop offset="100%" stop-color="${adj(skin,-22)}"/>
</linearGradient>
<linearGradient id="${uid}cl" x1="0.15" y1="0" x2="0.85" y2="1">
  <stop offset="0%"   stop-color="${adj(C.clothColor,35)}"/>
  <stop offset="45%"  stop-color="${C.clothColor}"/>
  <stop offset="100%" stop-color="${adj(C.clothColor,-30)}"/>
</linearGradient>
<linearGradient id="${uid}pt" x1="0.1" y1="0" x2="0.9" y2="1">
  <stop offset="0%"   stop-color="${adj(C.pantColor,25)}"/>
  <stop offset="100%" stop-color="${adj(C.pantColor,-25)}"/>
</linearGradient>
<linearGradient id="${uid}hr" x1="0.3" y1="0" x2="0.6" y2="1">
  <stop offset="0%"   stop-color="${adj(C.hair,30)}"/>
  <stop offset="100%" stop-color="${C.hair}"/>
</linearGradient>
<linearGradient id="${uid}ac" x1="0" y1="0" x2="0.4" y2="1">
  <stop offset="0%"   stop-color="${adj(C.accent,40)}"/>
  <stop offset="100%" stop-color="${adj(C.accent,-10)}"/>
</linearGradient>
<linearGradient id="${uid}sh" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%"   stop-color="${adj(C.shoeColor,20)}"/>
  <stop offset="100%" stop-color="${adj(C.shoeColor,-15)}"/>
</linearGradient>
<linearGradient id="${uid}wh" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%"   stop-color="#FFFFFF"/>
  <stop offset="100%" stop-color="#D0D0D0"/>
</linearGradient>
<linearGradient id="${uid}gd" x1="0" y1="0" x2="0.3" y2="1">
  <stop offset="0%"   stop-color="#F9E79F"/>
  <stop offset="100%" stop-color="#D4AF37"/>
</linearGradient>
<linearGradient id="${uid}st" x1="0.1" y1="0" x2="0.9" y2="1">
  <stop offset="0%"   stop-color="${adj(C.clothColor,50)}" stop-opacity="0.6"/>
  <stop offset="100%" stop-color="${adj(C.clothColor,-10)}" stop-opacity="0.15"/>
</linearGradient>
<radialGradient id="${uid}aura" cx="50%" cy="60%" r="50%">
  <stop offset="0%"   stop-color="${C.accent}" stop-opacity="0.18"/>
  <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
</radialGradient>
<filter id="${uid}ds" x="-15%" y="-10%" width="130%" height="130%">
  <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.28"/>
</filter>
<filter id="${uid}gl" x="-40%" y="-40%" width="180%" height="180%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/>
  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>`;

  const bob  = archetype === 'grinder' ? '2.8s' : archetype === 'warrior' ? '3.2s' : '3.8s';
  const sway = archetype === 'sage' ? '5.2s' : archetype === 'royal' ? '5.8s' : '4.4s';

  const style = `
@keyframes ${uid}bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes ${uid}sw{0%,100%{transform:rotate(0deg)}28%{transform:rotate(-1.8deg)}72%{transform:rotate(2deg)}}
@keyframes ${uid}stm{0%{transform:translateY(0);opacity:0}20%{opacity:.7}80%{opacity:.25}100%{transform:translateY(-13px);opacity:0}}
@keyframes ${uid}spk{0%,100%{opacity:0;transform:scale(.4) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(15deg)}}
@keyframes ${uid}pls{0%,100%{opacity:.55}50%{opacity:1}}
.${uid}b{animation:${uid}bob ${bob} ease-in-out infinite}
.${uid}h{animation:${uid}sw ${sway} ease-in-out infinite;transform-box:fill-box;transform-origin:center 90%}
.${uid}t1{animation:${uid}stm 2.4s ease-out infinite}
.${uid}t2{animation:${uid}stm 2.4s ease-out .75s infinite}
.${uid}t3{animation:${uid}stm 2.4s ease-out 1.5s infinite}
.${uid}p1{animation:${uid}spk 2.2s ease-in-out infinite}
.${uid}p2{animation:${uid}spk 2.2s ease-in-out .7s infinite}
.${uid}p3{animation:${uid}spk 2.2s ease-in-out 1.45s infinite}
.${uid}gl{animation:${uid}pls 2.8s ease-in-out infinite}`;

  return { defs, style };
}

// ── FACE ─────────────────────────────────────────────────────────────────────

function buildFace({ uid, skin, hairColor, hairStyle, mood, brows, glasses, beard }) {
  const p = [];

  // Ears
  p.push(`<ellipse cx="36.5" cy="26" rx="2.5" ry="3.5" fill="url(#${uid}sk)"/>`);
  p.push(`<ellipse cx="63.5" cy="26" rx="2.5" ry="3.5" fill="url(#${uid}sk)"/>`);
  p.push(`<ellipse cx="36.5" cy="26" rx="1.2" ry="2" fill="${adj(skin,-18)}" opacity=".4"/>`);
  p.push(`<ellipse cx="63.5" cy="26" rx="1.2" ry="2" fill="${adj(skin,-18)}" opacity=".4"/>`);

  // Head
  p.push(`<ellipse cx="50" cy="26" rx="14" ry="15" fill="url(#${uid}sk)" filter="url(#${uid}ds)"/>`);
  // Subtle cheek blush
  p.push(`<ellipse cx="41" cy="29" rx="4.5" ry="3" fill="${skin}" opacity=".35" style="mix-blend-mode:multiply"/>`);
  p.push(`<ellipse cx="59" cy="29" rx="4.5" ry="3" fill="${skin}" opacity=".35" style="mix-blend-mode:multiply"/>`);

  // Hair
  if (hairStyle === 'short') {
    p.push(`<ellipse cx="50" cy="14.5" rx="14" ry="7.5" fill="url(#${uid}hr)"/>`);
    p.push(`<rect x="36" y="14" width="28" height="10" fill="url(#${uid}hr)"/>`);
    p.push(`<ellipse cx="37" cy="22" rx="2.5" ry="6.5" fill="url(#${uid}hr)"/>`);
    p.push(`<ellipse cx="63" cy="22" rx="2.5" ry="6.5" fill="url(#${uid}hr)"/>`);
    // Hair highlight
    p.push(`<ellipse cx="46" cy="13" rx="6" ry="3" fill="${adj(hairColor,55)}" opacity=".3"/>`);
  } else if (hairStyle === 'long') {
    p.push(`<ellipse cx="50" cy="13" rx="14" ry="8" fill="url(#${uid}hr)"/>`);
    p.push(`<rect x="36" y="13" width="28" height="11" fill="url(#${uid}hr)"/>`);
    p.push(`<path d="M36 18 Q32 30 34 55" stroke="url(#${uid}hr)" stroke-width="7" fill="none" stroke-linecap="round"/>`);
    p.push(`<path d="M64 18 Q68 30 66 55" stroke="url(#${uid}hr)" stroke-width="7" fill="none" stroke-linecap="round"/>`);
    // Sheen
    p.push(`<ellipse cx="45" cy="12" rx="5" ry="2.5" fill="${adj(hairColor,60)}" opacity=".35"/>`);
  } else if (hairStyle === 'neat') {
    p.push(`<ellipse cx="50" cy="13" rx="14" ry="7.5" fill="url(#${uid}hr)"/>`);
    p.push(`<rect x="36" y="13" width="28" height="11" fill="url(#${uid}hr)"/>`);
    p.push(`<ellipse cx="37" cy="21" rx="2.5" ry="7" fill="url(#${uid}hr)"/>`);
    p.push(`<ellipse cx="63" cy="21" rx="2.5" ry="7" fill="url(#${uid}hr)"/>`);
    // Side part crease
    p.push(`<line x1="50" y1="11" x2="37" y2="20" stroke="${adj(skin,-5)}" stroke-width="1.8" opacity=".35" stroke-linecap="round"/>`);
    p.push(`<ellipse cx="44" cy="12" rx="5" ry="2.5" fill="${adj(hairColor,55)}" opacity=".3"/>`);
  } else if (hairStyle === 'messy') {
    p.push(`<ellipse cx="50" cy="13" rx="14" ry="7.5" fill="url(#${uid}hr)"/>`);
    p.push(`<rect x="36" y="13" width="28" height="10" fill="url(#${uid}hr)"/>`);
    p.push(`<polygon points="40,13 42,5 44.5,13" fill="${hairColor}"/>`);
    p.push(`<polygon points="46,12 48.5,4 51,12" fill="${adj(hairColor,15)}"/>`);
    p.push(`<polygon points="53,12 56,5 58.5,12" fill="${hairColor}"/>`);
    p.push(`<polygon points="60,13 62,7 64,13" fill="${adj(hairColor,-10)}"/>`);
    p.push(`<ellipse cx="37" cy="22" rx="2.5" ry="6" fill="url(#${uid}hr)"/>`);
    p.push(`<ellipse cx="63" cy="22" rx="2.5" ry="6" fill="url(#${uid}hr)"/>`);
  } else if (hairStyle === 'wavy') {
    p.push(`<path d="M36 20 Q38 11 50 11 Q62 11 64 20 Q62 14 50 14 Q38 14 36 20Z" fill="url(#${uid}hr)"/>`);
    p.push(`<path d="M36 17 Q37 12 43 12 Q46 11 50 11 Q54 11 57 12 Q63 12 64 17" fill="url(#${uid}hr)"/>`);
    p.push(`<ellipse cx="37" cy="22" rx="2.5" ry="7" fill="url(#${uid}hr)"/>`);
    p.push(`<ellipse cx="63" cy="22" rx="2.5" ry="7" fill="url(#${uid}hr)"/>`);
    p.push(`<path d="M37 22 Q35 29 36 35" stroke="${hairColor}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`);
    p.push(`<path d="M63 22 Q65 29 64 35" stroke="${hairColor}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`);
    p.push(`<ellipse cx="45" cy="12" rx="5" ry="2.5" fill="${adj(hairColor,50)}" opacity=".35"/>`);
  }

  // Eyes — white sclera
  p.push(`<ellipse cx="44.5" cy="24" rx="3.2" ry="2.8" fill="white"/>`);
  p.push(`<ellipse cx="55.5" cy="24" rx="3.2" ry="2.8" fill="white"/>`);
  // Iris
  p.push(`<circle cx="45.2" cy="24.2" r="1.9" fill="#3A2A1A"/>`);
  p.push(`<circle cx="56.2" cy="24.2" r="1.9" fill="#3A2A1A"/>`);
  // Pupil
  p.push(`<circle cx="45.4" cy="24.3" r="1.1" fill="#0D0D0D"/>`);
  p.push(`<circle cx="56.4" cy="24.3" r="1.1" fill="#0D0D0D"/>`);
  // Catchlight
  p.push(`<circle cx="46.2" cy="23.2" r="0.7" fill="white"/>`);
  p.push(`<circle cx="57.2" cy="23.2" r="0.7" fill="white"/>`);
  // Eye shadow top
  p.push(`<path d="M41.3 21.5 Q44.5 20 47.7 21.5" stroke="${adj(skin,-30)}" stroke-width="1" fill="none" opacity=".4" stroke-linecap="round"/>`);
  p.push(`<path d="M52.3 21.5 Q55.5 20 58.7 21.5" stroke="${adj(skin,-30)}" stroke-width="1" fill="none" opacity=".4" stroke-linecap="round"/>`);

  // Eyebrows
  const brC = adj(hairColor, -10);
  if (brows === 'furrow') {
    p.push(`<path d="M41 20 Q44.5 17.5 48 19.5" stroke="${brC}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);
    p.push(`<path d="M52 19.5 Q55.5 17.5 59 20" stroke="${brC}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);
    // Inner crease
    p.push(`<line x1="47" y1="19.5" x2="48.5" y2="21.5" stroke="${brC}" stroke-width="1" opacity=".5" stroke-linecap="round"/>`);
    p.push(`<line x1="53" y1="19.5" x2="51.5" y2="21.5" stroke="${brC}" stroke-width="1" opacity=".5" stroke-linecap="round"/>`);
  } else if (brows === 'raised') {
    p.push(`<path d="M41 19 Q44.5 16 48 18.5" stroke="${brC}" stroke-width="2" fill="none" stroke-linecap="round"/>`);
    p.push(`<path d="M52 18.5 Q55.5 16 59 19" stroke="${brC}" stroke-width="2" fill="none" stroke-linecap="round"/>`);
  } else if (brows === 'arch') {
    p.push(`<path d="M41 20 Q44.5 17 48.5 19.5" stroke="${brC}" stroke-width="2.1" fill="none" stroke-linecap="round"/>`);
    p.push(`<path d="M51.5 19 Q55 16.5 59 19.5" stroke="${brC}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
  } else {
    p.push(`<path d="M41 19.5 Q44.5 17.8 48 19.5" stroke="${brC}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`);
    p.push(`<path d="M52 19.5 Q55.5 17.8 59 19.5" stroke="${brC}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`);
  }

  // Nose
  p.push(`<path d="M48.5 28.5 Q50 30.5 51.5 28.5" stroke="${adj(skin,-28)}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/>`);
  p.push(`<circle cx="48.7" cy="29.5" r="0.8" fill="${adj(skin,-20)}" opacity=".5"/>`);
  p.push(`<circle cx="51.3" cy="29.5" r="0.8" fill="${adj(skin,-20)}" opacity=".5"/>`);

  // Mouth
  const lipColor = adj(skin, -40);
  if (mood === 'smile') {
    p.push(`<path d="M45 32 Q50 37 55 32" stroke="${lipColor}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`);
    p.push(`<path d="M47 33 Q50 35.5 53 33" fill="${adj(skin,-25)}" stroke="none" opacity=".5"/>`);
  } else if (mood === 'smirk') {
    p.push(`<path d="M46 32.5 Q50 35 54.5 31" stroke="${lipColor}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`);
    p.push(`<ellipse cx="53" cy="31.8" rx="1.5" ry="0.8" fill="${adj(skin,-25)}" opacity=".4"/>`);
  } else if (mood === 'frown') {
    p.push(`<path d="M46 34 Q50 31 54 34" stroke="${lipColor}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`);
  } else if (mood === 'focus') {
    p.push(`<line x1="46" y1="32" x2="54" y2="32" stroke="${lipColor}" stroke-width="1.8" stroke-linecap="round"/>`);
    p.push(`<line x1="47" y1="33.5" x2="53" y2="33.5" stroke="${adj(skin,-15)}" stroke-width="0.8" stroke-linecap="round" opacity=".4"/>`);
  } else {
    p.push(`<path d="M47 32 Q50 34.5 53 32" stroke="${lipColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`);
  }

  // Lip highlight
  p.push(`<ellipse cx="50" cy="31.5" rx="2.5" ry="0.9" fill="white" opacity=".12"/>`);

  // Glasses
  if (glasses === 'prescription01') {
    p.push(`<circle cx="44.5" cy="24" r="4.5" stroke="#666" stroke-width="1.3" fill="none"/>`);
    p.push(`<circle cx="55.5" cy="24" r="4.5" stroke="#666" stroke-width="1.3" fill="none"/>`);
    p.push(`<line x1="49" y1="24" x2="51" y2="24" stroke="#666" stroke-width="1.1"/>`);
    p.push(`<line x1="36" y1="23" x2="40" y2="24" stroke="#666" stroke-width="1.1"/>`);
    p.push(`<line x1="60" y1="24" x2="64" y2="23" stroke="#666" stroke-width="1.1"/>`);
    // Lens glint
    p.push(`<path d="M41 21 Q43 20 45 21" stroke="white" stroke-width="0.8" fill="none" opacity=".5"/>`);
    p.push(`<path d="M52 21 Q54 20 56 21" stroke="white" stroke-width="0.8" fill="none" opacity=".5"/>`);
  } else if (glasses === 'sunglasses') {
    p.push(`<ellipse cx="44.5" cy="24" rx="5" ry="3.8" fill="#111" opacity=".9"/>`);
    p.push(`<ellipse cx="55.5" cy="24" rx="5" ry="3.8" fill="#111" opacity=".9"/>`);
    p.push(`<line x1="49.5" y1="24" x2="50.5" y2="24" stroke="#D4AF37" stroke-width="1.3"/>`);
    p.push(`<line x1="36" y1="23" x2="39.5" y2="24" stroke="#D4AF37" stroke-width="1.1"/>`);
    p.push(`<line x1="60.5" y1="24" x2="64" y2="23" stroke="#D4AF37" stroke-width="1.1"/>`);
    p.push(`<path d="M41 21.5 Q44 20.5 46 22" stroke="white" stroke-width="0.7" fill="none" opacity=".35"/>`);
    p.push(`<path d="M52 21.5 Q55 20.5 57 22" stroke="white" stroke-width="0.7" fill="none" opacity=".35"/>`);
  }

  // Beard
  if (beard) {
    p.push(`<path d="M37 31 Q38 40 50 42 Q62 40 63 31 Q56 36 50 37 Q44 36 37 31Z" fill="${hairColor}" opacity=".7"/>`);
    p.push(`<path d="M37 31 Q38 40 50 42 Q62 40 63 31 Q56 36 50 37 Q44 36 37 31Z" fill="url(#${uid}hr)" opacity=".4"/>`);
  }

  return p.join('');
}

// ── BODIES ───────────────────────────────────────────────────────────────────

function buildWarrior(uid, skin) {
  return `
  <!-- neck -->
  <rect x="45.5" y="40" width="9" height="9" rx="3" fill="url(#${uid}sk)"/>
  <!-- collar plate -->
  <path d="M40 44 Q50 48 60 44 L62 50 Q50 55 38 50Z" fill="${adj('#5D6D7E',20)}"/>
  <!-- shoulder pads -->
  <ellipse cx="28" cy="51" rx="11" ry="7" fill="url(#${uid}cl)" filter="url(#${uid}ds)"/>
  <ellipse cx="72" cy="51" rx="11" ry="7" fill="url(#${uid}cl)" filter="url(#${uid}ds)"/>
  <ellipse cx="28" cy="49.5" rx="7" ry="3" fill="${adj('#5D6D7E',45)}" opacity=".4"/>
  <ellipse cx="72" cy="49.5" rx="7" ry="3" fill="${adj('#5D6D7E',45)}" opacity=".4"/>
  <!-- chest plate -->
  <path d="M32 48 L68 48 L71 88 L29 88Z" fill="url(#${uid}cl)" filter="url(#${uid}ds)"/>
  <!-- plate sheen -->
  <path d="M37 48 L52 52 L50 88 L35 88Z" fill="white" opacity=".06"/>
  <!-- red energy emblem -->
  <path d="M42 54 L50 64 L58 54" stroke="#C0392B" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="50" y1="64" x2="50" y2="84" stroke="#C0392B" stroke-width="2.5" stroke-linecap="round"/>
  <!-- plate edge highlights -->
  <line x1="32" y1="48" x2="29" y2="88" stroke="white" stroke-width="0.8" opacity=".2" stroke-linecap="round"/>
  <line x1="68" y1="48" x2="71" y2="88" stroke="white" stroke-width="0.8" opacity=".2" stroke-linecap="round"/>
  <!-- belt -->
  <rect x="29" y="86" width="42" height="6.5" rx="2" fill="#1C2833"/>
  <rect x="46.5" y="87" width="7" height="4.5" rx="1.2" fill="url(#${uid}gd)"/>
  <!-- pants -->
  <path d="M29 92 L45 92 L43 138 L29 138Z" fill="url(#${uid}pt)"/>
  <path d="M71 92 L55 92 L57 138 L71 138Z" fill="url(#${uid}pt)"/>
  <!-- knee guards -->
  <ellipse cx="37" cy="115" rx="6.5" ry="4" fill="${adj('#1C2833',20)}"/>
  <ellipse cx="63" cy="115" rx="6.5" ry="4" fill="${adj('#1C2833',20)}"/>
  <!-- boots -->
  <path d="M27 135 L43 135 L42 150 L26 150Z" fill="url(#${uid}sh)"/>
  <path d="M57 135 L73 135 L74 150 L58 150Z" fill="url(#${uid}sh)"/>
  <rect x="24" y="146" width="21" height="5" rx="2.5" fill="${adj('#111',-5)}"/>
  <rect x="55" y="146" width="21" height="5" rx="2.5" fill="${adj('#111',-5)}"/>
  <!-- boot strap -->
  <rect x="27" y="138" width="16" height="2.5" rx="1" fill="#C0392B" opacity=".8"/>
  <rect x="57" y="138" width="16" height="2.5" rx="1" fill="#C0392B" opacity=".8"/>
  <!-- left arm -->
  <rect x="17" y="48" width="12" height="30" rx="5" fill="url(#${uid}cl)"/>
  <rect x="17" y="76" width="12" height="12" rx="4" fill="url(#${uid}sk)"/>
  <!-- arm bracer -->
  <rect x="17" y="70" width="12" height="5" rx="2" fill="#1C2833"/>
  <line x1="17" y1="72" x2="29" y2="72" stroke="#C0392B" stroke-width="1.2" opacity=".7"/>
  <!-- right arm -->
  <rect x="71" y="48" width="12" height="30" rx="5" fill="url(#${uid}cl)"/>
  <rect x="71" y="76" width="12" height="12" rx="4" fill="url(#${uid}sk)"/>
  <rect x="71" y="70" width="12" height="5" rx="2" fill="#1C2833"/>
  <line x1="71" y1="72" x2="83" y2="72" stroke="#C0392B" stroke-width="1.2" opacity=".7"/>
  <!-- sword grip -->
  <rect x="77" y="86" width="5.5" height="22" rx="2.5" fill="#8B7355"/>
  <rect x="77" y="102" width="5.5" height="5" rx="1" fill="#6B5335"/>
  <!-- crossguard -->
  <rect x="72" y="93" width="16" height="4" rx="2" fill="url(#${uid}gd)"/>
  <ellipse cx="80" cy="95" rx="4" ry="2" fill="${adj('#D4AF37',30)}" opacity=".5"/>
  <!-- blade -->
  <path d="M78.5 107 L81.5 107 L80 148 Z" fill="url(#${uid}wh)"/>
  <line x1="80" y1="108" x2="80" y2="147" stroke="white" stroke-width="0.6" opacity=".5"/>
  <!-- pommel -->
  <ellipse cx="80" cy="90" rx="4" ry="3.5" fill="url(#${uid}gd)" filter="url(#${uid}ds)"/>
  `;
}

function buildSage(uid, skin) {
  return `
  <!-- neck -->
  <rect x="45.5" y="40" width="9" height="9" rx="3" fill="url(#${uid}sk)"/>
  <!-- inner robe (lighter) -->
  <path d="M36 45 Q50 50 64 45 L70 95 L30 95Z" fill="${adj('#7D3C98',25)}" opacity=".5"/>
  <!-- robe body -->
  <path d="M30 45 Q24 65 20 97 L80 97 Q76 65 70 45Z" fill="url(#${uid}cl)" filter="url(#${uid}ds)"/>
  <!-- robe skirt -->
  <path d="M20 95 Q14 115 11 152 L89 152 Q86 115 80 95Z" fill="url(#${uid}cl)"/>
  <!-- robe sheen -->
  <path d="M30 45 Q25 65 22 100 L32 100 Q35 70 38 50Z" fill="white" opacity=".07"/>
  <!-- collar V -->
  <path d="M43 45 Q50 55 57 45" stroke="${adj('#7D3C98',50)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- robe trim (gold) -->
  <path d="M30 45 Q25 65 20 97" stroke="${adj('#D4AF37',-10)}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/>
  <path d="M70 45 Q75 65 80 97" stroke="${adj('#D4AF37',-10)}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/>
  <path d="M11 152 L89 152" stroke="${adj('#D4AF37',-10)}" stroke-width="1.5" opacity=".5"/>
  <!-- stars on robe -->
  <text class="${uid}p1" x="23" y="73" font-size="9" fill="#E8DAEF" text-anchor="middle">✦</text>
  <text class="${uid}p2" x="72" y="68" font-size="7" fill="#E8DAEF" text-anchor="middle">✦</text>
  <text class="${uid}p3" x="28" y="118" font-size="6" fill="#E8DAEF" text-anchor="middle">✦</text>
  <!-- left sleeve -->
  <path d="M30 45 Q12 58 10 88 Q16 92 22 86 Q24 64 33 54Z" fill="url(#${uid}cl)"/>
  <!-- left hand -->
  <ellipse cx="12" cy="91" rx="6" ry="5.5" fill="url(#${uid}sk)"/>
  <!-- book cover -->
  <rect x="3" y="87" width="18" height="25" rx="3" fill="url(#${uid}gd)" filter="url(#${uid}ds)"/>
  <!-- book pages -->
  <rect x="4.5" y="88.5" width="15" height="22" rx="2" fill="#FEF9E7"/>
  <rect x="12" y="88.5" width="1" height="22" fill="${adj('#D4AF37',-20)}" opacity=".4"/>
  <line x1="5.5" y1="94" x2="11" y2="94" stroke="#C8A060" stroke-width="0.8" opacity=".6"/>
  <line x1="5.5" y1="97" x2="11" y2="97" stroke="#C8A060" stroke-width="0.8" opacity=".6"/>
  <line x1="5.5" y1="100" x2="11" y2="100" stroke="#C8A060" stroke-width="0.8" opacity=".6"/>
  <line x1="13" y1="94" x2="19" y2="94" stroke="#C8A060" stroke-width="0.8" opacity=".6"/>
  <line x1="13" y1="97" x2="19" y2="97" stroke="#C8A060" stroke-width="0.8" opacity=".6"/>
  <!-- right sleeve -->
  <path d="M70 45 Q88 58 90 86 Q84 92 78 86 Q76 64 67 54Z" fill="url(#${uid}cl)"/>
  <!-- right hand raised / holding staff top -->
  <ellipse cx="88" cy="89" rx="6" ry="5.5" fill="url(#${uid}sk)"/>
  <!-- staff -->
  <line x1="88" y1="91" x2="88" y2="152" stroke="${adj('#D4AF37',-30)}" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="88" y1="91" x2="88" y2="152" stroke="url(#${uid}gd)" stroke-width="2" stroke-linecap="round" opacity=".7"/>
  <!-- staff orb -->
  <circle cx="88" cy="87" r="6" fill="url(#${uid}ac)" class="${uid}gl" filter="url(#${uid}gl)"/>
  <circle cx="88" cy="87" r="4" fill="${adj('#9B59B6',40)}"/>
  <circle cx="86.5" cy="85.5" r="1.5" fill="white" opacity=".5"/>
  <!-- sandals -->
  <path d="M26 150 Q25 157 40 158 Q50 158 49 153 L28 150Z" fill="${adj('#9A7D0A',-10)}"/>
  <path d="M74 150 Q75 157 60 158 Q50 158 51 153 L72 150Z" fill="${adj('#9A7D0A',-10)}"/>
  <line x1="32" y1="150" x2="32" y2="158" stroke="${adj('#9A7D0A',20)}" stroke-width="1.5" opacity=".7"/>
  <line x1="44" y1="150" x2="44" y2="158" stroke="${adj('#9A7D0A',20)}" stroke-width="1.5" opacity=".7"/>
  <line x1="56" y1="150" x2="56" y2="158" stroke="${adj('#9A7D0A',20)}" stroke-width="1.5" opacity=".7"/>
  <line x1="68" y1="150" x2="68" y2="158" stroke="${adj('#9A7D0A',20)}" stroke-width="1.5" opacity=".7"/>
  `;
}

function buildRoyal(uid, skin) {
  return `
  <!-- neck + collar -->
  <rect x="45.5" y="40" width="9" height="9" rx="3" fill="url(#${uid}sk)"/>
  <!-- shirt collar wings -->
  <polygon points="50,44 44,53 48,53" fill="url(#${uid}wh)"/>
  <polygon points="50,44 56,53 52,53" fill="url(#${uid}wh)"/>
  <!-- suit jacket -->
  <path d="M28 46 L72 46 L75 94 L25 94Z" fill="url(#${uid}cl)" filter="url(#${uid}ds)"/>
  <!-- jacket sheen -->
  <path d="M28 46 L48 48 L46 94 L28 94Z" fill="white" opacity=".05"/>
  <!-- pinstripes -->
  <line x1="35" y1="48" x2="32" y2="94" stroke="white" stroke-width="0.5" opacity=".08"/>
  <line x1="44" y1="47" x2="42" y2="94" stroke="white" stroke-width="0.5" opacity=".08"/>
  <line x1="56" y1="47" x2="58" y2="94" stroke="white" stroke-width="0.5" opacity=".08"/>
  <line x1="65" y1="48" x2="68" y2="94" stroke="white" stroke-width="0.5" opacity=".08"/>
  <!-- left lapel -->
  <path d="M50 44 L41 61 L45 94" fill="${adj('#1A237E',-15)}" opacity=".8"/>
  <!-- right lapel -->
  <path d="M50 44 L59 61 L55 94" fill="${adj('#1A237E',-15)}" opacity=".8"/>
  <!-- shirt front -->
  <path d="M46 53 L50 50 L54 53 L52.5 94 L47.5 94Z" fill="url(#${uid}wh)"/>
  <!-- shirt buttons -->
  <circle cx="50" cy="58" r="1" fill="${adj('#1A237E',10)}"/>
  <circle cx="50" cy="64" r="1" fill="${adj('#1A237E',10)}"/>
  <circle cx="50" cy="70" r="1" fill="${adj('#1A237E',10)}"/>
  <!-- gold tie -->
  <path d="M48.5 53 L51.5 53 L54 77 L50 83 L46 77Z" fill="url(#${uid}gd)"/>
  <line x1="50" y1="57" x2="50" y2="82" stroke="${adj('#D4AF37',-25)}" stroke-width="0.8" opacity=".5"/>
  <!-- tie knot -->
  <path d="M48.5 53 Q50 57 51.5 53 Q52 55 50 57 Q48 55 48.5 53Z" fill="${adj('#D4AF37',20)}"/>
  <!-- pocket square -->
  <path d="M60 55 L66 55 L65 63 L61 61.5Z" fill="url(#${uid}wh)"/>
  <line x1="62" y1="55" x2="61.5" y2="62" stroke="#E0E0E0" stroke-width="0.5"/>
  <!-- belt -->
  <rect x="25" y="92" width="50" height="5" rx="2" fill="#0D0D0D"/>
  <rect x="46" y="93" width="8" height="3" rx="1" fill="url(#${uid}gd)"/>
  <!-- pants -->
  <path d="M25 97 L46 97 L44 144 L25 144Z" fill="url(#${uid}cl)"/>
  <path d="M75 97 L54 97 L56 144 L75 144Z" fill="url(#${uid}cl)"/>
  <!-- crease -->
  <line x1="35.5" y1="99" x2="34.5" y2="143" stroke="${adj('#1A237E',30)}" stroke-width="0.8" opacity=".35"/>
  <line x1="64.5" y1="99" x2="65.5" y2="143" stroke="${adj('#1A237E',30)}" stroke-width="0.8" opacity=".35"/>
  <!-- oxford shoes -->
  <path d="M22 141 Q21 149 39 150 Q49 150 48 144 L25 141Z" fill="url(#${uid}sh)" filter="url(#${uid}ds)"/>
  <path d="M78 141 Q79 149 61 150 Q51 150 52 144 L75 141Z" fill="url(#${uid}sh)" filter="url(#${uid}ds)"/>
  <!-- shoe shine -->
  <path d="M25 144 Q30 142 38 143" stroke="white" stroke-width="0.8" fill="none" opacity=".25"/>
  <path d="M62 143 Q70 142 75 144" stroke="white" stroke-width="0.8" fill="none" opacity=".25"/>
  <!-- left arm -->
  <rect x="16" y="47" width="13" height="44" rx="5.5" fill="url(#${uid}cl)"/>
  <rect x="16" y="88" width="13" height="7" rx="2.5" fill="url(#${uid}wh)"/>
  <rect x="16" y="90.5" width="13" height="2" fill="url(#${uid}gd)"/>
  <rect x="16" y="93" width="13" height="9" rx="4" fill="url(#${uid}sk)"/>
  <!-- right arm -->
  <rect x="71" y="47" width="13" height="44" rx="5.5" fill="url(#${uid}cl)"/>
  <rect x="71" y="88" width="13" height="7" rx="2.5" fill="url(#${uid}wh)"/>
  <rect x="71" y="90.5" width="13" height="2" fill="url(#${uid}gd)"/>
  <rect x="71" y="93" width="13" height="9" rx="4" fill="url(#${uid}sk)"/>
  <!-- watch on right wrist -->
  <rect x="71" y="95" width="8" height="5" rx="1.5" fill="${adj('#D4AF37',-15)}"/>
  <rect x="72" y="96" width="6" height="3" rx="1" fill="#1A1A2E"/>
  `;
}

function buildGrinder(uid, skin) {
  return `
  <!-- neck -->
  <rect x="45.5" y="40" width="9" height="9" rx="3" fill="url(#${uid}sk)"/>
  <!-- hood behind head -->
  <path d="M35 38 Q36 26 50 25 Q64 26 65 38 L63 45 L37 45Z" fill="${adj('#E67E22',-15)}" opacity=".65"/>
  <!-- hoodie body -->
  <path d="M27 46 L73 46 L75 98 L25 98Z" fill="url(#${uid}cl)" filter="url(#${uid}ds)"/>
  <!-- hoodie sheen -->
  <path d="M27 46 L42 48 L41 98 L28 98Z" fill="white" opacity=".07"/>
  <!-- hoodie pocket -->
  <path d="M36 83 L64 83 L62 98 L38 98Z" fill="${adj('#D35400',-15)}" opacity=".75"/>
  <line x1="50" y1="83" x2="50" y2="98" stroke="${adj('#E67E22',20)}" stroke-width="1.5"/>
  <!-- pocket shadow -->
  <line x1="36" y1="83" x2="38" y2="98" stroke="${adj('#D35400',-25)}" stroke-width="1" opacity=".4"/>
  <line x1="64" y1="83" x2="62" y2="98" stroke="${adj('#D35400',-25)}" stroke-width="1" opacity=".4"/>
  <!-- jogger pants -->
  <path d="M25 96 L46 96 L44 140 L24 140Z" fill="url(#${uid}pt)"/>
  <path d="M75 96 L54 96 L56 140 L76 140Z" fill="url(#${uid}pt)"/>
  <!-- side stripe on pants -->
  <line x1="27" y1="97" x2="26" y2="139" stroke="white" stroke-width="1.5" opacity=".15"/>
  <line x1="73" y1="97" x2="74" y2="139" stroke="white" stroke-width="1.5" opacity=".15"/>
  <!-- ankle bands -->
  <rect x="22" y="137" width="24" height="5" rx="2.5" fill="${adj('#2C2C2C',20)}"/>
  <rect x="54" y="137" width="24" height="5" rx="2.5" fill="${adj('#2C2C2C',20)}"/>
  <!-- sneakers -->
  <path d="M19 140 Q18 149 38 150 Q49 150 48 144 L24 140Z" fill="url(#${uid}sh)" filter="url(#${uid}ds)"/>
  <path d="M81 140 Q82 149 62 150 Q51 150 52 144 L76 140Z" fill="url(#${uid}sh)" filter="url(#${uid}ds)"/>
  <!-- swoosh accent -->
  <path d="M22 145 Q30 142 42 144" stroke="${adj('#E67E22',-10)}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".85"/>
  <path d="M58 144 Q70 142 78 145" stroke="${adj('#E67E22',-10)}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".85"/>
  <!-- sole -->
  <rect x="18" y="147" width="31" height="4" rx="2" fill="${adj('#F5F5F5',-20)}"/>
  <rect x="51" y="147" width="31" height="4" rx="2" fill="${adj('#F5F5F5',-20)}"/>
  <!-- left arm -->
  <rect x="14" y="47" width="14" height="39" rx="6" fill="url(#${uid}cl)"/>
  <rect x="14" y="83" width="14" height="12" rx="5" fill="url(#${uid}sk)"/>
  <!-- right arm -->
  <rect x="72" y="47" width="14" height="39" rx="6" fill="url(#${uid}cl)"/>
  <rect x="72" y="83" width="14" height="12" rx="5" fill="url(#${uid}sk)"/>
  <!-- coffee cup body -->
  <rect x="73" y="95" width="15" height="20" rx="4" fill="url(#${uid}wh)" filter="url(#${uid}ds)"/>
  <!-- cup sleeve -->
  <rect x="73" y="100" width="15" height="11" rx="2" fill="${adj('#E67E22',-20)}" opacity=".75"/>
  <!-- sleeve texture lines -->
  <line x1="74" y1="102" x2="87" y2="102" stroke="white" stroke-width="0.6" opacity=".2"/>
  <line x1="74" y1="105" x2="87" y2="105" stroke="white" stroke-width="0.6" opacity=".2"/>
  <line x1="74" y1="108" x2="87" y2="108" stroke="white" stroke-width="0.6" opacity=".2"/>
  <!-- cup lid -->
  <rect x="72" y="93" width="17" height="4" rx="2" fill="${adj('#F5F5F5',-10)}"/>
  <rect x="77" y="91" width="7" height="3" rx="1.5" fill="${adj('#F5F5F5',-10)}"/>
  <!-- handle -->
  <path d="M88 98 Q96 98 96 105 Q96 112 88 112" stroke="${adj('#F5F5F5',-25)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- steam -->
  <path class="${uid}t1" d="M77 90 Q78.5 86 77 82" stroke="#CCCCCC" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <path class="${uid}t2" d="M80.5 89 Q82 85 80.5 81" stroke="#CCCCCC" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <path class="${uid}t3" d="M84 90 Q85.5 86 84 82" stroke="#CCCCCC" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <!-- airpod hint -->
  <circle cx="37" cy="28.5" r="1.8" fill="white" opacity=".7"/>
  <line x1="37" y1="30.3" x2="37" y2="33" stroke="white" stroke-width="0.9" opacity=".5"/>
  `;
}

function buildBuilder(uid, skin) {
  return `
  <!-- neck -->
  <rect x="45.5" y="40" width="9" height="9" rx="3" fill="url(#${uid}sk)"/>
  <!-- t-shirt -->
  <path d="M29 46 L71 46 L69 94 L31 94Z" fill="url(#${uid}cl)" filter="url(#${uid}ds)"/>
  <!-- shirt sheen -->
  <path d="M29 46 L43 48 L42 94 L31 94Z" fill="white" opacity=".07"/>
  <!-- collar -->
  <path d="M43 46 Q50 52 57 46" stroke="${adj('#27AE60',-20)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- pocket -->
  <rect x="32" y="58" width="10" height="9" rx="2" fill="${adj('#27AE60',-15)}" opacity=".7"/>
  <line x1="32" y1="62" x2="42" y2="62" stroke="${adj('#27AE60',25)}" stroke-width="0.8" opacity=".4"/>
  <!-- folds on shirt -->
  <line x1="35" y1="50" x2="33" y2="93" stroke="${adj('#27AE60',-25)}" stroke-width="0.8" opacity=".2"/>
  <line x1="55" y1="50" x2="57" y2="93" stroke="${adj('#27AE60',-25)}" stroke-width="0.8" opacity=".2"/>
  <!-- belt -->
  <rect x="31" y="92" width="38" height="4.5" rx="2" fill="#6D4C41"/>
  <rect x="47" y="93" width="6" height="2.5" rx="1" fill="url(#${uid}gd)"/>
  <!-- jeans -->
  <path d="M31 96 L47 96 L45 143 L27 143Z" fill="url(#${uid}pt)"/>
  <path d="M69 96 L53 96 L55 143 L73 143Z" fill="url(#${uid}pt)"/>
  <!-- denim stitching -->
  <line x1="38" y1="98" x2="36" y2="142" stroke="${adj('#2471A3',35)}" stroke-width="0.8" opacity=".3" stroke-dasharray="2,3"/>
  <line x1="62" y1="98" x2="64" y2="142" stroke="${adj('#2471A3',35)}" stroke-width="0.8" opacity=".3" stroke-dasharray="2,3"/>
  <!-- knee wear -->
  <ellipse cx="36" cy="118" rx="7" ry="5" fill="${adj('#2471A3',-10)}" opacity=".3"/>
  <ellipse cx="64" cy="118" rx="7" ry="5" fill="${adj('#2471A3',-10)}" opacity=".3"/>
  <!-- work boots -->
  <path d="M24 140 Q23 150 40 151 Q50 151 49 144 L28 140Z" fill="url(#${uid}sh)" filter="url(#${uid}ds)"/>
  <path d="M76 140 Q77 150 60 151 Q50 151 51 144 L72 140Z" fill="url(#${uid}sh)" filter="url(#${uid}ds)"/>
  <!-- boot toecap -->
  <path d="M24 144 Q28 140 38 142 Q39 146 28 148Z" fill="${adj('#6D4C41',-15)}"/>
  <path d="M76 144 Q72 140 62 142 Q61 146 72 148Z" fill="${adj('#6D4C41',-15)}"/>
  <!-- laces -->
  <line x1="30" y1="142" x2="38" y2="142" stroke="${adj('#EEEEEE',-10)}" stroke-width="1" opacity=".6"/>
  <line x1="29" y1="145" x2="37" y2="145" stroke="${adj('#EEEEEE',-10)}" stroke-width="1" opacity=".6"/>
  <line x1="62" y1="142" x2="70" y2="142" stroke="${adj('#EEEEEE',-10)}" stroke-width="1" opacity=".6"/>
  <line x1="63" y1="145" x2="71" y2="145" stroke="${adj('#EEEEEE',-10)}" stroke-width="1" opacity=".6"/>
  <!-- left arm (rolled sleeve) -->
  <rect x="16" y="47" width="14" height="35" rx="6" fill="url(#${uid}cl)"/>
  <!-- rolled cuff -->
  <rect x="16" y="79" width="14" height="6" rx="3" fill="${adj('#27AE60',-15)}"/>
  <rect x="16" y="79" width="14" height="2" fill="${adj('#27AE60',20)}" opacity=".5"/>
  <rect x="16" y="84" width="14" height="10" rx="5" fill="url(#${uid}sk)"/>
  <!-- right arm (holding plant) -->
  <rect x="70" y="47" width="14" height="35" rx="6" fill="url(#${uid}cl)"/>
  <rect x="70" y="79" width="14" height="6" rx="3" fill="${adj('#27AE60',-15)}"/>
  <rect x="70" y="79" width="14" height="2" fill="${adj('#27AE60',20)}" opacity=".5"/>
  <rect x="70" y="84" width="14" height="10" rx="5" fill="url(#${uid}sk)"/>
  <!-- terracotta pot -->
  <path d="M69 100 L88 100 L86 116 L71 116Z" fill="#C0390A"/>
  <rect x="68" y="97" width="22" height="5" rx="2.5" fill="${adj('#C0390A',-15)}"/>
  <!-- soil -->
  <ellipse cx="78.5" cy="100" rx="9" ry="2.2" fill="#5D4037"/>
  <!-- pot highlight -->
  <path d="M70 102 Q72 100 75 101" stroke="${adj('#C0390A',40)}" stroke-width="1" fill="none" opacity=".4"/>
  <!-- stem -->
  <line x1="78.5" y1="100" x2="78.5" y2="80" stroke="#27AE60" stroke-width="2.8" stroke-linecap="round"/>
  <!-- leaves -->
  <path d="M78.5 90 Q68 82 66 74 Q74 78 78.5 86Z" fill="${adj('#27AE60',10)}" filter="url(#${uid}ds)"/>
  <path d="M78.5 85 Q90 77 92 69 Q83 74 78.5 82Z" fill="#2ECC71" filter="url(#${uid}ds)"/>
  <path d="M78.5 78 Q76 70 78.5 62 Q81 70 78.5 76Z" fill="${adj('#27AE60',5)}"/>
  <!-- leaf veins -->
  <line x1="78.5" y1="86" x2="69" y2="76" stroke="${adj('#27AE60',-20)}" stroke-width="0.7" opacity=".5"/>
  <line x1="78.5" y1="82" x2="89" y2="72" stroke="${adj('#2ECC71',-15)}" stroke-width="0.7" opacity=".5"/>
  <!-- freckles on face (builder specific) -->
  <circle cx="44" cy="29" r="0.9" fill="${adj(skin,-30)}" opacity=".45"/>
  <circle cx="47" cy="30.5" r="0.7" fill="${adj(skin,-30)}" opacity=".35"/>
  <circle cx="53" cy="30.5" r="0.7" fill="${adj(skin,-30)}" opacity=".35"/>
  <circle cx="56" cy="29" r="0.9" fill="${adj(skin,-30)}" opacity=".45"/>
  `;
}

// ── EQUIPMENT ────────────────────────────────────────────────────────────────

function buildAura(uid, accent) {
  return `
  <ellipse cx="50" cy="95" rx="62" ry="80" fill="url(#${uid}aura)"/>
  <ellipse cx="50" cy="95" rx="55" ry="73" fill="url(#${uid}aura)" opacity=".6"/>`;
}

function buildCape(uid, accent) {
  return `
  <path d="M37 50 Q26 76 20 148 L37 148 Q41 107 50 86 Q59 107 63 148 L80 148 Q74 76 63 50Z" fill="${adj(accent,-10)}" opacity=".85" filter="url(#${uid}ds)"/>
  <path d="M39 50 Q31 72 27 126 L38 126 Q42 98 50 80 Q58 98 62 126 L73 126 Q69 72 61 50Z" fill="${adj(accent,15)}" opacity=".35"/>
  <line x1="50" y1="86" x2="50" y2="148" stroke="${adj(accent,40)}" stroke-width="0.8" opacity=".25"/>`;
}

function buildHalo(uid) {
  return `
  <ellipse cx="50" cy="8" rx="18" ry="5" fill="none" stroke="#FFD700" stroke-width="4" class="${uid}gl" filter="url(#${uid}gl)"/>
  <ellipse cx="50" cy="8" rx="18" ry="5" fill="none" stroke="#FFFDE7" stroke-width="1.5" opacity=".6"/>`;
}

function buildCrown(uid, accent) {
  return `
  <rect x="33" y="7" width="34" height="7" rx="1.5" fill="url(#${uid}gd)" filter="url(#${uid}ds)"/>
  <polygon points="33,7 36.5,0 40,7" fill="url(#${uid}gd)"/>
  <polygon points="43,7 46.5,-1 50,7" fill="url(#${uid}gd)"/>
  <polygon points="50,7 53.5,-1 57,7" fill="url(#${uid}gd)"/>
  <polygon points="57,7 60.5,0 64,7" fill="url(#${uid}gd)"/>
  <circle cx="36.5" cy="4.5" r="2.2" fill="#FF6B6B" filter="url(#${uid}gl)"/>
  <circle cx="50" cy="2" r="2.6" fill="#74B9FF" filter="url(#${uid}gl)"/>
  <circle cx="63.5" cy="4.5" r="2.2" fill="#55EFC4" filter="url(#${uid}gl)"/>
  <ellipse cx="50" cy="13" rx="18" ry="4" fill="url(#${uid}gd)" opacity=".6"/>`;
}

function buildHat(uid) {
  return `
  <ellipse cx="50" cy="11" rx="22" ry="5" fill="#111"/>
  <rect x="35" y="0" width="30" height="12" rx="3" fill="#1A1A1A"/>
  <rect x="35" y="9.5" width="30" height="3.5" fill="#C0392B"/>
  <path d="M37 9 Q42 7 50 7 Q58 7 63 9" stroke="${adj('#C0392B',30)}" stroke-width="0.7" fill="none" opacity=".4"/>`;
}

// ── ASSEMBLY ─────────────────────────────────────────────────────────────────

function assembleSVG({ uid, archetype, skin, equipment, overrides, accentColor, showGlow }) {
  const cfg    = CONFIGS[archetype] || CONFIGS.builder;
  const clothC = overrides.clothesColor ? `#${overrides.clothesColor}` : cfg.clothColor;
  const accent = accentColor || cfg.accent;

  const glasses  = overrides.accessories === 'prescription01' ? 'prescription01'
                 : overrides.accessories === 'sunglasses'    ? 'sunglasses' : null;
  const beard    = overrides.facialHair === 'beardMedium';
  const hasHat   = overrides.top === 'hat' || equipment.includes('hat');
  const hasCrown = equipment.includes('crown');

  const { defs, style } = buildDefsAndStyle(uid, skin, cfg, archetype);

  const face = buildFace({
    uid,
    skin,
    hairColor:  cfg.hair,
    hairStyle:  cfg.hairStyle,
    mood:       cfg.mood,
    brows:      cfg.brows,
    glasses,
    beard,
  });

  let body = '';
  if      (archetype === 'warrior') body = buildWarrior(uid, skin);
  else if (archetype === 'sage')    body = buildSage(uid, skin);
  else if (archetype === 'royal')   body = buildRoyal(uid, skin);
  else if (archetype === 'grinder') body = buildGrinder(uid, skin);
  else                               body = buildBuilder(uid, skin);

  const aura  = (showGlow || equipment.includes('aura')) ? buildAura(uid, accent)  : '';
  const cape  = equipment.includes('cape')               ? buildCape(uid, accent)  : '';
  const halo  = equipment.includes('halo')               ? buildHalo(uid)          : '';
  const crown = hasCrown                                  ? buildCrown(uid, accent) : '';
  const hat   = hasHat && !hasCrown                       ? buildHat(uid)           : '';

  return `
<defs>${defs}</defs>
<style>${style}</style>
<g class="${uid}b">
  ${aura}
  ${cape}
  ${body}
  <g class="${uid}h">
    ${face}
    ${halo}
    ${crown}
    ${hat}
  </g>
</g>`;
}

// ── COMPONENT ────────────────────────────────────────────────────────────────

export default function Avatar3D({
  archetype = 'builder',
  avatarUrl, userId, seed,
  equipment = [], overrides = {},
  size = 100, showGlow, accentColor,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isSmall = size <= 80;
    const svgH    = isSmall ? size : Math.round(size * 1.6);
    const viewBox = isSmall ? '20 4 60 60' : '0 0 100 160';

    const n    = djb2(seed || userId || archetype || '');
    const skin = SKIN_TONES[n % SKIN_TONES.length];
    const uid  = (archetype.slice(0, 3) + (seed || '').replace(/\W/g, '').slice(0, 5) + n.toString(36).slice(0, 3)).replace(/[^a-z0-9]/gi, 'x');

    const cfg    = CONFIGS[archetype] || CONFIGS.builder;
    const accent = accentColor || cfg.accent;

    const inner = assembleSVG({ uid, archetype, skin, equipment, overrides, accentColor: accent, showGlow });

    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgEl.setAttribute('viewBox', viewBox);
    svgEl.setAttribute('width', String(size));
    svgEl.setAttribute('height', String(svgH));
    svgEl.style.display = 'block';
    svgEl.style.overflow = 'visible';
    if (isSmall) svgEl.style.borderRadius = `${size / 2}px`;
    svgEl.innerHTML = inner;

    el.innerHTML = '';
    el.appendChild(svgEl);

    return () => { el.innerHTML = ''; };
  }, [archetype, seed, userId, size, accentColor, showGlow,
      JSON.stringify(equipment), JSON.stringify(overrides)]);

  const isSmall = size <= 80;
  const h = isSmall ? size : Math.round(size * 1.6);

  return <View ref={ref} style={{ width: size, height: h }} />;
}
