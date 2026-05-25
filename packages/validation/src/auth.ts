import { z } from 'zod'

/** Matches auth-server register rules and `RegisterPayload`. */
export const registerBodySchema = z.object({
  name: z.string().trim().min(1, 'Please fill in all required fields.'),
  email: z.string().trim().min(1, 'Please fill in all required fields.').email('Please provide a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters!'),
})

/** Matches auth-server login body and `AuthCredentials`. */
export const loginBodySchema = z.object({
  email: z.string().trim().min(1, 'Please fill in all required fields.'),
  password: z.string().min(1, 'Please fill in all required fields.'),
})

export const changePasswordBodySchema = z.object({
  oldPassword: z.string().min(1, 'Please fill in all required fields.'),
  password: z.string().min(8, 'Password must be at least 8 characters!'),
})

/** Forgot-password request (email only). */
export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().min(1, 'Please fill in all required fields.').email('Please provide a valid email.'),
})

/** Reset-password request (new password). */
export const resetPasswordBodySchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters!'),
})

export type RegisterBody = z.infer<typeof registerBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>
