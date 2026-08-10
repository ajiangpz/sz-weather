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

  it('keeps severe echoes localized while preserving transparent breakup around the field', () => {
    const putImageData = vi.fn();
    const width = 96;
    const height = 64;
    const imageData = { data: new Uint8ClampedArray(width * height * 4) };
    const canvas = { width: 0, height: 0, getContext: () => ({ createImageData: () => imageData, putImageData }) };
    vi.stubGlobal('document', { createElement: () => canvas });

    createRadarBitmap({
      points: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { intensity: 42 }, geometry: { type: 'Point', coordinates: [114.1, 22.55] } },
          { type: 'Feature', properties: { intensity: 12 }, geometry: { type: 'Point', coordinates: [114.02, 22.58] } },
          { type: 'Feature', properties: { intensity: 8 }, geometry: { type: 'Point', coordinates: [114.18, 22.51] } },
        ],
      },
      bounds: [113.8, 22.4, 114.4, 22.8],
      width,
      height,
    });

    const pixels = Array.from({ length: width * height }, (_, index) => {
      const offset = index * 4;
      return {
        red: imageData.data[offset],
        blue: imageData.data[offset + 2],
        alpha: imageData.data[offset + 3],
      };
    });
    const visiblePixels = pixels.filter((pixel) => pixel.alpha > 0);
    const warmCorePixels = visiblePixels.filter((pixel) => pixel.red > pixel.blue * 1.35);

    expect(visiblePixels.length).toBeGreaterThan(40);
    expect(visiblePixels.length).toBeLessThan(width * height * 0.45);
    expect(warmCorePixels.length).toBeGreaterThan(0);
    expect(warmCorePixels.length).toBeLessThan(visiblePixels.length * 0.35);
    vi.unstubAllGlobals();
  });

  it('produces deterministic but irregular multi-scale echo texture', () => {
    const width = 112;
    const height = 72;
    const rendered: Uint8ClampedArray[] = [];
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        createImageData: () => ({ data: new Uint8ClampedArray(width * height * 4) }),
        putImageData: (imageData: { data: Uint8ClampedArray }) => rendered.push(new Uint8ClampedArray(imageData.data)),
      }),
    };
    vi.stubGlobal('document', { createElement: () => canvas });
    const options = {
      points: {
        type: 'FeatureCollection' as const,
        features: [
          { type: 'Feature' as const, properties: { intensity: 44 }, geometry: { type: 'Point' as const, coordinates: [114.18, 22.57] } },
          { type: 'Feature' as const, properties: { intensity: 28 }, geometry: { type: 'Point' as const, coordinates: [114.1, 22.53] } },
          { type: 'Feature' as const, properties: { intensity: 18 }, geometry: { type: 'Point' as const, coordinates: [114.27, 22.61] } },
          { type: 'Feature' as const, properties: { intensity: 10 }, geometry: { type: 'Point' as const, coordinates: [114.03, 22.59] } },
        ],
      },
      bounds: [113.8, 22.4, 114.4, 22.8] as [number, number, number, number],
      width,
      height,
    };

    createRadarBitmap(options);
    createRadarBitmap(options);

    expect(rendered).toHaveLength(2);
    expect(rendered[0]).toEqual(rendered[1]);

    const alphaValues = Array.from({ length: width * height }, (_, index) => rendered[0][index * 4 + 3]).filter((alpha) => alpha > 0);
    const roundedAlphaLevels = new Set(alphaValues.map((alpha) => Math.round(alpha / 8)));
    expect(alphaValues.length).toBeGreaterThan(100);
    expect(roundedAlphaLevels.size).toBeGreaterThan(8);
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
