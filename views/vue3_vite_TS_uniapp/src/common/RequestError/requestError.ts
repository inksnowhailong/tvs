/** 接口成功的统一回调 */
export function successHandle(response: any, _options: Request.TCustomOptions) {
    if (_options.successMessage) {
        const msg =
            typeof _options.successMessage === 'string'
                ? _options.successMessage
                : response.data?.message

        if (msg) {
            uni.showToast({ title: msg, icon: 'success' })
        }
    }
}

/** http 错误和 code 错误的统一处理 */
export function errorHandle(
    errorConfig: any,
    custom_options: Request.TCustomOptions,
    type: 'http' | 'code' | 'request'
) {
    let errorData: { code?: number; message: string; messageStatus: string } = {
        message: '',
        messageStatus: 'error',
    }

    switch (type) {
        case 'http':
            errorData = httpErrorStatusHandle(errorConfig)
            break
        case 'code':
            errorData = codeErrorStatusHandle(errorConfig)
            break
        case 'request':
            return Promise.resolve({
                code: 400,
                data: errorConfig,
                message: '请求发送失败',
            })
        default:
            break
    }

    if (custom_options.errorMessage) {
        const msg =
            typeof custom_options.errorMessage === 'string'
                ? custom_options.errorMessage
                : errorData.message

        if (msg) {
            uni.showToast({ title: msg, icon: 'none', duration: 3000 })
        }
    }

    return Promise.resolve({
        code: errorData.code || 500,
        data: errorData.message,
    })
}

/** 处理 http 层失败（网络错误、超时等） */
export function httpErrorStatusHandle(error: any) {
    let message = ''
    const statusCode = error?.statusCode ?? error?.response?.status

    switch (statusCode) {
        case 302:
            message = '接口重定向了！'
            break
        case 400:
            message = '参数不正确！'
            break
        case 401:
            message = '您未登录，或者登录已经超时，请先登录！'
            uni.navigateTo({ url: '/pages/login/login' })
            break
        case 403:
            message = '您没有权限操作！'
            break
        case 404:
            message = `请求地址出错: ${error?.config?.url ?? ''}`
            break
        case 408:
            message = '请求超时！'
            break
        case 409:
            message = '系统已存在相同数据！'
            break
        case 500:
            message = '服务器内部错误！'
            break
        case 501:
            message = '服务未实现！'
            break
        case 502:
            message = '网关错误！'
            break
        case 503:
            message = '服务不可用！'
            break
        case 504:
            message = '服务暂时无法访问，请稍后再试！'
            break
        case 505:
            message = 'HTTP版本不受支持！'
            break
        default:
            message = error?.errMsg?.includes('timeout')
                ? '网络请求超时！'
                : '异常问题，请联系管理员！'
    }

    return { code: statusCode, message, messageStatus: 'error' }
}

/** http 成功但业务状态码错误 */
export function codeErrorStatusHandle(response: any) {
    const code = response?.data?.code ?? response?.statusCode
    let message = ''
    let messageStatus = 'error'

    switch (code) {
        case 403:
            message = '您没有权限操作!'
            messageStatus = 'warning'
            break
        case 400:
            message = '请求数据异常!'
            break
        case 500:
            message = response?.data?.message ?? '服务器内部错误！'
            break
        default:
            message = `异常问题${code || 500}，请联系管理员！`
    }

    return { message, messageStatus, code }
}

/** request 请求的 loading 控制 */
export class RequestLoading {
    _count = 0

    start() {
        this._count++
        if (this._count === 1) {
            uni.showLoading({ title: '加载中...', mask: true })
        }
    }

    close(_options: Request.TCustomOptions, _success: boolean) {
        if (!_options.loading) return
        if (this._count > 0) this._count--
        if (this._count === 0) {
            uni.hideLoading()
        }
    }
}
