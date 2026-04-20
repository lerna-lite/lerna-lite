// https://github.com/npm/npm/blob/0cc9d89/lib/config/nerf-dart.js
// Use WHATWG URL API to normalize and strip sensitive parts
// Normalize and strip sensitive parts from a registry URL, returning //host/path
export function toNerfDart(uri) {
  const u = new URL(uri);
  u.username = '';
  u.password = '';
  u.search = '';
  u.hash = '';
  let result = '//' + u.host + u.pathname;
  if (!result.endsWith('/')) {
    result += '/';
  }
  return result;
}
