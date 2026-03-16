export type ToastType = 'success' | 'error' | 'info';

let addToastExternal: ((text: string, type: ToastType) => void) | null = null;

export function registerToastHandler(handler: (text: string, type: ToastType) => void) {
  addToastExternal = handler;
}

export function clearToastHandler() {
  addToastExternal = null;
}

export function showToast(text: string, type: ToastType = 'info') {
  if (addToastExternal) {
    addToastExternal(text, type);
  }
}
