import { successHandle, errorHandle, RequestLoading } from '@/common/RequestError/requestError'
import { userStore } from '@/store/modules/userStore'
import { trimParams } from './tool'

/** baseUrl 配置 */
const baseURLObj: Record<string, string> = {
    default: import.meta.env.VITE_API_URL,
    // usercenter: import.meta.env.VITE_UCENTER_API_URL
}

/** 请求去重 Map：key 为请求唯一标识，value 为 abort 函数 */
const pendingMap = new Map<string, () => void>()

/** 生成请求唯一 key */
function getPendingKey(options: UniApp.RequestOptions): string {
    return [options.url, options.method, JSON.stringify(options.data)].join('&')
}

/** 移除并中止重复请求 */
function removePending(options: UniApp.RequestOptions) {
    const key = getPendingKey(options)
    if (pendingMap.has(key)) {
        pendingMap.get(key)?.()
        pendingMap.delete(key)
    }
}

/** 全局 loading 计数器 */
const loading = new RequestLoading()

/**
 * @description: uni.request 封装，对标原 mainAxios 功能
 * @param {UniApp.RequestOptions} requestOptions uni.request 配置
 * @param {Partial<Request.TCustomOptions>} customOptions 自定义配置
 */
function mainRequest<T>(
    requestOptions: UniApp.RequestOptions,
    customOptions: Partial<Request.TCustomOptions> = {}
): Promise<T> {
    const custom_options: Request.TCustomOptions = Object.assign(
        {
            serverType: 'default',
            repeatRequestCancel: true,
            loading: true,
            reductDataFormat: true,
            errorMessage: true,
            successMessage: false,
            stringTrim: true,
        } as Request.TCustomOptions,
        customOptions
    )

    const baseURL = baseURLObj[custom_options.serverType] ?? ''
    const url = requestOptions.url.startsWith('http')
        ? requestOptions.url
        : `${baseURL}${requestOptions.url}`

    // 去除字符串前后空格
    if (custom_options.stringTrim) {
        trimParams(requestOptions.data as Record<string, unknown>)
    }

    // 构建请求头
    const header: Record<string, string> = {
        ...(requestOptions.header as Record<string, string>),
        logintype: 'other_system',
        platformId: import.meta.env.VITE_PLATFORM_ID ?? '',
    }
    if (userStore.token && requestOptions.url.indexOf('/login') < 0) {
        header['token'] = userStore.token
    }

    const finalOptions: UniApp.RequestOptions = {
        ...requestOptions,
        url,
        header,
    }

    // 去重处理：先移除同一请求
    if (custom_options.repeatRequestCancel) {
        removePending(finalOptions)
    }

    // 开启 loading
    if (custom_options.loading) {
        loading.start()
    }

    return new Promise<T>((resolve) => {
        const task = uni.request({
            ...finalOptions,
            success(response) {
                if (custom_options.repeatRequestCancel) {
                    pendingMap.delete(getPendingKey(finalOptions))
                }
                loading.close(custom_options, true)

                const data = response.data as any
                if (response.statusCode === 200 && data?.code === 200) {
                    successHandle(response, custom_options)
                    resolve((custom_options.reductDataFormat ? data : response) as T)
                } else {
                    resolve(errorHandle(response, custom_options, 'code') as T)
                }
            },
            fail(error) {
                if (custom_options.repeatRequestCancel) {
                    pendingMap.delete(getPendingKey(finalOptions))
                }
                loading.close(custom_options, false)
                resolve(errorHandle(error, custom_options, 'http') as T)
            },
        })

        // 注册中止函数
        if (custom_options.repeatRequestCancel) {
            pendingMap.set(getPendingKey(finalOptions), () => task.abort())
        }
    })
}

export default mainRequest
