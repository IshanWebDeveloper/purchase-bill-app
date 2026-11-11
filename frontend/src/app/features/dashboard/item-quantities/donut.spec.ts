import { DONUT_RADIUS, donutSegments, itemColour } from './donut';

describe('donutSegments', () => {
  it('uses a circle whose circumference is 100', () => {
    expect(2 * Math.PI * DONUT_RADIUS).toBeCloseTo(100, 10);
  });

  it('splits the ring by share of the total, starting at 12 o\'clock', () => {
    const [a, b, c] = donutSegments([5, 3, 2]);
    expect(a).toEqual({ length: 50, offset: 25 });
    expect(b).toEqual({ length: 30, offset: -25 });
    expect(c).toEqual({ length: 20, offset: -55 });
  });

  it('slices always add up to the full ring', () => {
    const total = donutSegments([7, 1, 13, 4]).reduce((sum, s) => sum + s.length, 0);
    expect(total).toBeCloseTo(100, 10);
  });

  it('a single item is the whole ring', () => {
    expect(donutSegments([42])).toEqual([{ length: 100, offset: 25 }]);
  });

  it('handles no data and all-zero data without dividing by zero', () => {
    expect(donutSegments([])).toEqual([]);
    expect(donutSegments([0, 0])).toEqual([
      { length: 0, offset: 25 },
      { length: 0, offset: 25 },
    ]);
  });
});

describe('itemColour', () => {
  it('gives each known item its own colour, ignoring case', () => {
    const colours = ['Mango', 'Apple', 'Banana', 'Orange', 'Grapes', 'Kiwi', 'Strawberry'].map(itemColour);
    expect(new Set(colours).size).toBe(7);
    expect(itemColour('mango')).toBe(itemColour('Mango'));
  });

  it('falls back to grey for an unknown item', () => {
    expect(itemColour('Pizza')).toBe('#9ca3af');
  });
});
