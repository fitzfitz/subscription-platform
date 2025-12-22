import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const errorHandler = async (err: Error, c: Context) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  // eslint-disable-next-line no-console
  console.error(err)
  return c.json({ error: 'Internal Server Error', message: err.message }, 500)
}
