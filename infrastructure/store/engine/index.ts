// ============================================================
// Store 引擎层统一出口
// 这里是不动的底层实现，提供 createStore 能力和持久化基础设施
// ============================================================

export { createStore } from './create-store'
export { setStorageEngine, getStorageEngine } from './persistence'

export type {
    StateTree,
    StoreContext,
    StoreOptions,
    StoreInstance,
    ComputedDefs,
    ActionDefs,
    PersistConfig,
    StorageEngine,
    InferComputed,
    InferActions,
} from './types'
