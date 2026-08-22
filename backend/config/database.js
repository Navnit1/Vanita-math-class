import mongoose from 'mongoose'
import logger from '../utils/logger.js'

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'vanita-maths',
    })
    logger.info(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected')
})

export default connectDB
