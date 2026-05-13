import { shouldAttachAuthToken } from '@tvs/auth'
import {
    createRequestKey,
    getBusinessErrorMessage,
    getHttpErrorMessage,
    isSuccessResponse,
    resolveRequestCustomOptions,
    trimStringFields,
} from '@tvs/request'
import type {
    ManagedRequestOptions,
    RequestAdapter,
    RequestCustomOptions,
    RequestErrorInfo,
    RequestOptions,
    RequestResponse,
} from '@tvs/request'

interface UniRequestTask {
    abort(): void
}

interface UniRequestSuccessResult {
    statusCode: number
    data: unknown
}

interface UniRequestFailResult {
    errMsg?: string
}

interface UniRequestOptions {
    url: string
    method: RequestOptions['method']
    data?: unknown
    header?: Record<string, string>
    timeout?: number
    success(response: UniRequestSuccessResult): void
    fail(error: UniRequestFailResult): void
    complete(): void
}

declare const uni: {
    request(options: UniRequestOptions): UniRequestTask
}

/** UniApp 请求过程中的 UI 反馈适配。 */
export interface UniRequestFeedback {
    startLoading?(): void
    finishLoading?(success: boolean): void
    success?(message: string): void
    error?(message: string): void
}

/** uni.request 请求适配器配置。 */
export interface UniRequestAdapterOptions {
    baseURLs?: Record<string, string>
    timeout?: number
    getToken?: () => string | null | undefined
    getPlatformId?: () => string | undefined
    feedback?: UniRequestFeedback
    onUnauthorized?: () => void
}

/** 创建基于 uni.request 的小程序请求适配器。 */
export function createUniRequestAdapter(
    options: UniRequestAdapterOptions = {},
): RequestAdapter {
    const pendingMap = new Map<string, UniRequestTask>()

    return {
        send<TResponse = unknown, TData = unknown>(
            requestOptions: ManagedRequestOptions<TData>,
        ): Promise<RequestResponse<TResponse>> {
            const customOptions = resolveRequestCustomOptions(
                requestOptions.customOptions,
            )
            const requestConfig = prepareUniRequest(
                requestOptions,
                customOptions,
                options,
            )
            const requestKey = createRequestKey(requestConfig)
            let requestSucceeded = false

            if (customOptions.repeatRequestCancel) {
                pendingMap.get(requestKey)?.abort()
            }

            if (customOptions.loading) {
                options.feedback?.startLoading?.()
            }

            return new Promise((resolve) => {
                const task = uni.request({
                    url: resolveURL(requestConfig, customOptions, options.baseURLs),
                    method: requestConfig.method ?? 'GET',
                    data: requestConfig.data,
                    header: requestConfig.headers,
                    timeout: requestConfig.timeout ?? options.timeout,
                    success(response) {
                        const body = response.data as {
                            code?: number
                            data?: TResponse
                            message?: string
                        }

                        const normalizedResponse: RequestResponse<TResponse> = {
                            code: body?.code ?? response.statusCode,
                            data: customOptions.reductDataFormat
                                ? (body?.data as TResponse)
                                : (response.data as TResponse),
                            message: body?.message,
                            raw: response,
                        }

                        if (!isSuccessResponse(normalizedResponse)) {
                            const errorInfo: RequestErrorInfo = {
                                code: normalizedResponse.code,
                                message: getBusinessErrorMessage(
                                    normalizedResponse.code,
                                    normalizedResponse.message,
                                ),
                                type: 'business',
                                raw: response,
                            }
                            handleUniError(errorInfo, customOptions, options)
                            resolve(normalizedResponse)
                            return
                        }

                        handleUniSuccess(normalizedResponse, customOptions, options)
                        requestSucceeded = true
                        resolve(normalizedResponse)
                    },
                    fail(error) {
                        const errorInfo = normalizeUniError(error)
                        handleUniError(errorInfo, customOptions, options)
                        resolve({
                            code: errorInfo.code,
                            data: errorInfo.message as TResponse,
                            message: errorInfo.message,
                            raw: error,
                        })
                    },
                    complete() {
                        pendingMap.delete(requestKey)
                        if (customOptions.loading) {
                            options.feedback?.finishLoading?.(requestSucceeded)
                        }
                    },
                })

                if (customOptions.repeatRequestCancel) {
                    pendingMap.set(requestKey, task)
                }
            })
        },
    }
}

function prepareUniRequest<TData>(
    requestOptions: ManagedRequestOptions<TData>,
    customOptions: RequestCustomOptions,
    adapterOptions: UniRequestAdapterOptions,
): RequestOptions<TData> {
    if (customOptions.stringTrim) {
        trimStringFields(requestOptions.params)
        trimStringFields(requestOptions.data)
    }

    const headers: Record<string, string> = {
        ...requestOptions.headers,
        logintype: 'other_system',
    }
    const token = adapterOptions.getToken?.()

    if (adapterOptions.getPlatformId?.()) {
        headers.platformId = adapterOptions.getPlatformId() ?? ''
    }

    if (shouldAttachAuthToken(requestOptions.url, { token })) {
        headers.token = token ?? ''
    }

    return {
        ...requestOptions,
        headers,
    }
}

function resolveURL(
    requestOptions: RequestOptions,
    customOptions: RequestCustomOptions,
    baseURLs: Record<string, string> = {},
): string {
    if (requestOptions.url.startsWith('http')) {
        return requestOptions.url
    }

    const baseURL = baseURLs[customOptions.serverType] ?? baseURLs.default ?? ''
    return `${baseURL}${requestOptions.url}`
}

function normalizeUniError(error: UniRequestFailResult): RequestErrorInfo {
    return {
        code: 500,
        message: error.errMsg?.includes('timeout')
            ? '网络请求超时！'
            : getHttpErrorMessage(),
        type: 'http',
        raw: error,
    }
}

function handleUniSuccess<TResponse>(
    response: RequestResponse<TResponse>,
    customOptions: RequestCustomOptions,
    options: UniRequestAdapterOptions,
): void {
    if (!customOptions.successMessage) return
    const message = typeof customOptions.successMessage === 'string'
        ? customOptions.successMessage
        : response.message

    if (message) {
        options.feedback?.success?.(message)
    }
}

function handleUniError(
    errorInfo: RequestErrorInfo,
    customOptions: RequestCustomOptions,
    options: UniRequestAdapterOptions,
): void {
    if (errorInfo.code === 401) {
        options.onUnauthorized?.()
    }

    if (!customOptions.errorMessage) return
    const message = typeof customOptions.errorMessage === 'string'
        ? customOptions.errorMessage
        : errorInfo.message

    options.feedback?.error?.(message)
}
