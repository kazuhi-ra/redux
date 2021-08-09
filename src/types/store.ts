import { Action, AnyAction } from './actions'
import { Reducer } from './reducers'
import '../utils/symbol-observable'

/**
 * 状態を拡張する
 *
 * ストア・エンハンサーやストア・クリエーターが状態を拡張するために使用します。
 * 状態の拡張がない場合は、そのままの状態を返しますが、そうでない場合は
 * 拡張された状態を返します。
 *
 * 将来の開発者のための参考資料です。
 * https://github.com/microsoft/TypeScript/issues/31751#issuecomment-498526919
 */
export type ExtendState<State, Extension> = [Extension] extends [never]
  ? State
  : State & Extension

/**
 * CombinedState`型を一意にするために使用される内部の「仮想」シンボルです。
 */
declare const $CombinedState: unique symbol

/**
 * `combineReducers()`で作成されたリデューサのベースとなる型です。
 *
 * このタイプは、`createStore()`メソッドが、プリロードされた状態のどのレベルがパーシャルであるかを推論することを可能にします。
 * プリロードされた状態のどのレベルを部分的に使用できるかを推測することができます。
 *
 * Typescript は実際には duck-typed なので、型は何らかの識別特性を持つ必要があります。
 * 型チェックのために、プロトタイプが一致する他の型と区別するための識別特性が必要です。
 * 型チェックのために、プロトタイプが一致する他の型と区別するために、何らかの識別特性を持つ必要があります。これが、この型が
 * `$CombinedState` シンボルプロパティを持っています。このプロパティがなければ、この型は
 * 任意のオブジェクトにマッチします。シンボルは内部的なものなので、実際には存在しません。
 * シンボルは実際には存在せず、内部的にはその値をチェックすることはありません。これは
 * シンボルのプロパティなので、数えられないことは想定されておらず、その値は
 * 値は常に未定義と型付けされているので、意味のある値を持つことは期待できません。
 * 値を持つことはありません。これは、この型を単なる `{}` と区別するためのものです。
 */
export type CombinedState<S> = { readonly [$CombinedState]?: undefined } & S

/**
 * 結合状態のオブジェクトを再帰的にパーシャル化します。結合状態の _root
 * オブジェクト（個々のレデューサにマッピングされたキーを持つ、生成された上位オブジェクト）のみがパーシャルになります。
 * パーシャル化されます。
 */
export type PreloadedState<S> = Required<S> extends {
  [$CombinedState]: undefined
}
  ? S extends CombinedState<infer S1>
    ? {
        [K in keyof S1]?: S1[K] extends object ? PreloadedState<S1[K]> : S1[K]
      }
    : never
  : {
      [K in keyof S]: S[K] extends string | number | boolean | symbol
        ? S[K]
        : PreloadedState<S[K]>
    }

/**
 *ディスパッチ関数*（または単に*ディスパッチ関数*）とは、次のような関数です。
 * アクションまたは非同期アクションを受け取り、1つまたは複数のアクションを
 * 1つまたは複数のアクションをストアにディスパッチします。
 *
 * 一般的なディスパッチ関数と基本的な `dispatch` 関数を区別する必要があります。
 * * 一般的なディスパッチ関数と、ミドルウェアなしでストアインスタンスが提供する基本的な `dispatch` 関数を区別する必要があります。
 *
 * ベースとなるディスパッチ関数は、常に* 同期的にアクションをストアのレデューサに送信します。
 * ベースとなるディスパッチ関数は、常に*同期的にアクションをストアのリデューサに送り、ストアから返された前の状態とともに
 * 新しい状態を計算します。アクションはプレインオブジェクトであることを想定しています。
 * アクションはプレインオブジェクトであると想定しています。
 *
 * ミドルウェアは、ベースとなるディスパッチ機能をラップします。ミドルウェアはベースとなるディスパッチ関数をラップします。
 * アクションだけでなく、非同期アクションも扱えるようになります。ミドルウェアは
 * ミドルウェアは、アクションや非同期アクションを次のミドルウェアに渡す前に、変換、遅延、無視などの解釈を行います。
 ミドルウェアは、アクションや非同期アクションを、次のミドルウェアに渡す前に、 * 変換、遅延、無視などの解釈を行います。
 *
 * @template A ディスパッチされる可能性のあるもの（アクションなど）の種類。
 * ディスパッチされる可能性のあるものの種類。
 */
export interface Dispatch<A extends Action = AnyAction> {
  <T extends A>(action: T, ...extraArgs: any[]): T
}

/**
 * Store.subscribe()で追加されたリスナーを削除する関数です。
 */
export interface Unsubscribe {
  (): void
}

/**
 * 状態変化の最小のオブザーバブルです。
 * 詳細は observable proposal を参照してください。
 * https://github.com/tc39/proposal-observable
 */
export type Observable<T> = {
  /**
   * 最小限のobservable購読方法です。
   * @param {Object} observer オブザーバーとして使用できる任意のオブジェクト。
   * @param {Object} observer オブザーバとして使用できるオブジェクト * observer オブジェクトは `next` メソッドを持っている必要があります。
   * @returns {subscription} オブザーバの登録解除に使用できる `unsubscribe` メソッドを持つオブジェクトです。
   * このメソッドは、オブザーバをストアから退会させ、オブザーバからの値の放出を防ぐために使用できます。
   * observableからの値の放出を防ぐことができます。
   */
  subscribe: (observer: Observer<T>) => { unsubscribe: Unsubscribe }
  [Symbol.observable](): Observable<T>
}

/**
 * Observerは、Observableからのデータを受信するためのもので、Subscribeの引数として与えられます。
 * subscribe の引数として与えられます。
 */
export type Observer<T> = {
  next?(value: T): void
}

/**
 * ストアとは、アプリケーションのステートツリーを保持するオブジェクトのことです。
 * Reduxアプリには単一のストアしか存在してはいけません、なぜなら合成はReducerレベルで行われるからです。
 * 合成はReducerレベルで行われます。
 *
 * @template S このストアが保持する状態の種類。
 * @template A このストアでディスパッチされる可能性のあるアクションの種類。
 * @template StateExt ストアエンハンサーからの状態への任意の拡張。
 * @template Ext ストアエンハンサーからのストアへの任意の拡張機能
 */
export interface Store<
  S = any,
  A extends Action = AnyAction,
  StateExt = never,
  Ext = {}
> {
  /**
   * アクションをディスパッチします。状態変化を引き起こす唯一の方法です。
   *
   * ストアの作成に使用される `reducer` 関数は、現在のステートツリーと与えられた `action` を使って呼び出されます。
   * 現在のステートツリーと、与えられた `アクション` で呼び出されます。その戻り値は
   * ツリーの **次** の状態とみなされ、変更リスナーに通知されます。
   * 通知されます。
   *
   * 基本的な実装では、プレーンなオブジェクトアクションのみをサポートしています。もし、あなたが
   * PromiseやObservable、Thunkなどをディスパッチしたい場合は、ストア作成関数を
   * ストアを作成する関数を、対応するミドルウェアにラップする必要があります。
   * ミドルウェアに組み込む必要があります。例えば、`redux-thunk` パッケージのドキュメントを参照してください。
   * パッケージのドキュメントを参照してください。ミドルウェアでも、最終的にはこのメソッドを使って、プレーンなオブジェクト
   * ミドルウェアでも最終的にはこのメソッドを使って、プレーンなオブジェクト * アクションをディスパッチします。
   *
   * @param action 「何が変わったか」を表すプレーンなオブジェクトです。アクションはシリアライズ可能にしておくといいでしょう。
   * アクションをシリアライズできるようにしておけば、ユーザのセッションを記録したり、再生したりすることができます。
   * アクションをシリアル化しておくと、ユーザーのセッションを記録・再生したり、タイムトラベルの `redux-devtools` を使ったりすることができます。アクションは
   * type` プロパティは `undefined` にしてはいけません。アクションには文字列定数を使用するのが良いでしょう。
   * 文字列定数をアクションタイプに使用するのは良いアイデアです。
   *
   * @returns 便宜上、ディスパッチしたのと同じアクションオブジェクトを返します。
   *
   * カスタムミドルウェアを使用している場合、カスタムミドルウェアは `dispatch()` をラップして別のものを返すかもしれないことに注意してください。
   * dispatch()をラップして別のものを返すことがあります（例えば、waitできるPromiseなど）。
   */
  dispatch: Dispatch<A>

  /**
   * ストアで管理されているステートツリーを読み込みます。
   *
   * @returns アプリケーションの現在のステート・ツリーです。
   */
  getState(): S

  /**
   * チェンジリスナーを追加します。アクションがディスパッチされ、ステートツリーの一部が変更された可能性がある場合、このリスナーが呼び出されます。
   * アクションがディスパッチされ、ステートツリーの一部が変更された可能性があるときに呼び出されます。
   * コールバックの中で現在のステートツリーを読み取るために、`getState()`を呼び出すことができます。
   * コールバック
   *
   * 変更リスナーから `dispatch()` を呼び出すことができます。
   * 注意点は以下の通りです。
   *
   * dispatch()の呼び出しの直前に、サブスクリプションはスナップショットされます。
   * リスナーが呼び出されている間に、サブスクライブやアンサブスクライブを行っても、 * 変更点には影響しません。
   * 現在進行中の `dispatch()` には何の影響も与えません。
   * 進行中の `dispatch()` には影響しません。しかし、次の `dispatch()` の呼び出しは、入れ子になっていようがいまいが、 * より新しいスナップショットを使用します。
   * 次の `dispatch()` の呼び出しは、入れ子になっているかどうかにかかわらず、 * 購読リストのより新しいスナップショットを使用します。
   *
   * 2. 2. リスナーは、すべての状態の変化を期待してはいけません。
   * 2. リスナーは、すべての状態の変化を期待してはいけません。
   リスナーが呼ばれる前に、入れ子になった `dispatch()` の間に * 状態が複数回更新されているかもしれないからです。しかし、リスナーが呼ばれる前に、入れ子になった `dispatch()` の間に * 状態が何度も更新されているかもしれないので、すべての状態の変更を見ることは期待しないでください。
   * ただし、`dispatch()`が開始される前に登録されたすべてのサブスクライバは、`dispatch()`が終了するまでに最新の
   * 状態で呼び出されることが保証されています。
   *
   * @param listener ディスパッチごとに呼び出されるコールバックです。
   * @returns この変更リスナーを削除する関数です。
   */
  subscribe(listener: () => void): Unsubscribe

  /**
   * ストアが状態を計算するために現在使用しているリデューサを置き換えます。
   *
   * アプリがコード分割を実装していて、一部のリデューサを動的にロードしたい場合に必要になるかもしれません。
   * レデューサの一部を動的にロードしたい場合に必要になります。また、以下のような場合にも必要となるでしょう。
   * Reduxのホットリロード機構を実装する。
   *
   * @param nextReducer 代わりに使用するストアのレデューサです。
   */
  replaceReducer<NewState, NewActions extends Action>(
    nextReducer: Reducer<NewState, NewActions>
  ): Store<ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext

  /**
   * observable/reactiveライブラリの相互運用ポイントです。
   * @returns {observable} 状態変化の最小のオブザーバブルです。
   * 詳細は observable proposal を参照してください。
   * https://github.com/tc39/proposal-observable
   */
  [Symbol.observable](): Observable<S>
}

/**
 * ストアクリエーターとは、Reduxのストアを作成する関数です。と同様に
 * ディスパッチ関数と同様に、ベースとなるストアクリエイターを区別する必要があります。
 Reduxパッケージからエクスポートされた * `createStore(reducer, preloadedState)` と、ストアエンハンサーから返される * ストアクリエイターを区別する必要があります。
 * ストアエンハンサーから返されるストアクリエータと区別する必要があります。
 *
 * @template S ストアが保持する状態の種類。
 * @template A ディスパッチされる可能性のあるアクションの種類。
 * @template Ext ストアタイプに混入されるストア拡張。
 * @template StateExt ステートタイプに混入されるステート拡張。
 */
export interface StoreCreator {
  <S, A extends Action, Ext = {}, StateExt = never>(
    reducer: Reducer<S, A>,
    enhancer?: StoreEnhancer<Ext, StateExt>
  ): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  <S, A extends Action, Ext = {}, StateExt = never>(
    reducer: Reducer<S, A>,
    preloadedState?: PreloadedState<S>,
    enhancer?: StoreEnhancer<Ext>
  ): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
}

/**
 * ストアエンハンサーは、ストアクリエーターを合成する高次の関数です。
 * を合成して、新たに強化されたストアクリエイターを返す高次関数です。これは、ミドルウェアに似ています。
 * ストアのインターフェースを合成可能な方法で変更することができます。
 *
 * ストア・エンハンサーは、Reactの高次コンポーネントと同じ概念です。
 * ストアエンハンサーは、Reactの高次コンポーネントと同じ概念で、「コンポーネントエンハンサー」と呼ばれることもあります。
 *
 * ストアはインスタンスではなく、関数のプレーンオブジェクトの集まりです。
 * 関数の集まりなので、オリジナルのストアを変更することなく、簡単にコピーを作成・変更することができます。
 * オリジナルのストアを変更することなく、簡単にコピーを作成、変更することができます。このことを示す例が、`compose`ドキュメントにあります。
 * それを実演しています。
 *
 * ほとんどの場合、ストアエンハンサーを書くことはありませんが、開発者ツールが提供するストアエンハンサーを使うことができます。
 * 開発ツールで提供されているものを使うことができます。これはタイムトラベルを可能にするものです。
 * アプリがそれを意識することなく、タイムトラベルを可能にします。面白いことに、Reduxの
 * ミドルウェアの実装自体がストアエンハンサーです。
 *
 * @template Ext Store Store extension that is mixed into the Store type.
 * @template StateExt ステートタイプに混入されるステート拡張。
 */
export type StoreEnhancer<Ext = {}, StateExt = never> = (
  next: StoreEnhancerStoreCreator<Ext, StateExt>
) => StoreEnhancerStoreCreator<Ext, StateExt>

export type StoreEnhancerStoreCreator<Ext = {}, StateExt = never> = <
  S = any,
  A extends Action = AnyAction
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S>
) => Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
