/** 请求方法类型，保持与常见 HTTP 客户端兼容。 */
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** 请求失败来源。 */
export type RequestErrorType = 'request' | 'http' | 'business'

/** 平台无关的请求配置。 */
export interface RequestOptions<TData = unknown> {
    url: string
    method?: RequestMethod
    data?: TData
    params?: Record<string, unknown>
    headers?: Record<string, string>
    timeout?: number
}

/** 业务请求的附加控制选项。 */
export interface RequestCustomOptions {
    /** 后端 baseURL 映射的 key。 */
    serverType: string
    /** 是否取消重复请求。 */
    repeatRequestCancel: boolean
    /** 是否开启 loading 层效果。 */
    loading: boolean
    /** 是否返回精简数据结构。 */
    reductDataFormat: boolean
    /** 是否自动裁剪字符串参数前后空格。 */
    stringTrim: boolean
    /** 是否展示错误消息，字符串时使用该字符串覆盖后端消息。 */
    errorMessage: boolean | string
    /** 是否展示成功消息，字符串时使用该字符串覆盖后端消息。 */
    successMessage: boolean | string
    [propName: string]: unknown
}

/** 完整请求入参，包含基础请求配置和治理选项。 */
export interface ManagedRequestOptions<TData = unknown>
    extends RequestOptions<TData> {
    customOptions?: Partial<RequestCustomOptions>
}

/** 平台无关的请求响应。 */
export interface RequestResponse<TData = unknown> {
    code: number
    data: TData
    message?: string
    raw?: unknown
}

/** 统一错误信息结构，供平台适配层决定如何提示。 */
export interface RequestErrorInfo {
    code: number
    message: string
    type: RequestErrorType
    raw?: unknown
}

/** 具体平台适配器需要实现的请求发送能力。 */
export interface RequestAdapter {
    send<TResponse = unknown, TData = unknown>(
        options: ManagedRequestOptions<TData>,
    ): Promise<RequestResponse<TResponse>>
}

/** 请求治理默认选项。 */
export const defaultRequestCustomOptions: RequestCustomOptions = {
    serverType: 'default',
    repeatRequestCancel: true,
    loading: true,
    reductDataFormat: true,
    stringTrim: true,
    errorMessage: true,
    successMessage: false,
}

/** 合并请求治理选项，避免每个 adapter 重复维护默认值。 */
export function resolveRequestCustomOptions(
    customOptions: Partial<RequestCustomOptions> = {},
): RequestCustomOptions {
    return {
        ...defaultRequestCustomOptions,
        ...customOptions,
    }
}

/** 递归裁剪请求参数中的字符串前后空格。 */
export function trimStringFields<TValue>(value: TValue): TValue {
    if (!value || typeof value !== 'object') {
        return value
    }

    for (const key of Object.keys(value as Record<string, unknown>)) {
        const record = value as Record<string, unknown>
        const item = record[key]
        if (typeof item === 'string') {
            record[key] = item.trim()
        } else if (item && typeof item === 'object') {
            record[key] = trimStringFields(item)
        }
    }

    return value
}

/** 根据请求配置生成去重 key。 */
export function createRequestKey(options: RequestOptions): string {
    return [
        options.method ?? 'GET',
        options.url,
        JSON.stringify(options.params ?? {}),
        JSON.stringify(options.data ?? {}),
    ].join('&')
}

/** 判断响应是否符合项目默认成功约定。 */
export function isSuccessResponse(response: RequestResponse): boolean {
    return response.code === 200
}

/** 将 HTTP 状态码映射为稳定错误语义。 */
export function getHttpErrorMessage(status?: number): string {
    switch (status) {
        case 302:
            return '接口重定向了！'
        case 400:
            return '参数不正确！'
        case 401:
            return '您未登录，或者登录已经超时，请先登录！'
        case 403:
            return '您没有权限操作！'
        case 404:
            return '请求地址出错！'
        case 408:
            return '请求超时！'
        case 409:
            return '系统已存在相同数据！'
        case 500:
            return '服务器内部错误！'
        case 501:
            return '服务未实现！'
        case 502:
            return '网关错误！'
        case 503:
            return '服务不可用！'
        case 504:
            return '服务暂时无法访问，请稍后再试！'
        case 505:
            return 'HTTP版本不受支持！'
        default:
            return '异常问题，请联系管理员！'
    }
}

/** 将业务状态码映射为稳定错误语义。 */
export function getBusinessErrorMessage(code?: number, message?: string): string {
    switch (code) {
        case 400:
            return '请求数据异常!'
        case 403:
            return '您没有权限操作!'
        case 500:
            return message || '服务器内部错误！'
        default:
            return `异常问题${code || 500}，请联系管理员！`
    }
}

/** 请求客户端只编排请求流程，不绑定 axios、fetch、uni.request 等具体实现。 */
export function createRequestClient(adapter: RequestAdapter): RequestAdapter {
    return {
        send: (options) => adapter.send(options),
    }
}
