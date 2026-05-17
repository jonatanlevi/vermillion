/** שעון אפליקציה — ברירת מחדל מכשיר; במשחק רפאים — יום מדומה */
let _clockFn = null;

export function setAppClockOverride(fn) {
  _clockFn = typeof fn === 'function' ? fn : null;
}

export function clearAppClockOverride() {
  _clockFn = null;
}

export function getAppNow() {
  return _clockFn ? _clockFn() : new Date();
}
