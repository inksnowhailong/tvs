import { createRequestClient } from '@tvs/request'
import { createUniRequestAdapter } from '@tvs/request-uni'
import { userStore } from '@/adapters/store/userStore'

/** 当前端的请求客户端：只负责注入 UniApp 运行时能力。 */
export const request = createRequestClient(
    createUniRequestAdapter({
        baseURLs: {
            default: import.meta.env.VITE_API_URL,
        },
        getToken: () => userStore.$state.token,
        getPlatformId: () => import.meta.env.VITE_PLATFORM_ID,
        feedback: {
            startLoading: () => uni.showLoading({ title: '加载中...', mask: true }),
            finishLoading: () => uni.hideLoading(),
            success: (message) => uni.showToast({ title: message, icon: 'success' }),
            error: (message) => uni.showToast({ title: message, icon: 'none', duration: 3000 }),
        },
        onUnauthorized: () => {
            uni.navigateTo({ url: '/pages/login/login' })
        },
    }),
)

export default request
