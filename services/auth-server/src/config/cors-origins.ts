import { config } from './env.js'

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/$/, '')
}

function addOrigin(origins: Set<string>, value: string | undefined) {
  if (!value)
    return
  const normalized = normalizeOrigin(value)
  if (normalized)
    origins.add(normalized)
}

/** Browser origins allowed to call the API with credentials (cookies). */
export function getCorsAllowedOrigins(): string[] {
  const origins = new Set<string>()

  addOrigin(origins, config.clientUrl)
  addOrigin(origins, config.frontendUrl)
  addOrigin(origins, config.nuxtPublicAppUrl)

  if (config.corsOrigins) {
    for (const part of config.corsOrigins.split(','))
      addOrigin(origins, part)
  }

  return [...origins]
}
