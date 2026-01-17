import { createApp } from 'vue'

import '@vue-flow/controls/dist/style.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/minimap/dist/style.css'

import { createPinia } from 'pinia'

import App from './App.vue'
import './style.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
