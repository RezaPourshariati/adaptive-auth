import type { ZodError } from 'zod'

/** First human-readable message from a Zod failure (for API 400 responses). */
export function firstZodIssueMessage(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue)
    return 'Invalid request body.'
  return issue.message
}
