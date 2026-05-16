export const ADMIN_EMAIL = 'udarasampath@gmail.com';

export function isAdminUser(user) {
  return user?.email === ADMIN_EMAIL;
}

export function adminEmail(user) {
  return isAdminUser(user) ? user.email : '';
}
