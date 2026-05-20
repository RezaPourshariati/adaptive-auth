import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import errorHandler from './common/errors/error.middleware.js'
import { correlationIdMiddleware } from './common/middleware/correlation-id.middleware.js'
import { requireCsrf } from './common/middleware/csrf.middleware.js'
import { getCorsAllowedOrigins } from './config/cors-origins.js'
import { authRoutes } from './features/auth/index.js'
import { userRoutes } from './features/users/index.js'

const app = express()
const allowedOrigins = getCorsAllowedOrigins()

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))
app.use(correlationIdMiddleware)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', requireCsrf)
app.use('/api/auth', authRoutes)
app.use('/api/users', requireCsrf)
app.use('/api/users', userRoutes)
app.use(errorHandler)

export default app
