// DisplayDocument transports non-integer statistics as decimal strings. Accept
// the complete finite value; never coerce empty/missing data or parse a prefix.
export function metric(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '未知';
  if (typeof value === 'string' && /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/u.test(value)
    && Number.isFinite(Number(value))) return value;
  return '未知';
}
