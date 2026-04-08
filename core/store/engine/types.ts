import type { MapStore, ReadableAtom } from 'nanostores'

// ============================================================
// 抽象层：Store 系统的类型契约
// ============================================================
//
// 设计原则：
//   1. 所有 Store 的行为由此文件定义，具体实现（nanostores）不得泄漏到业务层
//   2. 类型推导必须自动完成，用户定义 state 后，computed / actions 的类型自动流入
//   3. 框架无关 —— Vue / React / Angular 均可通过 $atom 接入
//
// 架构图：
//
//   ┌─────────────────────────────────────────────────────┐
//   │  业务层（各端 views）                                │
//   │   import { useVueStore } from 'store/vue'           │
//   │   const store = useVueStore(userStore)               │
//   │   store.name.value / store.isLoggedIn.value          │
//   └──────────────────────┬──────────────────────────────┘
//                          │ 调用
//   ┌──────────────────────▼──────────────────────────────┐
//   │  适配层（adapters/）                                 │
//   │   useVueStore → WritableComputedRef / ComputedRef    │
//   │   useReactStore → useSyncExternalStore + set()       │
//   └──────────────────────┬──────────────────────────────┘
//                          │ 消费 $atom / $computed
//   ┌──────────────────────▼──────────────────────────────┐
//   │  业务定义层（modules/）                              │
//   │   createStore('user', { state, computed, actions })  │
//   └──────────────────────┬──────────────────────────────┘
//                          │ 调用
//   ┌──────────────────────▼──────────────────────────────┐
//   │  抽象层（engine/types.ts）                           │
//   │   StoreOptions / StoreContext / StoreInstance        │
//   └──────────────────────┬──────────────────────────────┘
//                          │ 约束
//   ┌──────────────────────▼──────────────────────────────┐
//   │  实现层（engine/create-store.ts + persistence.ts）   │
//   │   nanostores map / computed → 响应式引擎             │
//   │   StorageEngine → 跨平台持久化                       │
//   └─────────────────────────────────────────────────────┘
//

// ============================================================
// 基础类型
// ============================================================

/** 状态树约束：必须是扁平对象（深层嵌套以整值替换方式更新） */
export type StateTree = Record<string, unknown>

// ============================================================
// Store 操作上下文（传入 actions 的第一个参数）
// ============================================================

/**
 * Action 执行上下文
 *
 * 提供对状态的安全读写能力，所有状态变更必须通过 ctx 完成，
 * 确保响应式追踪和持久化同步不被绕过。
 */
export interface StoreContext<S extends StateTree> {
    /** 获取当前完整状态（只读快照） */
    get(): Readonly<S>
    /** 设置单个字段 —— 触发响应式更新 + 持久化同步 */
    set<K extends keyof S>(key: K, value: S[K]): void
    /** 批量更新多个字段 */
    patch(partial: Partial<S>): void
    /** 重置为初始状态，同时清除持久化数据 */
    reset(): void
}

// ============================================================
// 配置定义类型
// ============================================================

/** 计算属性定义：纯函数，接收只读状态，返回派生值 */
export type ComputedDefs<S extends StateTree> = Record<
    string,
    (state: Readonly<S>) => unknown
>

/** Action 定义：第一个参数固定为 ctx，后续为业务参数 */
export type ActionDefs<S extends StateTree> = Record<
    string,
    (ctx: StoreContext<S>, ...args: any[]) => any
>

/** 持久化配置：true = 全部字段 | 数组 = 指定字段 */
export type PersistConfig<S extends StateTree> = boolean | (keyof S)[]

/**
 * createStore 的配置选项
 *
 * 泛型参数由 TypeScript 自动推导，无需手动指定：
 *   S ← 从 state 对象推导
 *   C ← 从 computed 对象推导（每个函数的返回值自动成为计算属性类型）
 *   A ← 从 actions 对象推导（自动剥离 ctx 参数，生成外部调用签名）
 */
export interface StoreOptions<
    S extends StateTree,
    C extends ComputedDefs<S> = {},
    A extends ActionDefs<S> = {},
> {
    /** 状态初始值 */
    state: S
    /** 计算属性（派生状态），自动追踪依赖 */
    computed?: C & ComputedDefs<S>
    /** 操作方法，通过 ctx 读写状态 */
    actions?: A & ActionDefs<S>
    /** 持久化配置 */
    persist?: PersistConfig<S>
}

// ============================================================
// 类型推导工具
// ============================================================

/** 从 computed 定义中提取各属性的返回值类型 */
export type InferComputed<C> = {
    readonly [K in keyof C]: C[K] extends (...args: any[]) => infer R ? R : never
}

/** 从 actions 定义中提取外部调用签名（剥离首参 ctx） */
export type InferActions<A> = {
    [K in keyof A]: A[K] extends (ctx: any, ...args: infer P) => infer R
        ? (...args: P) => R
        : never
}

// ============================================================
// Store 实例类型（createStore 的返回值）
// ============================================================

/**
 * Store 实例
 *
 * 由三部分组成：
 *   1. 内部工具方法（$ 前缀）—— 状态管理、框架集成
 *   2. 计算属性（只读 getter）—— 自动派生
 *   3. Actions（绑定后的方法）—— 直接调用，无需传 ctx
 */
export type StoreInstance<
    S extends StateTree,
    C extends ComputedDefs<S> = {},
    A extends ActionDefs<S> = {},
> = {
    /** Store 唯一标识 */
    readonly $id: string

    /** 当前状态快照（只读） */
    readonly $state: Readonly<S>

    /**
     * 底层 nanostores MapStore
     *
     * 由 adapters 层内部消费，业务代码不应直接操作 $atom，
     * 请通过 useVueStore / useReactStore 适配器访问状态
     */
    readonly $atom: MapStore<S>

    /**
     * 底层计算属性的 nanostores ReadableAtom 集合
     *
     * 由 adapters 层内部消费，实现细粒度订阅
     * （仅在特定计算属性变化时触发重渲染，而非整个 state 变化）
     */
    readonly $computed: { readonly [K in keyof C]: ReadableAtom<ReturnType<C[K]>> }

    /** 设置单个字段（经过持久化通道，供框架适配器内部使用） */
    $set<K extends keyof S>(key: K, value: S[K]): void

    /** 重置为初始状态 */
    $reset(): void

    /** 批量更新多个字段 */
    $patch(partial: Partial<S>): void

    /** 订阅状态变化（首次调用立即触发当前值） */
    $subscribe(
        listener: (state: Readonly<S>, oldState: Readonly<S> | undefined) => void,
    ): () => void
} & InferComputed<C> & InferActions<A>

// ============================================================
// 持久化抽象
// ============================================================

/**
 * 存储引擎接口
 *
 * 不同平台需提供各自的实现：
 *   - 浏览器：直接传入 window.localStorage
 *   - UniApp：{ getItem: uni.getStorageSync, setItem: uni.setStorageSync, ... }
 *   - React Native：需将 AsyncStorage 包装为同步接口
 *   - SSR / Node.js：内存 Map 或跳过
 */
export interface StorageEngine {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
    removeItem(key: string): void
}
