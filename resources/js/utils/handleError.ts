import { AxiosError } from 'axios'

export function handleError(e: unknown, action: string): string {
  const reason = (() => {
    if (e instanceof AxiosError) {
      if (!e.response) return 'ネットワーク接続を確認してください'
      if (e.response.status >= 500) return 'サーバーでエラーが発生しました'
      if (e.response.status >= 400) return 'リクエストに問題があります'
    }
    return '予期しないエラーが発生しました'
  })()

  return `${action}に失敗しました（${reason}）`
}
