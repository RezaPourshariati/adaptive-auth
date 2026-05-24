import type { AuthUser, UpgradeUserPayload } from '@adaptive-auth/shared-types'
import { defineStore } from 'pinia'

export const useUsersStore = defineStore('users', {
  state: () => ({
    list: [] as AuthUser[],
    loading: false,
  }),
  actions: {
    clearList() {
      this.list = []
    },
    clients() {
      const nuxtApp = useNuxtApp()
      return nuxtApp.$usersApi
    },
    async fetchUsers() {
      this.loading = true
      try {
        this.list = await this.clients().getUsers()
        return this.list
      }
      finally {
        this.loading = false
      }
    },
    async removeUser(id: string) {
      this.loading = true
      try {
        const result = await this.clients().deleteUser(id)
        this.list = this.list.filter(user => user._id !== id)
        return result
      }
      finally {
        this.loading = false
      }
    },
    async upgradeRole(payload: UpgradeUserPayload) {
      this.loading = true
      try {
        const result = await this.clients().upgradeUser(payload)
        this.list = this.list.map((user) => {
          if (user._id === payload.id)
            return { ...user, role: payload.role }
          return user
        })
        const auth = useAuthStore()
        if (auth.user?._id === payload.id)
          auth.setUser({ ...auth.user, role: payload.role })
        return result
      }
      finally {
        this.loading = false
      }
    },
  },
})
