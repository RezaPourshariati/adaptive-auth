import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const applicationDir = join(dirname(fileURLToPath(import.meta.url)), '../server/application')
const domainDir = join(dirname(fileURLToPath(import.meta.url)), '../server/domain')
const forbidden = /createError|defineEventHandler|H3Event|getCookie|readBody|from ['"]h3['"]|from ['"]nitropack['"]|#imports/

function walkTs(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory())
      return walkTs(path)
    return name.endsWith('.ts') ? [path] : []
  })
}

describe('application and domain layers', () => {
  it('do not import Nitro or H3 APIs', () => {
    const files = [...walkTs(applicationDir), ...walkTs(domainDir)]
    expect(files.length).toBeGreaterThan(0)
    for (const path of files) {
      const source = readFileSync(path, 'utf8')
      expect(source, path).not.toMatch(forbidden)
    }
  })
})
