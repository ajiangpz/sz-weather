import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import './district-labels.css';
import './dashboard-v2.css';
import './windy-visual-foundation.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';

createApp(App).use(createPinia()).mount('#app');
