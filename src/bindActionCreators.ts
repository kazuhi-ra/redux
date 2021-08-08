import { Dispatch } from './types/store'
import {
  AnyAction,
  ActionCreator,
  ActionCreatorsMapObject
} from './types/actions'
import { kindOf } from './utils/kindOf'

function bindActionCreator<A extends AnyAction = AnyAction>(
  actionCreator: ActionCreator<A>,
  dispatch: Dispatch
) {
  return function (this: any, ...args: any[]) {
    return dispatch(actionCreator.apply(this, args))
  }
}

/**
 * アクションクリエーターを値に持つオブジェクトを、同じキーを持つオブジェクトに変換します。
 * 同じキーを持つオブジェクトに変換しますが、すべての関数は `dispatch` コールにラップされているので
 * 直接呼び出すことができます。これは単なる便宜的なメソッドで、次のように呼び出すことができます。
 * `store.dispatch(MyActionCreators.doSomething())` を自分で呼び出すこともできます。
 *
 * 便宜上、第一引数にアクションクリエイターを渡すこともできます。
 * 便宜上、アクションクリエイターを第一引数として渡し、ディスパッチをラップした関数を返すこともできます。
 *
 * @param actionCreators アクションクリエイター関数の値を持つオブジェクトです。
 * クリエイター関数です。これを取得する便利な方法のひとつが、ES6の `import * as`
 * 構文で取得できます。1つの関数を渡すこともできます。
 *
 * @param dispatch Reduxで利用可能な`dispatch`関数です。
 * store.
 *
 * @returns 元のオブジェクトを模倣したオブジェクトです。
 * すべてのアクションは `dispatch` にラップされています。関数を `actionCreators` として渡した場合
 * 関数を `actionCreators` として渡した場合は、戻り値も単一の
 * 関数になります。
 */
export default function bindActionCreators<A, C extends ActionCreator<A>>(
  actionCreator: C,
  dispatch: Dispatch
): C

export default function bindActionCreators<
  A extends ActionCreator<any>,
  B extends ActionCreator<any>
>(actionCreator: A, dispatch: Dispatch): B

export default function bindActionCreators<
  A,
  M extends ActionCreatorsMapObject<A>
>(actionCreators: M, dispatch: Dispatch): M
export default function bindActionCreators<
  M extends ActionCreatorsMapObject,
  N extends ActionCreatorsMapObject
>(actionCreators: M, dispatch: Dispatch): N

export default function bindActionCreators(
  actionCreators: ActionCreator<any> | ActionCreatorsMapObject,
  dispatch: Dispatch
) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, but instead received: '${kindOf(
        actionCreators
      )}'. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }

  const boundActionCreators: ActionCreatorsMapObject = {}
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}
