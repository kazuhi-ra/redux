/**
 * これらはReduxが予約しているプライベートアクションタイプです。
 * 未知のアクションの場合は、現在の状態を返さなければなりません。
 * 現在の状態が未定義の場合は、初期状態を返す必要があります。
 * コード内でこれらのアクションタイプを直接参照しないでください。
 */

const randomString = () =>
  Math.random().toString(36).substring(7).split('').join('.')

const ActionTypes = {
  INIT: `@@redux/INIT${/* #__PURE__ */ randomString()}`,
  REPLACE: `@@redux/REPLACE${/* #__PURE__ */ randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
}

export default ActionTypes
