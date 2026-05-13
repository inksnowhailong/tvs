import {
    createInitialAuthState,
    hasAuthToken,
    normalizeAuthToken,
} from '@tvs/auth'
import { createStore } from '@tvs/store'

/** 用户登录态 Store，业务状态来自 core/auth，持久化机制来自 infrastructure/store。 */
export const userStore = createStore('userStore', {
    state: createInitialAuthState(),
    computed: {
        isLoggedIn: hasAuthToken,
    },
    actions: {
        setToken(ctx, token: string) {
            ctx.set('token', normalizeAuthToken(token))
        },
        clearToken(ctx) {
            ctx.set('token', '')
        },
    },
    persist: ['token'],
})
