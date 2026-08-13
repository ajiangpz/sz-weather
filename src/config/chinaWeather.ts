export const CHINA_CENTER: [number, number] = [104.2, 35.8];

export const CHINA_BOUNDS: [[number, number], [number, number]] = [
  [73.4, 18.0],
  [135.2, 53.8],
];

export const CHINA_NAVIGATION_BOUNDS: [[number, number], [number, number]] = [
  [68.0, 7.0],
  [145.0, 58.0],
];

export const REFERENCE_FORECAST_LOCATION = {
  name: '北京',
  latitude: 39.9042,
  longitude: 116.4074,
} as const;

export const CHINA_MAJOR_CITIES = [
  { id: 'beijing', name: '北京', longitude: 116.4074, latitude: 39.9042 },
  { id: 'shanghai', name: '上海', longitude: 121.4737, latitude: 31.2304 },
  { id: 'guangzhou', name: '广州', longitude: 113.2644, latitude: 23.1291 },
  { id: 'shenzhen', name: '深圳', longitude: 114.0579, latitude: 22.5431 },
  { id: 'chengdu', name: '成都', longitude: 104.0665, latitude: 30.5723 },
  { id: 'wuhan', name: '武汉', longitude: 114.3054, latitude: 30.5931 },
  { id: 'xian', name: '西安', longitude: 108.9398, latitude: 34.3416 },
  { id: 'urumqi', name: '乌鲁木齐', longitude: 87.6168, latitude: 43.8256 },
  { id: 'harbin', name: '哈尔滨', longitude: 126.6424, latitude: 45.7560 },
  { id: 'lhasa', name: '拉萨', longitude: 91.1322, latitude: 29.6604 },
] as const;
