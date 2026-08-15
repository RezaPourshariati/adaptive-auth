import { createApp } from 'vue'
import App from '@/App.vue'
import { setupPrimeVue } from '@/app/plugins/primevue'
import router from '@/app/router'
import { createAppStore } from './store'
import '@/assets/main.css'

const app = createApp(App)
const store = createAppStore()

app.use(store)
setupPrimeVue(app)
app.use(router)
app.mount('#app')
