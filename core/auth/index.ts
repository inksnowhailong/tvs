/**
 * 登录会话的业务状态。
 *
 * core 只描述“是否具备登录态”这类业务事实，不关心 token 存在哪里，
 * 也不直接调用 request、storage、router 或 UI 提示。
 */
export interface AuthSession {
    /** 当前登录令牌；空字符串、null、undefined 都视为未登录。 */
    token?: string | null
}

/** Auth 模块的稳定业务状态。 */
export interface AuthState {
    /** 登录令牌，空字符串表示未登录。 */
    token: string
}

/** Auth 状态初始值，供不同端的状态适配层复用。 */
export function createInitialAuthState(): AuthState {
    return {
        token: '',
    }
}

/** 判断当前会话是否具备有效登录态。 */
export function hasAuthToken(session: AuthSession): boolean {
    return Boolean(session.token && session.token.trim())
}

/** 判断指定请求是否应该携带登录令牌。 */
export function shouldAttachAuthToken(url: string, session: AuthSession): boolean {
    return hasAuthToken(session) && !url.includes('/login')
}

/** 写入 token 时统一裁剪空白，避免端侧各自处理。 */
export function normalizeAuthToken(token: string | null | undefined): string {
    return token?.trim() ?? ''
}
