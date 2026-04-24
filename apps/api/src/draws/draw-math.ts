/**
 * Draw numbers are 5 distinct integers in [N_MIN, N_MAX]. A subscriber’s “match” count is how many
 * of their (up to 5) score values appear in that winning set. Tiers: 5, 4, 3, or no prize.
 */
export const DRAW_SIZE = 5;
export const N_MIN = 1;
export const N_MAX = 45;

const T5 = 0.4;
const T4 = 0.35;
const T3 = 0.25;

export function poolFractions() {
  return { tier5: T5, tier4: T4, tier3: T3 } as const;
}

/** Seeded 32-bit PRNG: deterministic for same month key + run kind. */
export function mulberry32(seed: number) {
  return function next() {
    /* eslint-disable no-bitwise */
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeedToInt(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function makeRngFromSeedString(seed: string) {
  return mulberry32(hashSeedToInt(seed) || 1);
}

export function drawRandomNumbers(
  rng: () => number,
  count = DRAW_SIZE,
): number[] {
  const picked: number[] = [];
  const pool = new Set<number>();
  while (pool.size < count) {
    const v = N_MIN + Math.floor(rng() * (N_MAX - N_MIN + 1));
    if (!pool.has(v)) {
      pool.add(v);
      picked.push(v);
    }
  }
  return picked.sort((a, b) => a - b);
}

/**
 * Bias numbers that appear less often in the subscriber score population (higher “surprise” weight).
 */
export function drawAlgorithmicNumbers(
  allScoreValues: number[],
  seed: string,
  count = DRAW_SIZE,
): number[] {
  const freq = new Array(N_MAX + 1).fill(0);
  for (const v of allScoreValues) {
    if (v >= N_MIN && v <= N_MAX) {
      freq[v] += 1;
    }
  }
  const rng = makeRngFromSeedString(`${seed}:algo-pick`);
  const weights: { n: number; w: number }[] = [];
  for (let n = N_MIN; n <= N_MAX; n++) {
    weights.push({ n, w: 1 / (1 + freq[n]) });
  }
  const picked: number[] = [];
  for (let k = 0; k < count; k++) {
    let s = 0;
    for (const x of weights) {
      if (!picked.includes(x.n)) {
        s += x.w;
      }
    }
    if (s <= 0) {
      break;
    }
    let r = rng() * s;
    for (const x of weights) {
      if (picked.includes(x.n)) {
        continue;
      }
      r -= x.w;
      if (r <= 0) {
        picked.push(x.n);
        break;
      }
    }
  }
  // Fallback if not enough (shouldn’t happen with 5 from 45)
  while (picked.length < count) {
    const v = N_MIN + Math.floor(rng() * (N_MAX - N_MIN + 1));
    if (!picked.includes(v)) {
      picked.push(v);
    }
  }
  return picked.sort((a, b) => a - b);
}

export function matchCountForUser(
  userScoreValues: number[],
  drawn: number[],
): number {
  const set = new Set(drawn);
  return userScoreValues.filter((s) => set.has(s)).length;
}

/** Highest tier only: 5 →5, 4→4, 3→3, else 0 (no win). */
export function tierFromMatchCount(mc: number): 5 | 4 | 3 | 0 {
  if (mc >= 5) {
    return 5;
  }
  if (mc === 4) {
    return 4;
  }
  if (mc === 3) {
    return 3;
  }
  return 0;
}

/**
 * Distribute `totalCents` across `n` winners as equal integer cents, assigning remainder 1c to
 * the first `remainder` entries (stable, deterministic).
 */
export function splitCentsEvenly(totalCents: number, n: number): number[] {
  if (n <= 0) {
    return [];
  }
  const base = Math.floor(totalCents / n);
  const rem = totalCents - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}
