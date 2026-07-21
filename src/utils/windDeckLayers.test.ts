import { describe, expect, it } from 'vitest';

import { getWindStreamColor } from './windDeckLayers';

describe('wind deck layers', () => {
  it('uses brighter colors for faster wind', () => {
    expect(getWindStreamColor(2)).toEqual([92, 157, 220, 180]);
    expect(getWindStreamColor(4)).toEqual([94, 193, 255, 205]);
    expect(getWindStreamColor(6)).toEqual([126, 231, 255, 220]);
  });
});
