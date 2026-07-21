import { describe, expect, it, vi } from 'vitest';

import { createRadarBitmap, createRainRadarBitmapLayer, getRadarColor, sampleRadarIntensity } from './radarDeckLayers';

describe('radarDeckLayers', () => {
  it('maps radar levels to rgba colors', () => {
    expect(getRadarColor('light', 0.5)).toEqual([75, 163, 255, 128]);
    expect(getRadarColor('severeStorm', 0.75)).toEqual([232, 76, 136, 191]);
  });

  it('creates a single bitmap layer covering the supplied geographic bounds', () => {
    const canvas = {} as HTMLCanvasElement;
    const bounds: [number, number, number, number] = [113.68, 22.34, 114.68, 22.88];
    const layer = createRainRadarBitmapLayer({ image: canvas, bounds, opacity: 0.7, visible: true });
    const props = layer.props as unknown as { image: HTMLCanvasElement; bounds: typeof bounds };
    expect(layer.id).toBe('deck-radar-bitmap');
    expect(props.image).toBe(canvas);
    expect(props.bounds).toEqual(bounds);
  });

  it('renders the scalar field into an rgba canvas', () => {
    const putImageData = vi.fn();
    const imageData = { data: new Uint8ClampedArray(16 * 12 * 4) };
    const canvas = { width: 0, height: 0, getContext: () => ({ createImageData: () => imageData, putImageData }) };
    vi.stubGlobal('document', { createElement: () => canvas });
    createRadarBitmap({
      points: {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { intensity: 36 }, geometry: { type: 'Point', coordinates: [114.1, 22.55] } }],
      },
      bounds: [113.8, 22.4, 114.4, 22.8],
      width: 16,
      height: 12,
    });
    expect(putImageData).toHaveBeenCalledOnce();
    expect(imageData.data.some((value) => value > 0)).toBe(true);
    vi.unstubAllGlobals();
  });

  it('samples popup intensity from the same radar field used by the bitmap', () => {
    const points = {
      type: 'FeatureCollection' as const,
      features: [{ type: 'Feature' as const, properties: { intensity: 36 }, geometry: { type: 'Point' as const, coordinates: [114.1, 22.55] } }],
    };
    const bounds: [number, number, number, number] = [113.8, 22.4, 114.4, 22.8];
    const core = sampleRadarIntensity({ points, bounds, longitude: 114.1, latitude: 22.55 });
    const clear = sampleRadarIntensity({ points, bounds, longitude: 113.81, latitude: 22.79 });
    expect(core).toBeGreaterThan(16);
    expect(clear).toBe(0);
  });
});
