import { toast } from 'react-toastify';

const activeToasts = new Map<string, number | string>();

function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info') {
  const key = `${type}:${message}`;
  const existing = activeToasts.get(key);
  if (existing !== undefined && toast.isActive(existing)) {
    toast.update(existing, { render: message });
    return;
  }
  const id = toast(message, { type });
  activeToasts.set(key, id);
  toast.onChange((item) => {
    if (item.status === 'removed' && activeToasts.get(key) === item.id) {
      activeToasts.delete(key);
    }
  });
}

export const toastManager = {
  success: (msg: string) => showToast(msg, 'success'),
  error: (msg: string) => showToast(msg, 'error'),
  warn: (msg: string) => showToast(msg, 'warning'),
  info: (msg: string) => showToast(msg, 'info'),
};
