<template>
  <header class="weather-header">
    <div class="weather-header__brand">
      <div class="weather-header__logo" aria-hidden="true">R</div>
      <div>
        <h1>RainScope</h1>
        <p>深圳天气可视化大屏</p>
      </div>
    </div>

    <button class="weather-header__city" type="button">
      <span class="weather-header__pin" aria-hidden="true"></span>
      <span>深圳市</span>
      <span class="weather-header__chevron" aria-hidden="true"></span>
    </button>

    <div class="weather-header__condition">
      <span class="weather-header__weather-icon" aria-hidden="true">☁</span>
      <strong>中雨</strong>
      <span>29°C</span>
    </div>

    <div class="weather-header__chips" aria-label="当前天气指标">
      <span>湿度 <strong>82%</strong></span>
      <span>风速 <strong>5.2m/s</strong></span>
      <span>气压 <strong>1005hPa</strong></span>
    </div>

    <div class="weather-header__time">
      <strong>2026-07-09 14:30:00</strong>
      <span>数据每5分钟更新</span>
    </div>

    <div class="weather-header__actions">
      <button type="button">刷新</button>
      <button type="button">深色模式</button>
    </div>
  </header>
</template>
