import { useSyncExternalStore, useMemo, useRef } from 'react'
import type {
    StateTree,
    StoreInstance,
    ComputedDefs,
    ActionDefs,
    InferComputed,
    InferActions,
} from '@tvs/store'

// ============================================================
// React 适配器
// ============================================================
//
// 将 StoreInstance 转化为 React 风格的 hook 返回值：
//   - state 字段 → 直接读取当前值（组件自动重渲染）
//   - computed  → 直接读取派生值
//   - actions   → 直接调用的函数
//   - set()     → React 风格的状态设置器
//
// 使用方式：
//   import { useReactStore } from '@tvs/store-adapters/react'
//   const store = useReactStore(userStore)
//   store.name               // 读 state（当前值）
//   store.set('name', 'new') // 写 state（React 风格）
//   store.isLoggedIn          // 读 computed
//   store.login(cred)         // 调用 action
//

/** React 适配后的 Store 返回类型 */
export type ReactStoreResult<
    S extends StateTree,
    C extends ComputedDefs<S>,
    A extends ActionDefs<S>,
> = Readonly<S>
    & Readonly<InferComputed<C>>
    & InferActions<A>
    & {
        /** React 风格设置器：set(字段名, 新值) */
        set<K extends keyof S>(key: K, value: S[K]): void
        $reset(): void
        $patch(partial: Partial<S>): void
    }

/**
 * 将 Store 实例转化为 React hook 返回值
 *
 * 基于 useSyncExternalStore，与 React 18+ 并发模式兼容
 *
 * @example
 * function UserProfile() {
 *     const store = useReactStore(userStore)
 *
 *     return (
 *         <div>
 *             <p>{store.name}</p>
 *             <p>{store.isLoggedIn ? '已登录' : '未登录'}</p>
 *             <button onClick={() => store.set('name', 'new')}>改名</button>
 *             <button onClick={() => store.login({ user: 'a', pass: 'b' })}>登录</button>
 *         </div>
 *     )
 * }
 */
export function useReactStore<
    S extends StateTree,
    C extends ComputedDefs<S>,
    A extends ActionDefs<S>,
>(store: StoreInstance<S, C, A>): ReactStoreResult<S, C, A> {
    // 订阅 nanostores，状态变更时触发 React 重渲染
    const state = useSyncExternalStore(
        (onStoreChange: () => void) => store.$atom.listen(() => onStoreChange()),
        () => store.$atom.get(),
    )

    // 缓存稳定引用（actions / set / meta 不随 state 变化而重建）
    const stableRef = useRef<Record<string, any> | null>(null)
    if (!stableRef.current) {
        const stable: Record<string, any> = {}
        const computedKeys = new Set(Object.keys(store.$computed as object))

        // Actions
        for (const key of Object.keys(store)) {
            if (key.startsWith('$')) continue
            if (computedKeys.has(key)) continue
            if (typeof (store as any)[key] === 'function') {
                stable[key] = (store as any)[key]
            }
        }

        // React 风格设置器
        stable.set = <K extends keyof S>(key: K, value: S[K]) => store.$set(key, value)
        stable.$reset = store.$reset
        stable.$patch = (partial: Partial<S>) => store.$patch(partial)

        stableRef.current = stable
    }

    // 合并响应式数据 + 稳定引用
    return useMemo(() => {
        const result: any = { ...state }

        // Computed 值
        for (const [key, atom] of Object.entries(store.$computed as Record<string, any>)) {
            result[key] = atom.get()
        }

        // 合入稳定引用（actions / set / meta）
        Object.assign(result, stableRef.current)

        return result as ReactStoreResult<S, C, A>
    }, [state])
}
