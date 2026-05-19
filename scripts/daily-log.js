#!/usr/bin/env node
/**
 * Daily work log — metadata only. NO code, NO secrets.
 * Sends to VerMillion CRM: commit messages + file names + TODOs.
 * Run: node scripts/daily-log.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const CRM_URL = process.env.DEV_LOG_CRM_URL || 'http://localhost:3001';
const SECRET  = process.env.DEV_LOG_SECRET  || 'vermillion-devlog-2026';
const ROOT    = path.join(__dirname, '..');

function git(cmd) {
  try { return execSync(`git -C "${ROOT}" ${cmd}`, { encoding: 'utf8' }).trim(); }
  catch { return ''; }
}

function todayCommits() {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const raw = git(`log --since="${since.toISOString()}" --format="%H|%s"`);
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(line => {
    const [hash, ...parts] = line.split('|');
    return { hash: hash.slice(0, 8), message: parts.join('|').trim() };
  });
}

function changedFiles(n) {
  if (n === 0) return [];
  const out = git(`diff --name-only HEAD~${n} HEAD`);
  return out.split('\n').filter(Boolean);
}

function getTodos() {
  try {
    const text = fs.readFileSync(path.join(ROOT, 'docs/WORK_PLAN.md'), 'utf8');
    return text.split('\n')
      .filter(l => /\bTODO\b|❌|\- \[ \]/.test(l) && l.trim().length > 6)
      .map(l => l.replace(/^[\|\s*#-\[\]]+/, '').split('|')[0].trim())
      .filter(l => l.length > 4 && !/^-+$/.test(l))
      .slice(0, 20);
  } catch { return []; }
}

function getRecentDone() {
  try {
    const text = fs.readFileSync(path.join(ROOT, 'docs/WORK_PLAN.md'), 'utf8');
    return text.split('\n')
      .filter(l => l.includes('✅') && l.trim().length > 10 && !/^#{1,3}/.test(l))
      .map(l => l.replace(/^[\|\s]*/g, '').split('|')[0].replace('✅', '').trim())
      .filter(Boolean)
      .slice(-8);
  } catch { return []; }
}

function getVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version || null;
  } catch { return null; }
}

function postToCRM(data) {
  return new Promise((resolve) => {
    const body = JSON.stringify(data);
    let url;
    try { url = new URL('/api/dev-log', CRM_URL); }
    catch { return resolve({ status: 0, error: 'invalid CRM_URL' }); }

    const opts = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname,
      method:   'POST',
      headers: {
        'Content-Type':     'application/json',
        'Content-Length':   Buffer.byteLength(body),
        'x-dev-log-secret': SECRET,
      },
    };
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.setTimeout(4000, () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    req.write(body);
    req.end();
  });
}

async function main() {
  const date      = new Date().toISOString().slice(0, 10);
  const commits   = todayCommits();
  const files     = changedFiles(commits.length);
  const todos     = getTodos();
  const recentDone = getRecentDone();

  const log = {
    date,
    generatedAt:  new Date().toISOString(),
    project:      'VerMillion',
    version:      getVersion(),
    deployUrl:    'https://vermillion-ashen.vercel.app',
    commits,
    filesChanged: files,
    todosRemaining: todos,
    recentDone,
  };

  // ─── Save locally ───────────────────────────────────────────
  const sessionsDir = path.join(ROOT, 'docs', 'sessions');
  if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });
  const localPath = path.join(sessionsDir, `${date}.json`);
  fs.writeFileSync(localPath, JSON.stringify(log, null, 2), 'utf8');
  console.log(`  📋 Saved → docs/sessions/${date}.json`);

  // ─── Send to CRM ────────────────────────────────────────────
  const res = await postToCRM(log);
  if (res.status === 200 || res.status === 201) {
    console.log(`  ✅ Sent to CRM (${CRM_URL})`);
  } else {
    const reason = res.error || `HTTP ${res.status}`;
    console.log(`  ⚠️  CRM not available (${reason}) — log saved locally only`);
  }
}

main().catch(e => {
  console.error('  ⚠️  daily-log error:', e.message);
  process.exit(0); // non-fatal — deploy should not fail
});
