# RainScope

RainScope 是一个面向深圳的天气可视化大屏项目，重点展示降雨雷达、天气预警、监测站点、趋势图表和时间轴播放。项目定位是作品集级数据可视化前端，而不是普通的城市天气查询应用。

当前版本使用 Mock 数据，不依赖真实天气 API。

在线预览：[https://ajiangpz.github.io/sz-weather/](https://ajiangpz.github.io/sz-weather/)

## 功能

- MapLibre GL + 深色地图底图
- deck.gl 降雨雷达 Bitmap 图层
- 不规则连续降雨回波和分级色带
- 地图点击雨强采样与天气信息弹窗
- 深圳行政区边界和监测站点
- 暴雨、雷雨大风预警区域联动
- 图层开关和透明度调节
- 24 小时天气趋势图表
- 过去、当前、预报时间轴播放
- 1920、1536、1440、平板和移动端响应式布局

## 技术栈

- Vue 3
- TypeScript
- Vite
- Pinia
- MapLibre GL
- deck.gl
- ECharts
- CSS Variables
- Vitest

## 本地运行

推荐使用 Node.js 22 和 pnpm。

```powershell
pnpm install
pnpm dev
```

开发服务器默认地址：

```text
http://localhost:5173/
```

## 测试与构建

运行测试：

```powershell
pnpm test
```

执行 TypeScript 检查并生成生产构建：

```powershell
pnpm build
```

预览生产构建：

```powershell
pnpm preview
```

## 项目结构

```text
src/
├─ components/
│  ├─ charts/              # ECharts 通用封装和趋势图表
│  └─ weather/             # 地图、预警、指标、图层和时间轴组件
├─ mock/                   # 天气、雷达、站点和预警 Mock 数据
├─ pages/                  # RainScope 大屏页面
├─ stores/                 # 天气、图层、地图和时间轴 Pinia Store
├─ types/                  # 核心天气数据类型
└─ utils/                  # 雷达数据及 deck.gl 图层生成工具

docs/                      # 产品、交互、视觉和响应式设计文档
shenzhen.json              # 深圳行政区 GeoJSON 数据
```

## 状态边界

- `weatherStore`：天气、站点、预警、趋势和雷达 Mock 数据
- `layerStore`：图层开关及透明度
- `timelineStore`：当前帧、播放速度和过去/预报状态
- `mapStore`：选中站点、选中预警和地图弹窗

## 地图与雷达实现

MapLibre GL 负责底图、视角、行政区、站点及地图生命周期；deck.gl 的 `MapboxOverlay` 负责降雨雷达渲染。

雷达图层和地图点击查询共享同一个强度场。点击地图时会按经纬度采样当前帧的雷达数据，因此弹窗中的降雨等级和雨强与地图颜色保持一致。

## 数据说明

当前数据全部为演示用 Mock 数据，时间基准为 `2026-07-09 14:30`。数据结构按照未来接入真实天气 API 的方式组织，但当前版本不会发起真实天气接口请求。

## 设计文档

主要需求和设计说明位于：

- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/UI_DESIGN_SPEC.md`
- `docs/VISUAL_STYLE_GUIDE.md`
- `docs/COMPONENT_ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/INTERACTION_SPEC.md`
- `docs/RESPONSIVE_SPEC.md`
- `docs/CODEX_TASKS.md`

## 分支

当前 deck.gl 雷达实现位于 `deckGL` 分支。
