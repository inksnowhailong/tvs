import { createRequestClient } from '@tvs/request'
import { createAxiosRequestAdapter } from '@tvs/request-axios'
import { userStore } from '@/adapters/store/userStore'

/** 当前端的请求客户端：只负责注入 Web/App 运行时能力。 */
export const request = createRequestClient(
    createAxiosRequestAdapter({
        baseURLs: {
            default: import.meta.env.VITE_API_URL,
        },
        getToken: () => userStore.$state.token,
        getPlatformId: () => import.meta.env.VITE_PLATFORM_ID,
        feedback: {
            startLoading: () => window.$loading?.start(),
            finishLoading: (success) => {
                if (success) {
                    window.$loading?.finish()
                } else {
                    window.$loading?.error()
                }
            },
            success: (message) => window.$message?.('success', message),
            error: (message) => window.$message?.('error', message),
        },
        onUnauthorized: () => {
            window.location.href = `${window.location.origin}/login?time=${Date.now()}`
        },
    }),
)

export default request
