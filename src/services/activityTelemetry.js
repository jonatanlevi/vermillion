/**
 * Activity Telemetry — fire-and-forget event tracking to Supabase.
 * - Batches events every 2s or when queue reaches 10 items.
 * - Never throws — silently drops on failure.
 * - Skips ghost_* users (local dev simulation only).
 */

import { supabase } from './supabase';
import { getDeviceTimezone } from '../utils/stampWindow';

// ─── State ───────────────────────────────────────────────────────────────────

let _userId = null;
let _sessionId = null;
const _queue = [];
let _flushTimer = null;
let _lastScreenView = 0;
let _lastChunk = {};  // partialId → timestamp

const BATCH_SIZE = 10;
const FLUSH_MS = 2000;
const SCREEN_THROTTLE_MS = 300;
const CHUNK_THROTTLE_MS = 500;

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initTelemetry(userId) {
  if (!userId || String(userId).startsWith('ghost_')) {
    _userId = null;
    return;
  }
  _userId = userId;
  // New session per app open
  _sessionId = `${userId.slice(0, 8)}_${Date.now().toString(36)}`;
}

export function teardownTelemetry() {
  _userId = null;
  _sessionId = null;
  if (_flushTimer) clearTimeout(_flushTimer);
  _flushTimer = null;
  _queue.length = 0;
}

// ─── Core track ──────────────────────────────────────────────────────────────

export function track(eventType, payload = {}, { screen } = {}) {
  if (!_userId) return;

  const now = Date.now();

  // Throttle screen_view
  if (eventType === 'screen_view') {
    if (now - _lastScreenView < SCREEN_THROTTLE_MS) return;
    _lastScreenView = now;
  }

  // Throttle chat_ai_chunk per partialId
  if (eventType === 'chat_ai_chunk') {
    const pid = payload.partialId;
    if (pid && now - (_lastChunk[pid] || 0) < CHUNK_THROTTLE_MS) return;
    if (pid) _lastChunk[pid] = now;
  }

  _queue.push({
    user_id: _userId,
    occurred_at: new Date().toISOString(),
    event_type: eventType,
    screen: screen || null,
    payload,
    session_id: _sessionId,
    device_tz: _getTimezone(),
  });

  if (_queue.length >= BATCH_SIZE) {
    _scheduleFlush(0);
  } else {
    _scheduleFlush(FLUSH_MS);
  }
}

// ─── Flush ───────────────────────────────────────────────────────────────────

function _scheduleFlush(delayMs) {
  if (_flushTimer) clearTimeout(_flushTimer);
  _flushTimer = setTimeout(_flush, delayMs);
}

async function _flush() {
  _flushTimer = null;
  if (!_userId || _queue.length === 0) return;

  const batch = _queue.splice(0, BATCH_SIZE);
  try {
    await supabase.from('user_activity_events').insert(batch);
  } catch {
    // Silent drop — telemetry must never break the app
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _getTimezone() {
  try {
    return getDeviceTimezone();
  } catch {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  }
}

// ─── Screen tracking hook ─────────────────────────────────────────────────────

let _currentScreen = null;
let _screenEnteredAt = null;

export function onScreenFocus(routeName) {
  const now = Date.now();

  if (_currentScreen && _currentScreen !== routeName) {
    const dwellMs = _screenEnteredAt ? now - _screenEnteredAt : null;
    track('screen_leave', { route: _currentScreen, dwellMs }, { screen: _currentScreen });
  }

  _currentScreen = routeName;
  _screenEnteredAt = now;
  track('screen_view', { route: routeName }, { screen: routeName });
}

// ─── Typed event helpers ──────────────────────────────────────────────────────

export const telemetry = {
  screenView: (route, extra) =>
    track('screen_view', { route, ...extra }, { screen: route }),

  chatUserMessage: (text, typingMs, charsPerSec, screen) =>
    track('chat_user_message', { text, typingMs, charsPerSec }, { screen }),

  chatAiStart: (partialId, screen) =>
    track('chat_ai_start', { partialId }, { screen }),

  chatAiChunk: (partialId, charsSoFar, screen) =>
    track('chat_ai_chunk', { partialId, charsSoFar }, { screen }),

  chatAiDone: (text, responseMs, screen) =>
    track('chat_ai_done', { text: text?.slice(0, 300), responseMs }, { screen }),

  questionShown: (day, questionKey, questionText, screen) =>
    track('question_shown', { day, questionKey, questionText: questionText?.slice(0, 200) }, { screen }),

  questionAnswered: (day, questionKey, value, skipped, screen) =>
    track('question_answered', { day, questionKey, value: String(value ?? '').slice(0, 200), skipped: !!skipped }, { screen }),

  gameStarted: (gameKey, day, screen) =>
    track('game_started', { gameKey, day }, { screen }),

  gameFinished: (gameKey, score, durationMs, screen) =>
    track('game_finished', { gameKey, score, durationMs }, { screen }),

  stampAttempt: (ok, msDiff, error, screen) =>
    track('stamp_attempt', { ok, msDiff, error }, { screen }),

  commitmentSet: (kind, hour, minute, screen) =>
    track('commitment_set', { kind, hour, minute }, { screen }),

  profileUpdated: (fields, screen) =>
    track('profile_updated', { fields }, { screen }),
};
