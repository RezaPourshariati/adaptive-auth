import type { AuthUser, UpgradeUserPayload } from '@/shared/types'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/features/auth/store/auth.store'
import * as usersService from '@/features/users/api/users.api'

/** Admin / author user-directory operations (separate from session identity in `useAuthStore`). */
export const useUsersStore = defineStore('users', {
  state: () => ({
    list: [] as AuthUser[],
    loading: false,
  }),
  actions: {
    clearList() {
      this.list = []
    },
    async fetchUsers() {
      this.loading = true
      try {
        const users = await usersService.getUsers()
        this.list = users
        return users
      }
      finally {
        this.loading = false
      }
    },
    async removeUser(id: string) {
      this.loading = true
      try {
        const result = await usersService.deleteUser(id)
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
        const result = await usersService.upgradeUser(payload)
        this.list = this.list.map((user) => {
          if (user._id === payload.id)
            return { ...user, role: payload.role }
          return user
        })
        const authStore = useAuthStore()
        if (authStore.user?._id === payload.id)
          authStore.setUser({ ...authStore.user, role: payload.role })
        return result
      }
      finally {
        this.loading = false
      }
    },
  },
})
