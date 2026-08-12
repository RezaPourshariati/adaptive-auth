import type { AuthApiError, AuthApiErrorCode } from '@adaptive-auth/shared-auth'
import type {
  AuthCredentials,
  AuthUser,
  ChangePasswordPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from '@/shared/types'
import { bootstrapSession } from '@adaptive-auth/shared-auth'
import { defineStore } from 'pinia'
import * as usersService from '@/features/users/api/users.api'
import { auth, refreshSession } from '../api/auth.api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    isAuthenticated: false,
    bootstrapLoading: false,
    sessionLoading: false,
    accountLoading: false,
    authChecked: false,
    pendingLoginCodeEmail: '' as string,
    sessionExpiryCode: null as AuthApiErrorCode | null,
  }),
  getters: {
    roles: state => (state.user?.role ? [state.user.role] : []),
    hasRole: state => (role: string) => state.user?.role === role,
    /** True while any auth operation is in flight (avoid for form buttons — use scoped flags). */
    isLoading(state): boolean {
      return state.bootstrapLoading || state.sessionLoading || state.accountLoading
    },
    isBootstrapLoading: state => state.bootstrapLoading,
    isSessionLoading: state => state.sessionLoading,
    isAccountLoading: state => state.accountLoading,
    sessionExpiryMessage(state): string {
      if (state.sessionExpiryCode === 'SESSION_IDLE_EXPIRED')
        return 'You were inactive for too long. Please log in again.'
      if (state.sessionExpiryCode === 'SESSION_ABSOLUTE_EXPIRED')
        return 'Your maximum session time has ended. Please log in again.'
      if (state.sessionExpiryCode === 'ACCOUNT_SUSPENDED')
        return 'Your account has been suspended. Please contact support.'
      return ''
    },
    isAdmin(): boolean {
      return this.hasRole('admin')
    },
  },
  actions: {
    setUser(user: AuthUser | null) {
      this.user = user
      this.isAuthenticated = Boolean(user)
    },
    clearAuth() {
      this.user = null
      this.isAuthenticated = false
      this.pendingLoginCodeEmail = ''
    },
    clearSessionExpiryCode() {
      this.sessionExpiryCode = null
    },
    setSessionExpiryCode(code?: AuthApiErrorCode) {
      this.sessionExpiryCode = code || null
    },
    async bootstrapAuth() {
      if (this.authChecked)
        return

      this.bootstrapLoading = true
      try {
        const { user, sessionExpiryCode } = await bootstrapSession({
          refreshSession,
          getLoginStatus: auth.getLoginStatus,
          getCurrentUser: usersService.getCurrentUser,
        })
        if (sessionExpiryCode) {
          this.setSessionExpiryCode(sessionExpiryCode)
          this.clearAuth()
          return
        }
        if (user) {
          this.setUser(user)
          this.clearSessionExpiryCode()
        }
        else {
          this.clearAuth()
        }
      }
      catch {
        this.clearAuth()
      }
      finally {
        this.authChecked = true
        this.bootstrapLoading = false
      }
    },
    async login(credentials: AuthCredentials) {
      this.sessionLoading = true
      try {
        const user = await auth.login(credentials)
        this.setUser(user)
        this.clearSessionExpiryCode()
        this.pendingLoginCodeEmail = ''
      }
      catch (error) {
        const authError = error as AuthApiError
        if (authError?.code === 'ACCOUNT_SUSPENDED' || authError?.message?.includes('suspended')) {
          this.clearAuth()
          this.setSessionExpiryCode('ACCOUNT_SUSPENDED')
        }
        const message = error instanceof Error ? error.message : ''
        if (message.includes('New browser or device detected')) {
          this.pendingLoginCodeEmail = credentials.email
        }
        throw error
      }
      finally {
        this.sessionLoading = false
      }
    },
    async register(payload: RegisterPayload) {
      this.sessionLoading = true
      try {
        const user = await auth.register(payload)
        this.setUser(user)
        this.clearSessionExpiryCode()
      }
      finally {
        this.sessionLoading = false
      }
    },
    async sendLoginCode(email: string) {
      this.sessionLoading = true
      try {
        await auth.sendLoginCode(email)
      }
      finally {
        this.sessionLoading = false
      }
    },
    async loginWithCode(email: string, loginCode: string) {
      this.sessionLoading = true
      try {
        const user = await auth.loginWithCode(email, loginCode)
        this.setUser(user)
        this.clearSessionExpiryCode()
        this.pendingLoginCodeEmail = ''
      }
      finally {
        this.sessionLoading = false
      }
    },
    async forgotPassword(email: string) {
      this.accountLoading = true
      try {
        return await auth.forgotPassword(email)
      }
      finally {
        this.accountLoading = false
      }
    },
    async resetPassword(resetToken: string, password: string) {
      this.accountLoading = true
      try {
        return await auth.resetPassword(resetToken, password)
      }
      finally {
        this.accountLoading = false
      }
    },
    async updateUser(payload: UpdateProfilePayload) {
      this.accountLoading = true
      try {
        const user = await usersService.updateUser(payload)
        this.setUser(user)
        return user
      }
      finally {
        this.accountLoading = false
      }
    },
    async sendVerificationEmail() {
      this.accountLoading = true
      try {
        return await auth.sendVerificationEmail()
      }
      finally {
        this.accountLoading = false
      }
    },
    async verifyUser(verificationToken: string) {
      this.accountLoading = true
      try {
        return await auth.verifyUser(verificationToken)
      }
      finally {
        this.accountLoading = false
      }
    },
    async changePassword(payload: ChangePasswordPayload) {
      this.accountLoading = true
      try {
        return await auth.changePassword(payload)
      }
      finally {
        this.accountLoading = false
      }
    },
    async logout() {
      this.sessionLoading = true
      try {
        await auth.logout()
      }
      finally {
        this.clearAuth()
        this.sessionLoading = false
        void import('@/features/users/store/users.store').then(({ useUsersStore }) => {
          useUsersStore().clearList()
        })
      }
    },
  },
})
