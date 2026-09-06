import { pingDatabase } from '../db/client'

export default defineEventHandler(async () => {
  const database = await pingDatabase()
  return {
    ok: database !== 'down',
    service: 'barbershop',
    database,
  }
})
