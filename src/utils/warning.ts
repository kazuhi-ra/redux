/**
 * 存在する場合は、コンソールに警告を表示します。
 *
 * @param message 警告メッセージです。
 */
export default function warning(message: string): void {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message)
  }
  /* eslint-enable no-console */
  try {
    // このエラーは利便性のために投げられたもので、もしあなたがコンソールで
    // コンソールで "break on all exceptions" を有効にすると、 // この行で実行を一時停止します。
    // この行で実行を一時停止させるためです。
    throw new Error(message)
  } catch (e) {} // eslint-disable-line no-empty
}
