import { hc } from 'hono/client'
import { type AppType } from '../../../backend/src/index'
import { env } from '@/config/env'

export const client = hc<AppType>(env.VITE_API_URL)
