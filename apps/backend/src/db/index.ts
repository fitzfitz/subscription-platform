import { drizzle } from 'drizzle-orm/d1'
import * as schema from '@repo/db'
import { Bindings } from '../types/bindings'

export const createDb = (env: Bindings) => {
  return drizzle(env.DB, { schema })
}
