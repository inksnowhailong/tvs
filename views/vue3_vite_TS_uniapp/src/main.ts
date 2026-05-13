import { createSSRApp } from 'vue'
import App from './App.vue'
import { installStoreAdapters } from '@/adapters/store/install'

/** uni-app 微信小程序入口，必须导出 createApp */
export function createApp() {
    installStoreAdapters()
    const app = createSSRApp(App)
    return { app }
}
