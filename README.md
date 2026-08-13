# RainScope

RainScope 是一个面向中国区域的天气可视化作品集项目，重点展示全国尺度的降水、雷达、风场、温度、湿度、气压、重点城市、风险区域与时间轴联动。

项目定位不是普通天气查询页，而是一个基于 WebGL / GIS 的气象数据可视化前端，用来验证大范围气象场渲染、模型切换、时序播放、图层组合以及浏览器级视觉 QA。

在线预览：[https://ajiangpz.github.io/sz-weather/](https://ajiangpz.github.io/sz-weather/)

## 当前能力

### 全国地图

- MapLibre GL 深色底图
- 中国默认视野与导航范围
- 禁止横向重复世界地图 `renderWorldCopies: false`
- 10 个重点城市参考点：北京、上海、广州、深圳、成都、武汉、西安、乌鲁木齐、哈尔滨、拉萨
- 全国气象风险演示区域

### 气象图层

- RainViewer 观测雷达 Raster
- Open-Meteo Best Match / GFS 模型切换
- 12 × 8 中国概览预报网格
- 连续降水场
- 温度场
- 湿度场
- 气压等值线
- 动态风场流线
- 图层透明度与主气象场单选

### 时间与交互

- 过去 / 当前 / 预报 Timeline
- 15 分钟展示帧
- 0.5× / 1× / 2× 播放速度
- 地图点击 Picker
- 重点城市点击定位
- 风场、雷达、标量场随时间帧切换

## 数据来源与语义边界

RainScope 同时使用真实公开数据和演示数据，因此 UI 会明确标注数据来源，避免把 DEMO 信息误认为真实实况。

### Open-Meteo

用于预报数据：

- **北京单点参考预报**：Header 当前天气和趋势图的参考点。它不代表“中国当前天气”。
- **中国 12 × 8 概览网格**：用于全国尺度的风、降水、温度、湿度和气压可视化。
- 预报模式目前支持 **Best Match** 与 **GFS**。
- 当前 15 分钟展示帧可能由上游小时级模式插值得到，因此属于预报展示时间帧，不等同于 15 分钟原生模式分辨率。

### RainViewer

用于观测雷达瓦片：

- UI 中标记为 `雷达 LIVE`。
- RainViewer 只作为雷达图层来源。
- 地图 Picker 不会把第三方雷达瓦片直接伪装成点击点的精确 dBZ 数值。
- 当模型网格同时可用时，Picker 的温度、湿度、降水和风参数来自点击经纬度对应的模型网格采样。

### DEMO 数据

目前以下内容仍属于作品集演示数据：

- 重点城市降水排名
- 全国风险 / 预警示例
- 外部接口失败时的全国风场与降水兜底

对应区域会显示 `DEMO`、`演示数据` 或 fallback 状态。

## 技术架构

```text
Browser
├─ Vue 3 + TypeScript + Pinia
├─ MapLibre GL
│  ├─ CARTO / OSM dark raster base
│  ├─ RainViewer radar raster
│  └─ map interaction / viewport
├─ deck.gl MapboxOverlay
│  ├─ precipitation bitmap
│  ├─ temperature bitmap
│  ├─ humidity bitmap
│  ├─ pressure contours
│  └─ animated wind streams
├─ Open-Meteo
│  ├─ Beijing reference forecast
│  └─ China 12 × 8 forecast grid
└─ Timeline
   └─ frame / playback / model synchronization
```

## 技术栈

- Vue 3
- TypeScript
- Vite
- Pinia
- MapLibre GL
- deck.gl
- ECharts
- Vitest
- Playwright Chromium
- GitHub Actions

## 本地运行

推荐使用 Node.js 22 和 pnpm。

```bash
pnpm install
pnpm dev
```

开发服务器默认地址：

```text
http://localhost:5173/
```

本地 QA 默认使用确定性数据；要验证 live 数据链路可使用：

```text
http://localhost:5173/?weather=live
```

## 测试与构建

推荐直接运行完整确定性门禁：

```bash
pnpm verify
```

也可以分别执行：

```bash
pnpm test
pnpm build
```

用户可见的地图、图层、Timeline 或响应式改动还会通过 GitHub Actions 运行真实 Chromium E2E 与截图验收。

当前重点桌面视口：

- 1920 × 1080
- 1536 × 1024
- 1440 × 900

## 项目结构

```text
src/
├─ components/
│  ├─ charts/                 # ECharts 趋势图表
│  └─ weather/                # 地图、图层、预警、指标与 Timeline
├─ config/
│  └─ chinaWeather.ts         # 中国范围、重点城市与参考位置
├─ mock/                      # DEMO 城市、风险、风场等兜底数据
├─ pages/                     # RainScope 页面
├─ services/
│  ├─ openMeteo.ts            # 北京参考预报
│  ├─ openMeteoWindGrid.ts    # 中国 12×8 预报网格
│  ├─ forecastModel.ts        # Best Match / GFS
│  └─ rainViewer.ts           # 观测雷达元数据与瓦片
├─ stores/                    # weather / layer / map / timeline
├─ types/                     # 核心天气类型
└─ utils/                     # 网格插值、Bitmap、等压线、风场等

tests/e2e/                    # Playwright Chromium 场景与视觉证据
```

仓库中的 `shenzhen.json` 与旧 `WeatherMapPanel.vue` 属于深圳版本遗留资产，当前中国主视图由 `ChinaWeatherMapPanel.vue` 驱动。

## 当前限制

当前版本已经完成从深圳到中国范围的核心迁移，但仍有几个明确边界：

1. 全国模式场目前使用规则矩形网格范围渲染，尚未按中国国界进行 mask 裁剪。
2. 尚未加入省级行政区边界。
3. 北京单点趋势只是全国页面的参考趋势，不代表全国平均天气。
4. 重点城市排名与风险预警仍是 DEMO 数据。
5. 全国 12 × 8 网格适合作品集级概览，不等同于专业数值天气产品的高分辨率格点服务。

省界与国界裁剪会在确认可靠、可授权的数据源后单独实现，不使用来源不明的边界数据。

## 项目演进

RainScope 最初是深圳城市级天气大屏。随着真实雷达、模式预报、风场与标量场能力增加，城市范围的空间差异不足以体现这些能力，因此当前版本已经升级为 **中国天气可视化**。

现在更核心的展示重点是：

- 大范围气象场
- 真实 / DEMO 数据源边界
- WebGL 地图性能
- 多图层组合
- 时间维度动画
- 预报模型切换
- 浏览器级自动化 QA
