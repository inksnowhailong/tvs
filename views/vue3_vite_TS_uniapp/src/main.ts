import { createSSRApp } from 'vue'
import App from './App.vue'
import { piniaInstall } from '@/store'

/** uni-app 微信小程序入口，必须导出 createApp */
export function createApp() {
    const app = createSSRApp(App)
    app.use(piniaInstall)
    return { app }
}
