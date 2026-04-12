/**
 * Mapeo solo visual: códigos internos (S1–S9) -> Global1–Global9.
 * No altera nivel_id ni lógica de negocio.
 */
const S_TO_GLOBAL = {
  S1: 'Global',
  S2: 'Global',
  S3: 'Global',
  S4: 'Global',
  S5: 'Global',
  S6: 'Global',
  S7: 'Global',
  S8: 'Global',
  S9: 'Global',
  GLOBAL1: 'Global',
  GLOBAL2: 'Global',
  GLOBAL3: 'Global',
  GLOBAL4: 'Global',
  GLOBAL5: 'Global',
  GLOBAL6: 'Global',
  GLOBAL7: 'Global',
  GLOBAL8: 'Global',
  GLOBAL9: 'Global',
};

export function displayLevelCode(codigo) {
  const c = String(codigo || '').toUpperCase();
  if (c === 'INTERNAR' || c === 'PASANTE') return 'Pasante';
  
  // Mapeo exhaustivo para asegurar que "S" se convierta en "Global"
  const match = c.match(/^(S|GLOBAL)\s*([1-9])?$/);
  if (match) {
    const num = match[2] || '';
    return `Global ${num}`.trim();
  }
  
  return S_TO_GLOBAL[c] || codigo || '—';
}
