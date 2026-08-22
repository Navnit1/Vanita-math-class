import 'dotenv/config'
import app from './app.js'
import connectDB from './config/database.js'
import logger from './utils/logger.js'

const PORT = process.env.PORT || 5000

const start = async () => {
  await connectDB()
  app.listen(PORT, () => {
    logger.info(`🚀 Vanita Maths Classes API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
  })
}

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err)
  process.exit(1)
})

start()
