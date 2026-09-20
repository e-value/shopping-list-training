import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      '[API error]',
      error?.config?.method?.toUpperCase(),
      error?.config?.url,
      error?.response?.status ?? 'no-response'
    )
    return Promise.reject(error)
  }
)

export default apiClient
