export const dashboardChartGrid = { left: 34, right: 22, top: 36, bottom: 30 };
export const dashboardAxisLine = { lineStyle: { color: 'rgba(125, 170, 205, .18)' } };
export const dashboardSplitLine = { lineStyle: { color: 'rgba(125, 170, 205, .09)' } };
export const dashboardAxisLabel = { color: '#7892ad', fontSize: 10 };

export const createCurrentTimeMarkLine = (label: string, xAxis: string) => ({
  silent: true,
  symbol: ['none', 'none'],
  lineStyle: { color: '#4ba3ff', width: 1.5, type: 'dashed' as const },
  label: {
    show: true,
    formatter: label,
    color: '#dff2ff',
    fontSize: 9,
    padding: [2, 4],
    backgroundColor: 'rgba(30,139,255,.72)',
    borderRadius: 3,
  },
  data: [{ xAxis }],
});
