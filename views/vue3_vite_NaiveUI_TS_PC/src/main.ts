import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@/router/permission'
import '@/styles/index.less'
import AlertAndErrorLayerInstall from './common/AlertAndErrorLayerInstall'
import config from '@/config/install'
import { installStoreAdapters } from '@/adapters/store/install'
import 'virtual:uno.css'

installStoreAdapters()
const app = createApp(App)
app.provide('theme', 'dark')
app.config.warnHandler = () => null
/**此处顺序不能乱改 */
app
  .use(config, router) // 配置与预处理
  .use(AlertAndErrorLayerInstall, router) // 消息与异常处理
  .use(router)
  .mount('#app')
