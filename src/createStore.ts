import $$observable from './utils/symbol-observable'
import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'
import { kindOf } from './utils/kindOf'

import type {
  Store,
  PreloadedState,
  StoreEnhancer,
  Dispatch,
  Observer,
  ExtendState
} from './types/store'
import { Action } from './types/actions'
import { Reducer } from './types/reducers'

/**
 * ステートツリーを保持するReduxストアを作成します。
 * ストア内のデータを変更する唯一の方法は、ストア上で `dispatch()` を呼び出すことです。
 *
 * アプリ内には1つのストアしか存在してはいけません。
 * ステートツリーの異なる部分がどのように反応するかを指定するには
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
// ---------------------------------------------------------- 引数2,3個のパターンに分けて関数のオーバーロードをしている ----------------------------------------------------------------
export default function createStore<
  S, // S is state
  A extends Action, // A is Action
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  enhancer?: StoreEnhancer<Ext, StateExt> // 引数2個
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
export default function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S>,
  enhancer?: StoreEnhancer<Ext, StateExt> // 引数3個
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
  // 引数のバリデーション
  if (
    (typeof preloadedState === 'function' && typeof enhancer === 'function') ||
    (typeof enhancer === 'function' && typeof arguments[3] === 'function')
  ) {
    throw new Error(
      'createStore()に複数のstore enhancerを渡しているようです。これはサポートされていません。代わりに、それらを1つの関数にまとめてください。' +
        'See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.'
    )
  }

  // 引数が2つで, 2つ目がfunctionだったらenhancerとして扱う
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState as StoreEnhancer<Ext, StateExt>
    preloadedState = undefined
  }

  // 引数のバリデーション
  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error(
        `enhancerが関数であることを期待していましたが、こちらを受け取りました: '${kindOf(
          enhancer
        )}'`
      )
    }

    // TODO
    // enhancerは高階関数
    // createStore自身を渡すことでその先で拡張をさせてるっぽい
    // enhancer(createStore)の返り値もcreateStoreと同じで,
    // reducerとpreloadedStateを引数に受け取る
    return enhancer(createStore)(
      reducer,
      preloadedState as PreloadedState<S>
    ) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  }

  // ---------------------------------------------------------- enhancerがあった時はここまで ----------------------------------------------------------------

  // 引数のバリデーション
  if (typeof reducer !== 'function') {
    throw new Error(
      `reducerが関数であることを期待していましたが、こちらを受け取りました: '${kindOf(
        reducer
      )}'`
    )
  }

  // TODO
  // reducer, preloadedStateを上書き可能な変数に代入している
  // listenerの初期値として空の配列を用意して、その後はまだよう分からん
  // listener周りはあとでコードで登場するはず
  // listenerは「ディスパッチごとに呼び出されるコールバックです」だそう
  let currentReducer = reducer
  let currentState = preloadedState as S
  let currentListeners: (() => void)[] | null = [] // 関数を値に持つ配列
  let nextListeners = currentListeners // 「dispatch中の一時的なリスト」らしい↓
  let isDispatching = false

  /**
   * currentListenersのshallow copyを作成し、dispatch中の一時的なリストとしてnextListenersを使用できるようにします。
   * nextListenersをdispatch中の一時的なリストとして使用できるようにします。
   *
   * dispatch中にコンシューマーが subscribe/unubscribe を呼び出すようなバグを防ぎます。
   * dispatchの最中にコンシューマが subscribe/unubscribe を呼び出すバグを防ぎます。
   */

  // nextListenersとcurrentListenersの参照を切り離してる？
  // nextListeners === currentListenersは
  // let nextListeners = currentListenersの時点ではtrueになり
  // この関数の実行後はfalseになる
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
  // dispatch中でなければcurrentStateを返す
  // redux-thunkでよく登場する馴染みがあるやつ
  function getState(): S {
    if (isDispatching) {
      throw new Error(
        'reducerの実行中にstore.getState()を呼び出すことはできません。' +
          'reducerは、すでに引数としてstateを受け取っています。' +
          'storeから読み取る代わりにtopのreducerから渡してください' // ここ訳が変かも
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
    // 引数のバリデーション
    if (typeof listener !== 'function') {
      throw new Error(
        `Expected the listener to be a function. Instead, received: '${kindOf(
          listener
        )}'`
      )
    }

    // dispatchされてから呼び出すためにはコールバックでstore.getState()してくれ、とのこと
    // getState()を使うときは最新のstateが欲しいからdispatch中は呼び出せないようにしたい、ってことかな
    if (isDispatching) {
      throw new Error(
        'reducerの実行中にstore.subscribe()を呼び出すことはできません。' +
          'storeが更新された後に通知を受けたい場合は、コンポーネントからサブスクライブして、' +
          'コールバックでstore.getState() を呼び出して最新の状態にアクセスします。' +
          'See https://redux.js.org/api/store#subscribelistener for more details.'
      )
    }

    let isSubscribed = true

    ensureCanMutateNextListeners() // nextListeners = currentListeners.slice()が実行される
    nextListeners.push(listener) // ↑で更新されたnextListenersにこの関数(subscribe)の引数をpushする

    return function unsubscribe() {
      // isSubscribedがfalseの時に呼び出されても何もしない
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

      ensureCanMutateNextListeners() // nextListeners = currentListeners.slice()が実行される
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1) // nextListenersの配列からlistenerだけが削除される
      currentListeners = null // 初期化される 型にnullが含まれてたのはこのためか 空の配列だとダメだったのかな
    }
  }

  /**
   * アクションをディスパッチします。状態変化を引き起こす唯一の方法です。
   *
   * ストアの作成に使用される `reducer` 関数は、現在のステートツリーと与えられた `action` を使って呼び出されます。
   * その戻り値はツリーの **次** の状態とみなされ、変更リスナーに通知されます。
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
    // 引数のバリデーション
    if (!isPlainObject(action)) {
      throw new Error(
        `ActionはプレーンObjectでなければいけませんが、渡されたのは次の型でした: '${kindOf(
          action
        )}'. プレーンObject以外を渡すためにはミドルウェアを使ってください`
      )
    }

    // actionにtype(とそのvalue)は必須
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.'
      )
    }

    if (isDispatching) {
      throw new Error('reducerはactionをdispatchできません.')
    }

    // 実行中と完了時にisDispatchingの値を変更する
    try {
      isDispatching = true
      currentState = currentReducer(currentState, action) // reducerを実行してstateを書き換える
    } finally {
      isDispatching = false
    }

    // TODO
    // currentListeners = nextListeners ....？？？
    // あ、ensureCanMutateNextListeners()で切り離した参照を復活させてるのか
    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      // 全部のlistenerを実行する
      const listener = listeners[i]
      listener()
    }

    return action // voidかと思ってたけどactionを返すのか〜
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
  dispatch({ type: ActionTypes.INIT } as A) // INITをdispatch

  // storeに全部まとめて、それをreturnする
  const store = {
    dispatch: dispatch as Dispatch<A>,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  } as unknown as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  return store
}
