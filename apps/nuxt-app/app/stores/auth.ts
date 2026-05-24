import type { AuthApiError, AuthApiErrorCode } from '@adaptive-auth/shared-auth'
import type {
  AuthCredentials,
  AuthUser,
  ChangePasswordPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from '@adaptive-auth/shared-types'
import { bootstrapSession } from '@adaptive-auth/shared-auth'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    isAuthenticated: false,
    bootstrapLoading: false,
    sessionLoading: false,
    accountLoading: false,
    authChecked: false,
    sessionExpiryCode: null as AuthApiErrorCode | null,
  }),
  getters: {
    hasRole: state => (role: string) => state.user?.role === role,
    isAdmin: state => state.user?.role === 'admin',
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
  },
  actions: {
    clients() {
      const nuxtApp = useNuxtApp()
      return {
        auth: nuxtApp.$authApi,
        users: nuxtApp.$usersApi,
        refreshSession: nuxtApp.$refreshSession as () => Promise<unknown>,
      }
    },
    setUser(user: AuthUser | null) {
      this.user = user
      this.isAuthenticated = Boolean(user)
    },
    clearAuth() {
      this.user = null
      this.isAuthenticated = false
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

      const { auth, users, refreshSession } = this.clients()
      this.bootstrapLoading = true
      try {
        const { user, sessionExpiryCode } = await bootstrapSession({
          refreshSession,
          getLoginStatus: auth.getLoginStatus,
          getCurrentUser: users.getCurrentUser,
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
      const { auth } = this.clients()
      this.sessionLoading = true
      try {
        const user = await auth.login(credentials)
        this.setUser(user)
        this.clearSessionExpiryCode()
      }
      catch (error) {
        const authError = error as AuthApiError
        if (authError?.code === 'ACCOUNT_SUSPENDED' || authError?.message?.includes('suspended')) {
          this.clearAuth()
          this.setSessionExpiryCode('ACCOUNT_SUSPENDED')
        }
        throw error
      }
      finally {
        this.sessionLoading = false
      }
    },
    async register(payload: RegisterPayload) {
      const { auth } = this.clients()
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
    async updateUser(payload: UpdateProfilePayload) {
      const { users } = this.clients()
      this.accountLoading = true
      try {
        const user = await users.updateUser(payload)
        this.setUser(user)
        return user
      }
      finally {
        this.accountLoading = false
      }
    },
    async sendVerificationEmail() {
      const { auth } = this.clients()
      this.accountLoading = true
      try {
        return await auth.sendVerificationEmail()
      }
      finally {
        this.accountLoading = false
      }
    },
    async changePassword(payload: ChangePasswordPayload) {
      const { auth } = this.clients()
      this.accountLoading = true
      try {
        return await auth.changePassword(payload)
      }
      finally {
        this.accountLoading = false
      }
    },
    async logout() {
      const { auth } = this.clients()
      this.sessionLoading = true
      try {
        await auth.logout()
      }
      finally {
        this.clearAuth()
        this.sessionLoading = false
        useUsersStore().clearList()
      }
    },
  },
})
