import type { ZodError, ZodType } from 'zod'
import type { LoginBody, RegisterBody } from './auth.js'
import { loginBodySchema, registerBodySchema } from './auth.js'

/** First human-readable message from a Zod failure (for API 400 responses). */
export function firstZodIssueMessage(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue)
    return 'Invalid request body.'
  return issue.message
}

export type ParseBodyResult<T>
  = | { ok: true, value: T }
    | { ok: false, message: string }

function parseBody<T>(schema: ZodType<T>, body: unknown): ParseBodyResult<T> {
  const result = schema.safeParse(body)
  if (!result.success)
    return { ok: false, message: firstZodIssueMessage(result.error) }
  return { ok: true, value: result.data }
}

/** Client-side register validation (same rules as auth-server). */
export function parseRegisterBody(body: unknown): ParseBodyResult<RegisterBody> {
  return parseBody(registerBodySchema, body)
}

/** Client-side login validation (same rules as auth-server). */
export function parseLoginBody(body: unknown): ParseBodyResult<LoginBody> {
  return parseBody(loginBodySchema, body)
}
