/**
 * Mapeo solo visual: códigos internos (S1–S9) -> Global1–Global9.
 * No altera nivel_id ni lógica de negocio.
 */
const S_TO_GLOBAL = {
  S1: 'Global 1',
  S2: 'Global 2',
  S3: 'Global 3',
  S4: 'Global 4',
  S5: 'Global 5',
  S6: 'Global 6',
  S7: 'Global 7',
  S8: 'Global 8',
  S9: 'Global 9',
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
