const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const smoothstep = (value: number) => {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
};

export const getForecastFieldEdgeAlpha = (
  x: number,
  y: number,
  width: number,
  height: number,
  featherRatio = 0.045,
) => {
  if (width <= 1 || height <= 1 || featherRatio <= 0) return 1;
  const horizontal = Math.min(x, width - 1 - x) / (width - 1);
  const vertical = Math.min(y, height - 1 - y) / (height - 1);
  const edgeDistance = Math.max(0, Math.min(horizontal, vertical));
  return smoothstep(edgeDistance / featherRatio);
};
