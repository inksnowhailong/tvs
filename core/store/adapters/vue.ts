import { shallowRef, computed as vueComputed, onScopeDispose } from 'vue'
import type { ComputedRef, WritableComputedRef } from 'vue'
import type {
    StateTree,
    StoreInstance,
    ComputedDefs,
    ActionDefs,
    InferComputed,
    InferActions,
} from '../engine/types'

// ============================================================
// Vue 适配器
// ============================================================
//
// 将 StoreInstance 转化为 Vue 响应式对象：
//   - state 字段 → WritableComputedRef（可读可写，.value 赋值即更新）
//   - computed  → ComputedRef（只读 .value）
//   - actions   → 直接调用的函数
//
// 使用方式：
//   import { useVueStore } from 'store/vue'
//   const store = useVueStore(userStore)
//   store.name.value          // 读 state
//   store.name.value = 'new'  // 写 state（走持久化通道）
//   store.isLoggedIn.value    // 读 computed
//   store.login(cred)         // 调用 action
//

/** Vue 适配后的 Store 返回类型 */
export type VueStoreResult<
    S extends StateTree,
    C extends ComputedDefs<S>,
    A extends ActionDefs<S>,
> = {
    /** State 字段：可读可写的 Ref */
    [K in keyof S]: WritableComputedRef<S[K]>
} & {
    /** 计算属性：只读 Ref */
    readonly [K in keyof InferComputed<C>]: ComputedRef<InferComputed<C>[K]>
} & InferActions<A> & {
    $reset(): void
    $patch(partial: Partial<S>): void
}

/**
 * 将 Store 实例转化为 Vue 响应式对象
 *
 * @example
 * const store = useVueStore(userStore)
 *
 * // 读 state
 * store.name.value
 *
 * // 写 state（自动走持久化通道）
 * store.name.value = 'new name'
 *
 * // 读 computed
 * store.isLoggedIn.value
 *
 * // 调用 action
 * store.login({ user: 'admin', pass: '123' })
 */
export function useVueStore<
    S extends StateTree,
    C extends ComputedDefs<S>,
    A extends ActionDefs<S>,
>(store: StoreInstance<S, C, A>): VueStoreResult<S, C, A> {
    // 用 shallowRef 追踪整个 state，避免深层响应式的性能开销
    const snapshot = shallowRef(store.$atom.get())

    // 监听 nanostores 变化，同步到 Vue 响应式系统
    const unsub = store.$atom.listen((state) => {
        snapshot.value = state
    })
    onScopeDispose(unsub)

    const result: any = {}

    // ---- State：每个字段变成 WritableComputedRef ----
    for (const key of Object.keys(store.$state)) {
        result[key] = vueComputed({
            get: () => (snapshot.value as any)[key],
            set: (val: any) => store.$set(key as keyof S, val),
        })
    }

    // ---- Computed：每个变成只读 ComputedRef ----
    const computedStore = store.$computed as Record<string, any>
    const computedKeys = new Set(Object.keys(computedStore))

    for (const [cKey, cAtom] of Object.entries(computedStore)) {
        // 为每个 computed atom 创建独立的 shallowRef，实现细粒度更新
        const cRef = shallowRef(cAtom.get())
        const cUnsub = cAtom.listen((val: any) => {
            cRef.value = val
        })
        onScopeDispose(cUnsub)
        result[cKey] = vueComputed(() => cRef.value)
    }

    // ---- Actions：直接挂载（无需 .value） ----
    for (const key of Object.keys(store)) {
        if (key.startsWith('$')) continue
        if (computedKeys.has(key)) continue
        if (typeof (store as any)[key] === 'function') {
            result[key] = (store as any)[key]
        }
    }

    // ---- Meta 方法 ----
    result.$reset = store.$reset
    result.$patch = (partial: Partial<S>) => store.$patch(partial)

    return result as VueStoreResult<S, C, A>
}
