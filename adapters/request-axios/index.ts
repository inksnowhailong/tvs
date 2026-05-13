import axios, { AxiosInstance } from 'axios'
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

/** Web/App 请求过程中的 UI 反馈适配。 */
export interface AxiosRequestFeedback {
    startLoading?(): void
    finishLoading?(success: boolean): void
    success?(message: string): void
    error?(message: string): void
}

/** axios 请求适配器配置。 */
export interface AxiosRequestAdapterOptions {
    baseURLs?: Record<string, string>
    timeout?: number
    getToken?: () => string | null | undefined
    getPlatformId?: () => string | undefined
    feedback?: AxiosRequestFeedback
    onUnauthorized?: () => void
}

/** 创建基于 axios 的 Web/App 请求适配器。 */
export function createAxiosRequestAdapter(
    options: AxiosRequestAdapterOptions = {},
): RequestAdapter {
    const client: AxiosInstance = axios.create({
        timeout: options.timeout ?? 30000,
    })
    const pendingMap = new Map<string, AbortController>()

    return {
        async send<TResponse = unknown, TData = unknown>(
            requestOptions: ManagedRequestOptions<TData>,
        ): Promise<RequestResponse<TResponse>> {
            const customOptions = resolveRequestCustomOptions(
                requestOptions.customOptions,
            )
            const requestConfig = prepareAxiosRequest(
                requestOptions,
                customOptions,
                options,
            )
            const requestKey = createRequestKey(requestConfig)
            const abortController = new AbortController()
            let requestSucceeded = false

            if (customOptions.repeatRequestCancel) {
                pendingMap.get(requestKey)?.abort()
                pendingMap.set(requestKey, abortController)
            }

            if (customOptions.loading) {
                options.feedback?.startLoading?.()
            }

            try {
                const response = await client.request({
                    url: requestConfig.url,
                    method: requestConfig.method,
                    data: requestConfig.data,
                    params: requestConfig.params,
                    headers: requestConfig.headers,
                    timeout: requestConfig.timeout,
                    baseURL: resolveBaseURL(customOptions.serverType, options.baseURLs),
                    signal: abortController.signal,
                })

                const normalizedResponse: RequestResponse<TResponse> = {
                    code: response.data?.code ?? response.status,
                    data: customOptions.reductDataFormat
                        ? response.data?.data
                        : response.data,
                    message: response.data?.message,
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
                    handleAxiosError(errorInfo, customOptions, options)
                    return Promise.resolve(normalizedResponse)
                }

                handleAxiosSuccess(normalizedResponse, customOptions, options)
                requestSucceeded = true
                return normalizedResponse
            } catch (error) {
                const errorInfo = normalizeAxiosError(error)
                handleAxiosError(errorInfo, customOptions, options)

                return Promise.resolve({
                    code: errorInfo.code,
                    data: errorInfo.message as TResponse,
                    message: errorInfo.message,
                    raw: error,
                })
            } finally {
                pendingMap.delete(requestKey)
                if (customOptions.loading) {
                    options.feedback?.finishLoading?.(requestSucceeded)
                }
            }
        },
    }
}

function prepareAxiosRequest<TData>(
    requestOptions: ManagedRequestOptions<TData>,
    customOptions: RequestCustomOptions,
    adapterOptions: AxiosRequestAdapterOptions,
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

function resolveBaseURL(
    serverType: string,
    baseURLs: Record<string, string> = {},
): string {
    return baseURLs[serverType] ?? baseURLs.default ?? ''
}

function normalizeAxiosError(error: unknown): RequestErrorInfo {
    if (axios.isCancel(error)) {
        return {
            code: 499,
            message: `请求的重复请求：${(error as Error).message}`,
            type: 'request',
            raw: error,
        }
    }

    if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const timeout = error.message.includes('timeout')
        const network = error.message.includes('Network')

        return {
            code: status ?? 500,
            message: timeout || network ? '网络请求异常！' : getHttpErrorMessage(status),
            type: 'http',
            raw: error,
        }
    }

    return {
        code: 500,
        message: '请求发送失败',
        type: 'request',
        raw: error,
    }
}

function handleAxiosSuccess<TResponse>(
    response: RequestResponse<TResponse>,
    customOptions: RequestCustomOptions,
    options: AxiosRequestAdapterOptions,
): void {
    if (!customOptions.successMessage) return
    const message = typeof customOptions.successMessage === 'string'
        ? customOptions.successMessage
        : response.message

    if (message) {
        options.feedback?.success?.(message)
    }
}

function handleAxiosError(
    errorInfo: RequestErrorInfo,
    customOptions: RequestCustomOptions,
    options: AxiosRequestAdapterOptions,
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
