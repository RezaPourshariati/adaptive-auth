import { DomainError } from '../domain/rules'

const STATUS_BY_CODE: Record<string, number> = {
  BUSINESS_NOT_FOUND: 404,
  SERVICE_NOT_FOUND: 404,
  STAFF_NOT_FOUND: 404,
  APPOINTMENT_NOT_FOUND: 404,
  CALENDAR_BLOCK_NOT_FOUND: 404,
  SERVICE_INACTIVE: 409,
  STAFF_INACTIVE: 409,
  STAFF_NOT_ELIGIBLE: 409,
  OUTSIDE_WORKING_HOURS: 409,
  SLOT_UNAVAILABLE: 409,
  CALENDAR_BLOCKED: 409,
  APPOINTMENT_ALREADY_CANCELLED: 409,
  CALENDAR_BLOCK_ALREADY_CANCELLED: 409,
  INVALID_APPOINTMENT: 409,
}

export function throwDomain(error: unknown): never {
  if (error instanceof DomainError) {
    throw createError({
      statusCode: STATUS_BY_CODE[error.code] ?? 400,
      statusMessage: error.message,
      data: { code: error.code },
    })
  }
  throw error
}

export function badRequest(message: string, code = 'BAD_REQUEST'): never {
  throw createError({ statusCode: 400, statusMessage: message, data: { code } })
}

export function unauthorized(message = 'Please sign in.'): never {
  throw createError({ statusCode: 401, statusMessage: message })
}

export function notFound(message = 'Not found.'): never {
  throw createError({ statusCode: 404, statusMessage: message })
}
