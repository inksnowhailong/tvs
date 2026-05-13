import { setStorageEngine } from '@tvs/store'

/** 注入当前 Web/App 端的持久化实现。 */
export function installStoreAdapters(): void {
    setStorageEngine(sessionStorage)
}
