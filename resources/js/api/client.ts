import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
})

// ↓ ここから追加: 全 API 呼び出しに横断的にエラーログを残す
apiClient.interceptors.response.use(
  (response) => response,                    // 成功時はそのまま通す
  (error) => {
    // 失敗時のみ実行される
    console.error(
      '[API error]',
      error?.config?.method?.toUpperCase(),
      error?.config?.url,
      error?.response?.status ?? 'no-response'
    )
    // 例外を握り潰さない → 各 catch にも届く
    return Promise.reject(error)
  }
)

export default apiClient