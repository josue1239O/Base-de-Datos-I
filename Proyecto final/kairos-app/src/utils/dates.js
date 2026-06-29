export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function parseDate(ddmm) {
  if (!ddmm) return '';
  if (ddmm.includes('-')) return ddmm;
  const [d, m, y] = ddmm.split('/');
  if (!d || !m || !y) return ddmm;
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function isDate(val) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(val);
}
