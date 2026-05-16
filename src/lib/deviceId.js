const key = 'ravana_bhawana_device_id';

export function getDeviceId() {
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(key, value);
    document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
  }
  return value;
}
