import { createStore } from '@tvs/store'

/** 当前端 UI 壳状态，属于视图层自己的展示偏好。 */
export const mainStore = createStore('mainStore', {
    state: {
        systemName: '基线-管理系统',
        theme: 'light' as 'dark' | 'light',
    },
    persist: ['systemName', 'theme'],
})
