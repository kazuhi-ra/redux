import { Action, AnyAction } from './actions'

/* reducers */

/**
 *reducer*（*reducing function*とも呼ばれる）は、集積と値を受け取り、新しい集積を返す関数です。
 * 累乗と値を受け取り、新しい累乗を返す関数です。これらは
 * 値の集まりを単一の値にまで減らすために
 *
 * レデューサーはReduxに限ったことではなく、関数型プログラミングの基本的な概念です。
 * 関数型プログラミングの基本的な概念です。 関数型プログラミングの基本的な概念であり、JavaScriptのような非関数型言語でも
 * JavaScriptのような非機能的な言語であっても、還元のためのAPIが組み込まれています。JavaScriptでは、次のようになります。
 * `Array.prototype.reduce()`です。
 *
 * Reduxでは、蓄積された値はstateオブジェクト、蓄積される値はアクションです。
 * 蓄積される値はアクションです。レデューサーは、前の状態とアクションが与えられると、新しい状態を計算します。
 * 状態とアクションが与えられると、新しい状態を計算します。レデューサーは *純粋な関数* - 与えられた入力に対して全く同じ出力を返す関数 - でなければなりません。
 * 与えられた入力に対して全く同じ出力を返す関数です。また、副作用があってはなりません。
 * 副作用があってはなりません。これにより、ホットリロードやタイムトラベルなどのエキサイティングな機能を実現しています。
 * タイムトラベル。
 *
 * Reducer は Redux で最も重要な概念です。
 *
 * * APIコールをReducerに入れてはいけません。
 *
 * @template S このレデューサーが消費・生成するステートの種類。
 * @template A レデューサが潜在的に応答できるアクションの種類。
 */

export type Reducer<S = any, A extends Action = AnyAction> = (
  state: S | undefined,
  action: A
) => S

/**
 * 異なったリデューサ機能に対応する値を持つオブジェクト。
 *
 * @template A レデューサが潜在的に応答できるアクションの種類。
 */
export type ReducersMapObject<S = any, A extends Action = AnyAction> = {
  [K in keyof S]: Reducer<S[K], A>
}

/**
 * `ReducersMapObject` から結合状態の形状を推測します。
 *
 * @template M `combineReducers(map: M)` に提供されるリデューサのオブジェクトマップです。
 */
export type StateFromReducersMapObject<M> = M extends ReducersMapObject
  ? { [P in keyof M]: M[P] extends Reducer<infer S, any> ? S : never }
  : never

/**
 * `ReducersMapObject` からリデューサのユニオンタイプを推測します。
 *
 * @template M `combineReducers(map: M)` に提供されるリデューサのオブジェクトマップです。
 */
export type ReducerFromReducersMapObject<M> = M extends {
  [P in keyof M]: infer R
}
  ? R extends Reducer<any, any>
    ? R
    : never
  : never

/**
 * reducer関数からアクションタイプを推測します。
 *
 * @template R リデューサのタイプ。
 */
export type ActionFromReducer<R> = R extends Reducer<any, infer A> ? A : never

/**
 * `ReducersMapObject` からアクションユニオンタイプを推測します。
 *
 * @template M `combineReducers(map: M)` に提供されるリデューサのオブジェクトマップです。
 */
export type ActionFromReducersMapObject<M> = M extends ReducersMapObject
  ? ActionFromReducer<ReducerFromReducersMapObject<M>>
  : never
