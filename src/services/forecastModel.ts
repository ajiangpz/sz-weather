export type ForecastModel = 'best_match' | 'gfs';

export interface ForecastModelProfile {
  id: ForecastModel;
  label: string;
  sourceLabel: string;
  windSourceLabel: string;
  endpoint: string;
  note: string;
}

export const FORECAST_MODEL_PROFILES: Record<ForecastModel, ForecastModelProfile> = {
  best_match: {
    id: 'best_match',
    label: 'Best Match',
    sourceLabel: 'Open-Meteo Best Match',
    windSourceLabel: 'Open-Meteo Best Match forecast grid',
    endpoint: 'https://api.open-meteo.com/v1/forecast',
    note: '自动选择当前地点最合适的预报模式',
  },
  gfs: {
    id: 'gfs',
    label: 'GFS',
    sourceLabel: 'Open-Meteo GFS',
    windSourceLabel: 'Open-Meteo GFS forecast grid',
    endpoint: 'https://api.open-meteo.com/v1/gfs',
    note: 'NOAA 全球预报；深圳 15 分钟帧由小时数据插值',
  },
};

export const DEFAULT_FORECAST_MODEL: ForecastModel = 'best_match';

export const getForecastModelProfile = (model: ForecastModel = DEFAULT_FORECAST_MODEL) => (
  FORECAST_MODEL_PROFILES[model]
);
