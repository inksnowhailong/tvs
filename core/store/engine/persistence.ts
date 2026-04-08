import type { StorageEngine, StateTree } from './types'

// ============================================================
// 持久化适配器
// ============================================================
//
// 职责：提供跨平台的状态持久化能力
// 设计：通过 setStorageEngine 注入具体存储实现，与平台解耦
//
// 存储格式：store:{storeId}:{fieldKey} → JSON string
// 例如：store:user:token → "\"abc123\""
//

/** 当前存储引擎（未设置时持久化静默跳过） */
let currentEngine: StorageEngine | null = null

/**
 * 设置存储引擎
 * 应在应用启动时、创建 store 之前调用
 *
 * @example
 * // 浏览器
 * setStorageEngine(window.localStorage)
 *
 * // UniApp
 * setStorageEngine({
 *     getItem: (key) => uni.getStorageSync(key) || null,
 *     setItem: (key, value) => uni.setStorageSync(key, value),
 *     removeItem: (key) => uni.removeStorageSync(key),
 * })
 */
export function setStorageEngine(engine: StorageEngine): void {
    currentEngine = engine
}

/** 获取当前存储引擎（用于测试或调试） */
export function getStorageEngine(): StorageEngine | null {
    return currentEngine
}

/** 生成持久化存储 key */
function buildKey(storeId: string, field: string): string {
    return `store:${storeId}:${field}`
}

/**
 * 从存储中恢复已持久化的字段
 * 返回需要合并到初始状态的部分数据
 */
export function loadPersistedState<S extends StateTree>(
    storeId: string,
    keys: (keyof S)[],
): Partial<S> {
    if (!currentEngine) return {}

    const restored: Partial<S> = {}

    for (const key of keys) {
        const raw = currentEngine.getItem(buildKey(storeId, key as string))
        if (raw !== null) {
            try {
                (restored as any)[key] = JSON.parse(raw)
            } catch {
                // JSON 解析失败，跳过该字段，使用初始值
            }
        }
    }

    return restored
}

/** 将单个字段写入存储 */
export function savePersistedField(
    storeId: string,
    key: string,
    value: unknown,
): void {
    if (!currentEngine) return
    currentEngine.setItem(buildKey(storeId, key), JSON.stringify(value))
}

/** 清除指定 store 的所有持久化数据 */
export function clearPersistedState<S extends StateTree>(
    storeId: string,
    keys: (keyof S)[],
): void {
    if (!currentEngine) return
    for (const key of keys) {
        currentEngine.removeItem(buildKey(storeId, key as string))
    }
}
