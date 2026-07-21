import type { WeatherAlert } from '@/types/weather';

export const mockAlerts: WeatherAlert[] = [
  {
    id: 'rain-yellow',
    title: '暴雨黄色预警',
    level: 'yellow',
    type: '暴雨',
    district: '罗湖区、福田区、南山区',
    description: '预计未来六小时中南部地区仍有强降雨，局地伴有短时大风。',
    issuedAt: '07-09 13:45',
    status: 'active',
    affectedAreas: ['罗湖区', '福田区', '南山区'],
    forecastPeriod: '未来6小时',
    icon: 'rain',
  },
  {
    id: 'wind-blue',
    title: '雷雨大风蓝色预警',
    level: 'blue',
    type: '雷雨大风',
    district: '全市陆地、珠江口海域',
    description: '东部沿海及珠江口可能出现雷雨大风，请注意户外设施安全。',
    issuedAt: '07-09 12:30',
    status: 'active',
    affectedAreas: ['全市陆地', '珠江口海域'],
    forecastPeriod: '未来3小时',
    icon: 'lightning',
  },
];
