/** Deterministic hash noise in [0,1). Same inputs always return the same value. */
export function rnd(a: number, b = 0, c = 0): number {
  let h = Math.imul(a + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x7f4a7c15, 0xc2b2ae35) ^ Math.imul(c + 0x165667b1, 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
/** Centered noise in [-amp, amp]. */
export const jitter = (amp: number, a: number, b = 0, c = 0) => (rnd(a, b, c) * 2 - 1) * amp;
export const round2 = (n: number) => Math.round(n * 100) / 100;
