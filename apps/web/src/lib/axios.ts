import axios from 'axios'
import { env } from '@/config/env'

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling (e.g. 401 redirect)
    return Promise.reject(error)
  },
)
