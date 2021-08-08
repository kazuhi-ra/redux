import compose from './compose'
import { Middleware, MiddlewareAPI } from './types/middleware'
import { AnyAction } from './types/actions'
import {
  StoreEnhancer,
  Dispatch,
  PreloadedState,
  StoreEnhancerStoreCreator
} from './types/store'
import { Reducer } from './types/reducers'

/**
 * Redux ストアのディスパッチメソッドにミドルウェアを適用するストアエンハンサーを作成します。
 * Reduxストアのディスパッチメソッドにミドルウェアを適用するストアエンハンサーを作成します。これは、次のような様々なタスクに便利です。
 * 非同期アクションを簡潔に表現したり、アクションのペイロードをすべてログに記録するなど、さまざまな作業に便利です。
 *
 * Reduxのミドルウェアの例として、`redux-thunk`パッケージを参照してください。
 *
 * ミドルウェアは潜在的に非同期であるため、これはコンポジションチェーンの最初の
 * コンポジションチェーンにおけるストアエンハンサーです。
 *
 * 各ミドルウェアには、名前付き引数として `dispatch` と `getState` 関数が与えられることに注意してください。
 * 名前付き引数として与えられます。
 *
 * @param middlewares 適用されるミドルウェアチェーンです。
 * @returns ミドルウェアを適用したストアエンハンサーです。
 *
 * @template Ext ミドルウェアが追加するディスパッチ署名。
 * @template S ミドルウェアがサポートする状態のタイプ。
 */
export default function applyMiddleware(): StoreEnhancer
export default function applyMiddleware<Ext1, S>(
  middleware1: Middleware<Ext1, S, any>
): StoreEnhancer<{ dispatch: Ext1 }>
export default function applyMiddleware<Ext1, Ext2, S>(
  middleware1: Middleware<Ext1, S, any>,
  middleware2: Middleware<Ext2, S, any>
): StoreEnhancer<{ dispatch: Ext1 & Ext2 }>
export default function applyMiddleware<Ext1, Ext2, Ext3, S>(
  middleware1: Middleware<Ext1, S, any>,
  middleware2: Middleware<Ext2, S, any>,
  middleware3: Middleware<Ext3, S, any>
): StoreEnhancer<{ dispatch: Ext1 & Ext2 & Ext3 }>
export default function applyMiddleware<Ext1, Ext2, Ext3, Ext4, S>(
  middleware1: Middleware<Ext1, S, any>,
  middleware2: Middleware<Ext2, S, any>,
  middleware3: Middleware<Ext3, S, any>,
  middleware4: Middleware<Ext4, S, any>
): StoreEnhancer<{ dispatch: Ext1 & Ext2 & Ext3 & Ext4 }>
export default function applyMiddleware<Ext1, Ext2, Ext3, Ext4, Ext5, S>(
  middleware1: Middleware<Ext1, S, any>,
  middleware2: Middleware<Ext2, S, any>,
  middleware3: Middleware<Ext3, S, any>,
  middleware4: Middleware<Ext4, S, any>,
  middleware5: Middleware<Ext5, S, any>
): StoreEnhancer<{ dispatch: Ext1 & Ext2 & Ext3 & Ext4 & Ext5 }>
export default function applyMiddleware<Ext, S = any>(
  ...middlewares: Middleware<any, S, any>[]
): StoreEnhancer<{ dispatch: Ext }>
export default function applyMiddleware(
  ...middlewares: Middleware[]
): StoreEnhancer<any> {
  return (createStore: StoreEnhancerStoreCreator) =>
    <S, A extends AnyAction>(
      reducer: Reducer<S, A>,
      preloadedState?: PreloadedState<S>
    ) => {
      const store = createStore(reducer, preloadedState)
      let dispatch: Dispatch = () => {
        throw new Error(
          'Dispatching while constructing your middleware is not allowed. ' +
            'Other middleware would not be applied to this dispatch.'
        )
      }

      const middlewareAPI: MiddlewareAPI = {
        getState: store.getState,
        dispatch: (action, ...args) => dispatch(action, ...args)
      }
      const chain = middlewares.map(middleware => middleware(middlewareAPI))
      dispatch = compose<typeof dispatch>(...chain)(store.dispatch)

      return {
        ...store,
        dispatch
      }
    }
}
