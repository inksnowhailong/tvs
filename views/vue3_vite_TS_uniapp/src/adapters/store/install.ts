import { setStorageEngine } from '@tvs/store'

/** 注入当前 UniApp 端的持久化实现。 */
export function installStoreAdapters(): void {
    setStorageEngine({
        getItem: (key) => uni.getStorageSync(key) || null,
        setItem: (key, value) => uni.setStorageSync(key, value),
        removeItem: (key) => uni.removeStorageSync(key),
    })
}
