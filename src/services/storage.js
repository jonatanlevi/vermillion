import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  PROFILE:        'vm_profile',
  FINANCIAL:      'vm_financial',
  ONBOARDING:     'vm_onboarding',
  CHAT_HISTORY:   'vm_chat_history',
  DAILY_LOG:      'vm_daily_log',
};

// ─── Profile ───────────────────────────────────────────────
export async function saveProfile(data) {
  await AsyncStorage.setItem(K.PROFILE, JSON.stringify(data));
}

export async function getProfile() {
  const raw = await AsyncStorage.getItem(K.PROFILE);
  return raw ? JSON.parse(raw) : null;
}

// ─── Financial data (collected during onboarding) ──────────
export async function saveFinancialData(data) {
  const existing = await getFinancialData();
  await AsyncStorage.setItem(K.FINANCIAL, JSON.stringify({ ...existing, ...data }));
}

export async function getFinancialData() {
  const raw = await AsyncStorage.getItem(K.FINANCIAL);
  return raw ? JSON.parse(raw) : {};
}

// ─── Onboarding state ──────────────────────────────────────
export async function saveOnboardingState(state) {
  const existing = await getOnboardingState();
  await AsyncStorage.setItem(K.ONBOARDING, JSON.stringify({ ...existing, ...state }));
}

export async function getOnboardingState() {
  const raw = await AsyncStorage.getItem(K.ONBOARDING);
  return raw ? JSON.parse(raw) : {
    startDate: null,
    daysCompleted: [],
    profileGenerated: false,
    profileText: '',
  };
}

export async function markDayComplete(day) {
  const state = await getOnboardingState();
  if (!state.daysCompleted.includes(day)) {
    state.daysCompleted.push(day);
  }
  if (!state.startDate) state.startDate = new Date().toISOString();
  await AsyncStorage.setItem(K.ONBOARDING, JSON.stringify(state));
}

export async function isOnboardingComplete() {
  const state = await getOnboardingState();
  return state.daysCompleted.length >= 7;
}

// ─── Chat history ──────────────────────────────────────────
export async function saveChatHistory(messages) {
  await AsyncStorage.setItem(K.CHAT_HISTORY, JSON.stringify(messages));
}

export async function getChatHistory() {
  const raw = await AsyncStorage.getItem(K.CHAT_HISTORY);
  return raw ? JSON.parse(raw) : [];
}

export async function appendChatMessage(message) {
  const history = await getChatHistory();
  history.push(message);
  if (history.length > 200) history.splice(0, history.length - 200);
  await AsyncStorage.setItem(K.CHAT_HISTORY, JSON.stringify(history));
}

// ─── Daily log (score, challenges) ─────────────────────────
export async function saveDailyLog(day, data) {
  const raw = await AsyncStorage.getItem(K.DAILY_LOG);
  const log = raw ? JSON.parse(raw) : {};
  log[day] = { ...log[day], ...data, savedAt: new Date().toISOString() };
  await AsyncStorage.setItem(K.DAILY_LOG, JSON.stringify(log));
}

export async function getDailyLog() {
  const raw = await AsyncStorage.getItem(K.DAILY_LOG);
  return raw ? JSON.parse(raw) : {};
}

// ─── Clear all (logout) ────────────────────────────────────
export async function clearAllData() {
  await AsyncStorage.multiRemove(Object.values(K));
}
