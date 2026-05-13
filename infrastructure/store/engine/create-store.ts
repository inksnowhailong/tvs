import { map, computed as nanoComputed } from 'nanostores'
import type {
    StateTree,
    StoreOptions,
    StoreContext,
    StoreInstance,
    ComputedDefs,
    ActionDefs,
    PersistConfig,
} from './types'
import {
    loadPersistedState,
    savePersistedField,
    clearPersistedState,
} from './persistence'
import type { ReadableAtom } from 'nanostores'

// ============================================================
// createStore 实现
// ============================================================
//
// 执行流程：
//
//   createStore('user', options)
//        │
//        ├─ 1. 解析 persist 配置 → 确定哪些字段需要持久化
//        ├─ 2. 加载已持久化的数据 → 合并到初始状态
//        ├─ 3. 创建 nanostores map → 响应式状态容器
//        ├─ 4. 创建 computed atoms → 派生状态
//        ├─ 5. 构建 StoreContext → actions 的操作接口（内置持久化同步）
//        ├─ 6. 绑定 actions → 剥离 ctx，生成外部调用方法
//        └─ 7. 组装 StoreInstance → 挂载 computed getter + actions
//

/** 解析持久化配置，返回需要持久化的字段名列表 */
function resolvePersistKeys<S extends StateTree>(
    state: S,
    persist?: PersistConfig<S>,
): (keyof S)[] {
    if (!persist) return []
    if (persist === true) return Object.keys(state) as (keyof S)[]
    return persist
}

/**
 * 创建 Store
 *
 * @param id - Store 唯一标识，同时用作持久化的命名空间前缀
 * @param options - Store 配置（state / computed / actions / persist）
 * @returns 类型完备的 Store 实例
 *
 * @example
 * // 定义
 * const userStore = createStore('user', {
 *     state: { name: '', token: '', age: 0 },
 *     computed: {
 *         isLoggedIn: (state) => !!state.token,
 *         isAdult: (state) => state.age >= 18,
 *     },
 *     actions: {
 *         login(ctx, credentials: { user: string; pass: string }) {
 *             ctx.set('token', 'mock-token')
 *             ctx.set('name', credentials.user)
 *         },
 *         logout(ctx) { ctx.reset() },
 *     },
 *     persist: ['token'],
 * })
 *
 * // 使用（框架无关）
 * userStore.login({ user: 'admin', pass: '123' })
 * userStore.isLoggedIn  // true
 * userStore.$state.name // 'admin'
 *
 * // Vue 集成（通过适配器，业务代码无需接触 nanostores）
 * import { useVueStore } from '@tvs/store-adapters/vue'
 * const store = useVueStore(userStore)
 * store.name.value          // 读 state
 * store.name.value = 'new'  // 写 state（走持久化通道）
 * store.isLoggedIn.value    // 读 computed
 */
export function createStore<
    S extends StateTree,
    C extends ComputedDefs<S> = {},
    A extends ActionDefs<S> = {},
>(
    id: string,
    options: StoreOptions<S, C, A>,
): StoreInstance<S, C, A> {
    const {
        state: initialState,
        computed: computedDefs,
        actions: actionDefs,
        persist,
    } = options

    // ---- 1. 解析持久化配置 ----
    const persistKeys = resolvePersistKeys(initialState, persist)

    // ---- 2. 构建初始状态（合并持久化数据） ----
    const restoredState = loadPersistedState<S>(id, persistKeys)
    const mergedInitial: S = { ...initialState, ...restoredState }

    // 保留一份干净的初始值副本（用于 reset）
    const frozenInitial = { ...initialState }

    // ---- 3. 创建 nanostores map ----
    const $atom = map<S>(mergedInitial)

    // ---- 4. 创建计算属性 atoms ----
    const computedAtoms: Record<string, ReadableAtom<unknown>> = {}
    if (computedDefs) {
        for (const key of Object.keys(computedDefs)) {
            computedAtoms[key] = nanoComputed(
                $atom,
                (state) => computedDefs[key](state),
            )
        }
    }

    // ---- 5. 构建 Action 上下文 ----
    // 持久化同步直接内置于 set / patch 中，确保任何状态变更都被自动持久化
    const ctx: StoreContext<S> = {
        get: () => $atom.get(),

        set: <K extends keyof S>(key: K, value: S[K]) => {
            // nanostores 内部使用 AllKeys<S> 类型，与标准 keyof S 不兼容，需断言
            ;($atom as any).setKey(key, value)
            if (persistKeys.includes(key)) {
                savePersistedField(id, key as string, value)
            }
        },

        patch: (partial: Partial<S>) => {
            for (const key of Object.keys(partial) as (keyof S)[]) {
                ;($atom as any).setKey(key, partial[key])
                if (persistKeys.includes(key)) {
                    savePersistedField(id, key as string, partial[key])
                }
            }
        },

        reset: () => {
            $atom.set({ ...frozenInitial })
            if (persistKeys.length > 0) {
                clearPersistedState(id, persistKeys)
            }
        },
    }

    // ---- 6. 绑定 Actions（剥离 ctx 参数） ----
    const boundActions: Record<string, (...args: any[]) => any> = {}
    if (actionDefs) {
        for (const key of Object.keys(actionDefs)) {
            boundActions[key] = (...args: any[]) => actionDefs[key](ctx, ...args)
        }
    }

    // ---- 7. 组装 Store 实例 ----
    const store = {
        $id: id,
        $atom,
        $computed: computedAtoms,

        get $state(): Readonly<S> {
            return $atom.get()
        },

        $set: <K extends keyof S>(key: K, value: S[K]) => ctx.set(key, value),
        $reset: () => ctx.reset(),
        $patch: (partial: Partial<S>) => ctx.patch(partial),
        $subscribe: (
            listener: (
                state: Readonly<S>,
                oldState: Readonly<S> | undefined,
            ) => void,
        ) => $atom.subscribe(listener),

        ...boundActions,
    } as StoreInstance<S, C, A>

    // 将计算属性挂载为 getter（直接在 store 上访问）
    for (const key of Object.keys(computedAtoms)) {
        Object.defineProperty(store, key, {
            get: () => computedAtoms[key].get(),
            enumerable: true,
            configurable: false,
        })
    }

    return store
}
