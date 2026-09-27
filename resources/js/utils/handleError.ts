import { AxiosError } from 'axios'

/**
 * 例外オブジェクトと「何の操作」かを受け取って、ユーザー向けメッセージを返す純粋関数。
 * 「何が失敗したか」は呼び出し側が action として渡し、「なぜ失敗したか」は中で判断する。
 */
export function handleError(e: unknown, action: string): string {
    const reason = (() => {
        if (e instanceof AxiosError) {
        // ネットワーク失敗（response 自体が無い）
            if (!e.response) return 'ネットワーク接続を確認してください'
            // サーバーエラー (5xx)
            if (e.response.status >= 500) return 'サーバーでエラーが発生しました'
            // 4xx 系の汎用
            if (e.response.status >= 400) return 'リクエストに問題があります'
        }
        // axios 以外の予期せぬエラー
        return '予期しないエラーが発生しました'
    })()

    return `${action}に失敗しました（${reason}）`
}