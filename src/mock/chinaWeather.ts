import type { WeatherAlert, WeatherStation } from '@/types/weather';
import { CHINA_MAJOR_CITIES } from '@/config/chinaWeather';

const demoValues: Array<Pick<WeatherStation, 'rainfall1h' | 'rainfall24h' | 'temperature' | 'humidity' | 'windSpeed'>> = [
  { rainfall1h: 0.0, rainfall24h: 1.2, temperature: 28.1, humidity: 62, windSpeed: 2.6 },
  { rainfall1h: 0.4, rainfall24h: 6.8, temperature: 31.2, humidity: 70, windSpeed: 3.8 },
  { rainfall1h: 5.6, rainfall24h: 42.5, temperature: 29.6, humidity: 84, windSpeed: 5.1 },
  { rainfall1h: 3.2, rainfall24h: 31.4, temperature: 29.3, humidity: 82, windSpeed: 5.4 },
  { rainfall1h: 1.4, rainfall24h: 18.2, temperature: 27.5, humidity: 78, windSpeed: 2.9 },
  { rainfall1h: 2.3, rainfall24h: 24.7, temperature: 30.1, humidity: 76, windSpeed: 3.3 },
  { rainfall1h: 0.0, rainfall24h: 0.8, temperature: 30.4, humidity: 58, windSpeed: 2.4 },
  { rainfall1h: 0.0, rainfall24h: 0.2, temperature: 26.8, humidity: 39, windSpeed: 4.7 },
  { rainfall1h: 0.0, rainfall24h: 0.6, temperature: 25.2, humidity: 61, windSpeed: 3.0 },
  { rainfall1h: 0.2, rainfall24h: 3.5, temperature: 21.6, humidity: 68, windSpeed: 3.6 },
];

export const mockChinaCities: WeatherStation[] = CHINA_MAJOR_CITIES.map((city, index) => ({
  id: city.id,
  name: city.name,
  district: '全国重点城市',
  longitude: city.longitude,
  latitude: city.latitude,
  ...demoValues[index],
}));

export const mockChinaAlerts: WeatherAlert[] = [
  {
    id: 'south-china-rain-yellow',
    title: '华南强降雨黄色风险提示',
    level: 'yellow',
    type: 'rain',
    district: '华南区域',
    description: '演示风险：华南部分区域存在短时强降雨和局地雷暴风险。',
    issuedAt: '14:20',
    status: 'active',
    affectedAreas: ['广东', '广西', '海南'],
    forecastPeriod: '未来 6 小时',
    icon: 'rain',
  },
  {
    id: 'east-china-convective-blue',
    title: '华东强对流蓝色风险提示',
    level: 'blue',
    type: 'lightning',
    district: '华东区域',
    description: '演示风险：华东沿海局地可能出现雷雨大风和短时强降水。',
    issuedAt: '13:50',
    status: 'active',
    affectedAreas: ['浙江', '福建', '江西'],
    forecastPeriod: '未来 6 小时',
    icon: 'lightning',
  },
];
