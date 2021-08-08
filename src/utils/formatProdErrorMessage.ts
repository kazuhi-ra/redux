/**
 * Adapted from React: https://github.com/facebook/react/blob/master/packages/shared/formatProdErrorMessage.js
 *
 * このモジュールを直接要求しないでください。通常の throw エラーコールを使用してください。これらのメッセージは、ビルド時にエラーコードで置き換えられます。
 * ビルド時
 * @param {number} code
 */
function formatProdErrorMessage(code: number) {
  return (
    `Minified Redux error #${code}; visit https://redux.js.org/Errors?code=${code} for the full message or ` +
    'use the non-minified dev environment for full errors. '
  )
}

export default formatProdErrorMessage
