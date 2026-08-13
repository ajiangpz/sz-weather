import { defineStore } from 'pinia';
import { CHINA_CENTER, REFERENCE_FORECAST_LOCATION } from '@/config/chinaWeather';
import { mockChinaAlerts, mockChinaCities } from '@/mock/chinaWeather';
import { useMapStore } from './mapStore';
import { useTimelineStore } from './timelineStore';
import {
  DEFAULT_FORECAST_MODEL,
  getForecastModelProfile,
  type ForecastModel,
} from '@/services/forecastModel';
import { fetchChinaReferenceForecast, type ForecastFrame } from '@/services/openMeteo';
import {
  fetchChinaForecastGrid,
  type WindGridFrame,
} from '@/services/openMeteoWindGrid';
import {
  buildRainViewerTileTemplate,
  fetchRainViewerRadar,
  findNearestRainViewerFrame,
  type RainViewerRadarFrame,
} from '@/services/rainViewer';

import {
  mockRadarBandsGeoJson,
  mockRadarFragmentsGeoJson,
  mockRadarGeoJson,
  mockRadarRibbonsGeoJson,
  mockRadarSpecklesGeoJson,
  mockDashboardTrends,
  mockRainDistribution,
  mockRainfallTrend,
} from '@/mock/weather';

type WeatherDataStatus = 'mock' | 'loading' | 'live' | 'fallback';
type WindDataStatus = 'mock' | 'loading' | 'live' | 'fallback';
type RadarDataStatus = 'mock' | 'loading' | 'live' | 'fallback';

const createMockCurrentWeather = (frameIndex: number) => {
  const offset = frameIndex - 12;
  const rainWave = Math.sin(offset * 0.34);
  const temperatureWave = Math.sin(offset * 0.22);
  const rainfall1h = Math.max(0.2, 2.4 + rainWave * 1.8);
  const maxRainIntensity = Math.max(1, 8.6 + rainWave * 4.4);
  return {
    rainfall1h: Number(rainfall1h.toFixed(1)),
    rainfall24h: Number((8.8 + rainWave * 2.6).toFixed(1)),
    maxRainIntensity: Number(maxRainIntensity.toFixed(1)),
    temperature: Number((28 + temperatureWave * 1.8).toFixed(1)),
    humidity: Math.round(66 + rainWave * 6),
    windSpeed: Number((3.2 + Math.sin(offset * 0.31) * 1.2).toFixed(1)),
    pressure: Math.round(1008 - rainWave * 3),
    condition: maxRainIntensity >= 16 ? '中雨' : maxRainIntensity >= 4 ? '小雨' : '多云',
  };
};

const createFallbackNationalOverview = () => ({
  maxRainIntensity: 42.8,
  maxTemperature: 36.4,
  minTemperature: 12.8,
  maxWindSpeed: 13.6,
});

export const useWeatherStore = defineStore('weather', {
  state: () => ({
    cityName: '中国',
    referenceLocationName: REFERENCE_FORECAST_LOCATION.name,
    center: [...CHINA_CENTER] as [number, number],
    updatedAt: new Date(),
    forecastModel: DEFAULT_FORECAST_MODEL as ForecastModel,
    dataStatus: 'mock' as WeatherDataStatus,
    dataSource: '演示数据',
    lastError: null as string | null,
    forecastFrames: [] as ForecastFrame[],
    windDataStatus: 'mock' as WindDataStatus,
    windDataSource: '演示全国风场',
    windLastError: null as string | null,
    windForecastFrames: [] as WindGridFrame[],
    radarDataStatus: 'mock' as RadarDataStatus,
    radarDataSource: '演示雷达',
    radarLastError: null as string | null,
    rainViewerHost: '',
    rainViewerFrames: [] as RainViewerRadarFrame[],
    radarGeoJson: mockRadarGeoJson,
    radarBandsGeoJson: mockRadarBandsGeoJson,
    radarFragmentsGeoJson: mockRadarFragmentsGeoJson,
    radarRibbonsGeoJson: mockRadarRibbonsGeoJson,
    radarSpecklesGeoJson: mockRadarSpecklesGeoJson,
    rainfallTrend: mockRainfallTrend,
    dashboardTrends: mockDashboardTrends,
    rainDistribution: mockRainDistribution,
    stations: mockChinaCities,
    alerts: mockChinaAlerts,
  }),
  getters: {
    forecastModelLabel(state) {
      return getForecastModelProfile(state.forecastModel).label;
    },
    forecastModelNote(state) {
      return getForecastModelProfile(state.forecastModel).note;
    },
    modelSwitching(state) {
      return state.dataStatus === 'loading' || state.windDataStatus === 'loading';
    },
    dataStatusLabel(state) {
      if (state.dataStatus === 'live') return '预报 LIVE';
      if (state.dataStatus === 'loading') return '预报更新';
      if (state.dataStatus === 'fallback') return state.forecastFrames.length > 0 ? '预报缓存' : '演示数据';
      return '演示数据';
    },
    windDataStatusLabel(state) {
      if (state.windDataStatus === 'live') return '全国预报风场';
      if (state.windDataStatus === 'loading') return '风场更新';
      return 'DEMO 全国风场';
    },
    radarDataStatusLabel(state) {
      const frameIndex = useTimelineStore().currentFrameIndex;
      const forecastTimestamp = state.forecastFrames[frameIndex]?.timestamp;
      if (state.radarDataStatus === 'live' && forecastTimestamp) {
        const observedFrame = findNearestRainViewerFrame(state.rainViewerFrames, forecastTimestamp);
        if (observedFrame) return '雷达 LIVE';
      }
      if (state.windDataStatus === 'live' && forecastTimestamp) {
        const modelFrame = state.windForecastFrames.find((frame) => frame.timestamp === forecastTimestamp);
        if (modelFrame) return '模式降水 LIVE';
      }
      if (state.radarDataStatus === 'loading' || state.windDataStatus === 'loading') return '降水更新';
      return 'DEMO 降水';
    },
    currentWeather(state) {
      const frameIndex = useTimelineStore().currentFrameIndex;
      const frame = state.forecastFrames[frameIndex];
      if (!frame) return createMockCurrentWeather(frameIndex);

      return {
        rainfall1h: frame.rainfall1h,
        rainfall24h: frame.rainfall24h,
        maxRainIntensity: frame.rainfallIntensity,
        temperature: frame.temperature,
        humidity: frame.humidity,
        windSpeed: frame.windSpeed,
        pressure: frame.pressure,
        condition: frame.condition,
      };
    },
    currentWindGridFrame(state): WindGridFrame | null {
      const frameIndex = useTimelineStore().currentFrameIndex;
      const forecastTimestamp = state.forecastFrames[frameIndex]?.timestamp;
      if (forecastTimestamp) {
        return state.windForecastFrames.find((frame) => frame.timestamp === forecastTimestamp) ?? null;
      }
      return state.windForecastFrames[frameIndex] ?? null;
    },
    nationalOverview(): { maxRainIntensity: number; maxTemperature: number; minTemperature: number; maxWindSpeed: number } {
      const frame = this.currentWindGridFrame;
      if (!frame || frame.samples.length === 0) return createFallbackNationalOverview();
      return {
        maxRainIntensity: Number(Math.max(...frame.samples.map((sample) => sample.precipitation * 4)).toFixed(1)),
        maxTemperature: Number(Math.max(...frame.samples.map((sample) => sample.temperature)).toFixed(1)),
        minTemperature: Number(Math.min(...frame.samples.map((sample) => sample.temperature)).toFixed(1)),
        maxWindSpeed: Number(Math.max(...frame.samples.map((sample) => sample.speed)).toFixed(1)),
      };
    },
    currentRainViewerFrame(state): RainViewerRadarFrame | null {
      if (state.radarDataStatus !== 'live') return null;
      const frameIndex = useTimelineStore().currentFrameIndex;
      const forecastTimestamp = state.forecastFrames[frameIndex]?.timestamp;
      if (!forecastTimestamp) return null;
      return findNearestRainViewerFrame(state.rainViewerFrames, forecastTimestamp);
    },
    currentRainViewerTileTemplate(state): string | null {
      if (state.radarDataStatus !== 'live' || !state.rainViewerHost) return null;
      const frameIndex = useTimelineStore().currentFrameIndex;
      const forecastTimestamp = state.forecastFrames[frameIndex]?.timestamp;
      if (!forecastTimestamp) return null;
      const frame = findNearestRainViewerFrame(state.rainViewerFrames, forecastTimestamp);
      return frame ? buildRainViewerTileTemplate(state.rainViewerHost, frame) : null;
    },
  },
  actions: {
    syncMapPopupToFrame() {
      useMapStore().syncPopup({
        rainfallIntensity: this.currentWeather.maxRainIntensity,
        rainfall1h: this.currentWeather.rainfall1h,
        temperature: this.currentWeather.temperature,
        humidity: this.currentWeather.humidity,
        windSpeed: this.currentWeather.windSpeed,
      });
    },
    async setForecastModel(model: ForecastModel) {
      if (model === this.forecastModel || this.modelSwitching) return;
      this.forecastModel = model;
      await this.loadLiveForecast();
    },
    async loadLiveForecast() {
      if (this.dataStatus === 'loading') return;
      const requestedModel = this.forecastModel;
      this.dataStatus = 'loading';
      this.windDataStatus = 'loading';
      this.radarDataStatus = 'loading';
      this.lastError = null;
      this.windLastError = null;
      this.radarLastError = null;

      const [forecastResult, windResult, radarResult] = await Promise.allSettled([
        fetchChinaReferenceForecast(requestedModel),
        fetchChinaForecastGrid(requestedModel),
        fetchRainViewerRadar(),
      ]);

      if (forecastResult.status === 'fulfilled') {
        const snapshot = forecastResult.value;
        this.forecastFrames = snapshot.frames;
        this.dashboardTrends = snapshot.dashboardTrends;
        this.updatedAt = snapshot.fetchedAt;
        this.dataStatus = 'live';
        this.dataSource = `${snapshot.source} · ${this.referenceLocationName}参考点`;
        useTimelineStore().setFrameTimes(snapshot.frames.map((frame) => frame.time), snapshot.currentIndex);
      } else {
        this.dataStatus = 'fallback';
        this.lastError = forecastResult.reason instanceof Error
          ? forecastResult.reason.message
          : 'Unknown reference forecast error';
        this.dataSource = this.forecastFrames.length > 0 ? '缓存预报' : '演示数据';
      }

      if (forecastResult.status === 'fulfilled' && windResult.status === 'fulfilled') {
        const forecastFrames = forecastResult.value.frames;
        const windFrames = windResult.value.frames;
        const timelinesAlign = forecastFrames.length === windFrames.length
          && forecastFrames.every((frame, index) => frame.timestamp === windFrames[index]?.timestamp);

        if (timelinesAlign) {
          this.windForecastFrames = windFrames;
          this.windDataStatus = 'live';
          this.windDataSource = `${windResult.value.source} · 中国概览网格`;
        } else {
          this.windForecastFrames = [];
          this.windDataStatus = 'fallback';
          this.windDataSource = '演示全国风场';
          this.windLastError = 'Reference forecast and China forecast-grid timelines are not aligned';
        }
      } else {
        this.windForecastFrames = [];
        this.windDataStatus = 'fallback';
        this.windDataSource = '演示全国风场';
        if (windResult.status === 'rejected') {
          this.windLastError = windResult.reason instanceof Error
            ? windResult.reason.message
            : 'Unknown China forecast-grid error';
        } else if (forecastResult.status === 'rejected') {
          this.windLastError = 'Reference forecast unavailable; keep deterministic forecast-grid fallback';
        }
      }

      if (forecastResult.status === 'fulfilled' && radarResult.status === 'fulfilled') {
        this.rainViewerHost = radarResult.value.host;
        this.rainViewerFrames = radarResult.value.frames;
        this.radarDataStatus = 'live';
        this.radarDataSource = radarResult.value.source;
      } else {
        this.rainViewerHost = '';
        this.rainViewerFrames = [];
        this.radarDataStatus = 'fallback';
        this.radarDataSource = '演示雷达';
        if (radarResult.status === 'rejected') {
          this.radarLastError = radarResult.reason instanceof Error
            ? radarResult.reason.message
            : 'Unknown live radar error';
        } else if (forecastResult.status === 'rejected') {
          this.radarLastError = 'Reference forecast unavailable; keep deterministic radar fallback';
        }
      }

      this.syncMapPopupToFrame();
    },
    async refreshData() {
      await this.loadLiveForecast();
    },
  },
});
