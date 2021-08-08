import $$observable from './utils/symbol-observable'

import {
  Store,
  PreloadedState,
  StoreEnhancer,
  Dispatch,
  Observer,
  ExtendState
} from './types/store'
import { Action } from './types/actions'
import { Reducer } from './types/reducers'
import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'
import { kindOf } from './utils/kindOf'

/**
 * ステートツリーを保持するReduxストアを作成します。
 * ストア内のデータを変更する唯一の方法は、ストア上で `dispatch()` を呼び出すことです。
 *
 * アプリ内には1つのストアしか存在してはいけません。ステートツリーの異なる部分がどのように反応するかを指定するには
 * ステートツリーの異なる部分がアクションに反応する方法を指定するために、複数のリデューサを1つのリデューサ関数にまとめることができます。
 * 複数のリデューサを1つのリデューサ関数にまとめるには、`combineReducers`を使います。
 *
 * @param reducer 現在のステートツリーとアクションが与えられたときに、次のステートツリーを返す関数です。
 * 現在のステートツリーと、処理するアクションが与えられると、次のステートツリーを返す関数です。
 *
 * @param preloadedState 初期状態です。オプションで指定することができます。
 * ユニバーサルアプリでサーバからの状態をハイドレートする場合や、 * 以前にシリアライズされたユーザーセッションを復元する場合に、 * オプションで指定することができます。
 * オプションで指定できます。
 * `combineReducers` を使ってルートレデューサ関数を生成する場合、これは以下のものでなければなりません。
 * `combineReducers` のキーと同じ形状のオブジェクトであること。
 *
 * @param enhancer ストアのエンハンサーです。オプションで指定することができます。
 ミドルウェアなどのサードパーティの機能でストアを強化するために * オプションで指定することができます。
 * タイムトラベル、パーシステンスなどのサードパーティ製の機能で * ストアを強化するためにオプションで指定できます。Reduxに同梱されている唯一のストアエンハンサーは
 * は `applyMiddleware()` です。
 *
 * @returns 状態の読み取り、アクションのディスパッチ、変更の購読を可能にする Redux ストア。
 * 変更を購読することができます。
 */
export default function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
export default function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
export default function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S> | StoreEnhancer<Ext, StateExt>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext {
  if (
    (typeof preloadedState === 'function' && typeof enhancer === 'function') ||
    (typeof enhancer === 'function' && typeof arguments[3] === 'function')
  ) {
    throw new Error(
      'It looks like you are passing several store enhancers to ' +
        'createStore(). This is not supported. Instead, compose them ' +
        'together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.'
    )
  }

  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState as StoreEnhancer<Ext, StateExt>
    preloadedState = undefined
  }

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error(
        `Expected the enhancer to be a function. Instead, received: '${kindOf(
          enhancer
        )}'`
      )
    }

    return enhancer(createStore)(
      reducer,
      preloadedState as PreloadedState<S>
    ) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  }

  if (typeof reducer !== 'function') {
    throw new Error(
      `Expected the root reducer to be a function. Instead, received: '${kindOf(
        reducer
      )}'`
    )
  }

  let currentReducer = reducer
  let currentState = preloadedState as S
  let currentListeners: (() => void)[] | null = []
  let nextListeners = currentListeners
  let isDispatching = false

  /**
   * currentListenersの浅いコピーを作成し、ディスパッチ中の一時的なリストとしてnextListenersを使用できるようにします。
   * nextListenersをディスパッチ中の一時的なリストとして使用できるようにします。
   *
   * ディスパッチ中にコンシューマーが subscribe/unubscribe を呼び出すようなバグを防ぎます。
   * ディスパッチの最中にコンシューマが subscribe/unubscribe を呼び出すバグを防ぎます。
   */
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }

  /**
   * ストアで管理されているステートツリーを読み込みます。
   *
   * @returns アプリケーションの現在のステート・ツリーです。
   */
  function getState(): S {
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }

    return currentState as S
  }

  /**
   * 変更リスナーを追加します。このリスナーは、アクションがディスパッチされるたびに呼び出されます。
   * アクションがディスパッチされ、ステートツリーの一部が変更された可能性があるときに呼び出されます。これにより、以下のことが可能になります。
   * コールバック内で現在のステートツリーを読み取るために、`getState()`を呼び出します。
   *
   * 変更リスナーから `dispatch()` を呼び出すことができます。
   * 注意点は以下の通りです。
   *
   * dispatch()を呼び出すたびに、サブスクリプションは直前にスナップショットされます。
   * リスナーが呼び出されている間にサブスクライブやアンサブスクライブを行っても、それは変更リスナーには影響しません。
   * 現在進行中の `dispatch()` には何の影響も与えません。
   * ただし、次の `dispatch()` の呼び出しは、入れ子になっているかどうかに関わらず、 * より新しい購読リストのスナップショットを使用します。
   * 最近の購読リストのスナップショットを使用します。
   *
   * 2. * 2. リスナーは、すべての状態の変化を期待してはいけません。
   * 2. リスナーは、すべての状態の変化を期待してはいけません。
   * リスナーが呼ばれる前に、入れ子になった `dispatch()` の間に複数回ステートが更新されている可能性があるからです。しかし、リスナーが呼ばれる前に、ネストされた `dispatch()` の間に * 状態が複数回更新されている可能性があるからです。
   * ただし、`dispatch()`が開始される前に登録されたすべてのサブスクライバは、`dispatch()`が終了するまでに最新の
   * 状態で呼び出されることが保証されています。
   *
   * @param listener ディスパッチごとに呼び出されるコールバックです。
   * @returns この変更リスナーを削除する関数です。
   */
  function subscribe(listener: () => void) {
    if (typeof listener !== 'function') {
      throw new Error(
        `Expected the listener to be a function. Instead, received: '${kindOf(
          listener
        )}'`
      )
    }

    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api/store#subscribelistener for more details.'
      )
    }

    let isSubscribed = true

    ensureCanMutateNextListeners()
    nextListeners.push(listener)

    return function unsubscribe() {
      if (!isSubscribed) {
        return
      }

      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api/store#subscribelistener for more details.'
        )
      }

      isSubscribed = false

      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
      currentListeners = null
    }
  }

  /**
   * アクションをディスパッチします。状態変化を引き起こす唯一の方法です。
   *
   * ストアの作成に使用される `reducer` 関数は、現在のステートツリーと与えられた `action` を使って呼び出されます。
   * 現在のステートツリーと、与えられた `アクション` で呼び出されます。その戻り値は
   * ツリーの **次** の状態とみなされ、変更リスナーに通知されます。
   * 通知されます。
   *
   * 基本的な実装では、プレーンなオブジェクトアクションのみをサポートしています。もし、次のようなことをしたい場合
   * Promise、Observable、Thunkなどをディスパッチしたい場合は、ストア作成関数を対応するミドルウェアにラップする必要があります。
   * ストアを作成する関数を、対応するミドルウェアにラップする必要があります。例えば
   * 例えば、`redux-thunk`パッケージのドキュメントを参照してください。ミドルウェアでも
   * ミドルウェアでも、最終的にはプレーンなオブジェクトのアクションをこの方法でディスパッチします。
   *
   * @param action 「何が変わったか」を表すプレーンオブジェクトです。これは
   * アクションをシリアライズ可能にしておくと、ユーザのセッションを記録・再生することができます。
   * ユーザーのセッションを記録したり、再生したり、タイムトラベルの `redux-devtools` を使用したりするために、アクションをシリアライズ可能にしておくと良いでしょう。アクションは以下のプロパティを持つ必要があります。
   * type` プロパティは `undefined` であってはなりません。アクションのタイプには、文字列定数を使用することをお勧めします。
   * 文字列定数を使用することをお勧めします。
   *
   * @returns 便宜上、ディスパッチしたのと同じアクションオブジェクトを返します。
   *
   * カスタムミドルウェアを使用している場合、カスタムミドルウェアは `dispatch()` をラップして別のものを返すかもしれないことに注意してください。
   * dispatch()をラップして別のものを返すことがあります（例えば、waitできるPromiseなど）。
   */
  function dispatch(action: A) {
    if (!isPlainObject(action)) {
      throw new Error(
        `Actions must be plain objects. Instead, the actual type was: '${kindOf(
          action
        )}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`
      )
    }

    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.'
      )
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }

    return action
  }

  /**
   * ストアが状態を計算するために現在使用しているリデューサを置き換えます。
   *
   * アプリがコード分割を実装していて、一部のリデューサを動的にロードしたい場合に必要になるかもしれません。
   * レデューサの一部を動的にロードしたい場合に必要になります。また、以下のような場合にも必要となるでしょう。
   * Reduxのホットリロード機構を実装する。
   *
   * @param nextReducer 代わりに使用するストアのリデューサです。
   * @returns 新しいレデューサーが導入された、同じストアインスタンスです。
   */
  function replaceReducer<NewState, NewActions extends A>(
    nextReducer: Reducer<NewState, NewActions>
  ): Store<ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext {
    if (typeof nextReducer !== 'function') {
      throw new Error(
        `Expected the nextReducer to be a function. Instead, received: '${kindOf(
          nextReducer
        )}`
      )
    }

    // TODO: do this more elegantly
    ;(currentReducer as unknown as Reducer<NewState, NewActions>) = nextReducer

    // このアクションは、ActionTypes.INITと同様の効果があります。
    // 新旧両方のrootReducerに存在していたすべてのレデューサーは
    // は以前の状態を受け取ります。これにより、効果的に新しいステートツリーに
    // 新しいステートツリーに、古いステートから関連するデータを投入します。
    dispatch({ type: ActionTypes.REPLACE } as A)
    // 新しいストアにキャストしてストアのタイプを変更する
    return store as unknown as Store<
      ExtendState<NewState, StateExt>,
      NewActions,
      StateExt,
      Ext
    > &
      Ext
  }

  /**
   * observable/reactiveライブラリの相互運用ポイント。
   * @returns 状態変化の最小オブザーバブル。
   * 詳細は observable proposal を参照してください。
   * https://github.com/tc39/proposal-observable
   */
  function observable() {
    const outerSubscribe = subscribe
    return {
      /**
       * 最小限のobservable購読方法です。
       * @param observer オブザーバーとして使用できる任意のオブジェクト。
       * @param observer オブザーバとして使用できるオブジェクト * observer オブジェクトは `next` メソッドを持つ必要があります。
       * @returns `unsubscribe` メソッドを持つオブジェクトです。
       * このメソッドは、オブザーバブルをストアからアンサブスクライブして、オブザーバブルからの値の放出を防ぐために使用できます。
       * observable からの値の放出を防ぐことができます。
       */
      subscribe(observer: unknown) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError(
            `Expected the observer to be an object. Instead, received: '${kindOf(
              observer
            )}'`
          )
        }

        function observeState() {
          const observerAsObserver = observer as Observer<S>
          if (observerAsObserver.next) {
            observerAsObserver.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }

  // ストアが作成されると、"INIT "アクションがディスパッチされて、すべての
  // レデューサがそれぞれの初期状態を返すようにします。これにより、効果的に初期状態ツリーに
  // 初期状態のツリーを作成します。
  dispatch({ type: ActionTypes.INIT } as A)

  const store = {
    dispatch: dispatch as Dispatch<A>,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  } as unknown as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  return store
}
