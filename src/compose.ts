type Func<T extends any[], R> = (...a: T) => R

/**
 * 1引数の関数を右から左に向かって合成します。一番右の
 * 右端の関数は複数の引数を取ることができ、結果として得られる合成関数のシグネチャを
 * 右端の関数は複数の引数を取ることができ、結果として複合関数の署名を提供します。
 *
 * @param funcs 複合化する関数です。
 * @returns 右から左への引数関数を合成して得られる関数。
 * @return 引数の関数を右から左に合成した関数。例えば、`compose(f, g, h)` は次の操作と同じです。
 * `(...args) => f(g(h(...args)))`.
 */
export default function compose(): <R>(a: R) => R

export default function compose<F extends Function>(f: F): F

/* two functions */
export default function compose<A, T extends any[], R>(
  f1: (a: A) => R,
  f2: Func<T, A>
): Func<T, R>

/* three functions */
export default function compose<A, B, T extends any[], R>(
  f1: (b: B) => R,
  f2: (a: A) => B,
  f3: Func<T, A>
): Func<T, R>

/* four functions */
export default function compose<A, B, C, T extends any[], R>(
  f1: (c: C) => R,
  f2: (b: B) => C,
  f3: (a: A) => B,
  f4: Func<T, A>
): Func<T, R>

/* rest */
export default function compose<R>(
  f1: (a: any) => R,
  ...funcs: Function[]
): (...args: any[]) => R

export default function compose<R>(...funcs: Function[]): (...args: any[]) => R

export default function compose(...funcs: Function[]) {
  if (funcs.length === 0) {
    // 推論で使えるように、引数のタイプを推論する
    return <T>(arg: T) => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce(
    (a, b) =>
      (...args: any) =>
        a(b(...args))
  )
}
