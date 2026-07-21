import { describe, expect, it } from 'vitest';

import { getWindStreamColor } from './windDeckLayers';

describe('wind deck layers', () => {
  it('uses brighter colors for faster wind', () => {
    expect(getWindStreamColor(2)).toEqual([76, 139, 204, 105]);
    expect(getWindStreamColor(4)).toEqual([82, 181, 244, 135]);
    expect(getWindStreamColor(6)).toEqual([118, 222, 255, 165]);
  });
});
