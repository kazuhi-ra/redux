import { Dispatch } from './store'

export interface MiddlewareAPI<D extends Dispatch = Dispatch, S = any> {
  dispatch: D
  getState(): S
}

/**
 * ミドルウェアは、ディスパッチ関数を合成する高次の関数です。
 * を合成して、新しいディスパッチ関数を返す高次関数です。ミドルウェアはしばしば、非同期アクションを
 * アクションに変換します。
 *
 * ミドルウェアは、関数の合成によって構成されています。これは以下のような場合に便利です。
 * 非同期APIコールを一連の同期アクションに変換することができます。
 * 非同期のAPIコールを一連の同期アクションにするのに便利です。
 *
 * @template DispatchExt 本ミドルウェアが追加するDispatch署名。
 * @template S このミドルウェアがサポートする状態のタイプ。
 * @template D このミドルウェアがインストールされているストアのDispatchの種類。
 * インストールされる。
 */
export interface Middleware<
  _DispatchExt = {}, // TODO: remove unused component (breaking change)
  S = any,
  D extends Dispatch = Dispatch
> {
  (api: MiddlewareAPI<D, S>): (
    next: D
  ) => (action: D extends Dispatch<infer A> ? A : never) => any
}
