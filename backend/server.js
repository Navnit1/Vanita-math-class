import 'dotenv/config'
import app from './app.js'
import connectDB from './config/database.js'
import User from './models/User.js'
import logger from './utils/logger.js'

const PORT = process.env.PORT || 5000

// Ensure only ONE administrator exists: navnit with password navnit1
const ensureSoleAdmin = async () => {
  try {
    // Delete any other admin accounts
    await User.deleteMany({ role: 'admin', username: { $ne: 'navnit' } })

    let admin = await User.findOne({ username: 'navnit', role: 'admin' })
    if (!admin) {
      admin = await User.create({
        name: 'Navnit Kumar',
        email: 'navnit@vanitamaths.com',
        username: 'navnit',
        password: 'navnit1',
        role: 'admin',
        status: 'active',
      })
      logger.info('Sole administrator account created: username=navnit, password=navnit1')
    } else {
      admin.password = 'navnit1'
      admin.status = 'active'
      await admin.save()
      logger.info('Sole administrator account verified: username=navnit')
    }
  } catch (err) {
    logger.error('Failed to configure sole administrator account:', err.message)
  }
}

const start = async () => {
  await connectDB()
  await ensureSoleAdmin()
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
