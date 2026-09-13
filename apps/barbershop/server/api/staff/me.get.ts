import { requireStaff } from '../../utils/staff-auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  return { user }
})
