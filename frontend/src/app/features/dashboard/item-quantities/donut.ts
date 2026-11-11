import { ITEMS } from '../../purchase-bill/calculations';

/**
 * The donut is drawn with one SVG circle per slice whose circumference is exactly 100,
 * so a slice's dash length is simply its percentage of the total.
 */
export const DONUT_RADIUS = 100 / (2 * Math.PI);

export interface DonutSegment {
  /** Share of the ring, 0..100. */
  length: number;
  /** stroke-dashoffset that starts the slice where the previous one ended, beginning at 12 o'clock. */
  offset: number;
}

export function donutSegments(values: readonly number[]): DonutSegment[] {
  const total = values.reduce((sum, v) => sum + Math.max(v, 0), 0);
  if (total === 0) return values.map(() => ({ length: 0, offset: 25 }));

  let start = 0;
  return values.map((v) => {
    const length = (Math.max(v, 0) / total) * 100;
    // SVG circles start drawing at 3 o'clock; +25 moves the start to 12 o'clock.
    const segment = { length, offset: 25 - start };
    start += length;
    return segment;
  });
}

/** One fixed colour per item, so an item keeps its colour however the totals change. */
const PALETTE = ['#00a3c4', '#0b5d8c', '#22c55e', '#1f6fd0', '#7c3aed', '#f59e0b', '#ec4899'];

export function itemColour(itemName: string): string {
  const index = ITEMS.findIndex((i) => i.toLowerCase() === itemName.toLowerCase());
  return index >= 0 ? PALETTE[index % PALETTE.length] : '#9ca3af';
}
