import { DomainError } from '../rules'

export function schedulingError(code: string, message: string): never {
  throw new DomainError(message, code)
}

export function isPostgresExclusionViolation(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === '23P01'
}
