import { createResolveAuthRedirect } from '@adaptive-auth/shared-auth'

export type { AuthStoreForGuard } from '@adaptive-auth/shared-auth'

export const resolveAuthRedirect = createResolveAuthRedirect({
  home: { path: '/' },
  login: { path: '/login' },
  unauthorized: { path: '/unauthorized' },
})
