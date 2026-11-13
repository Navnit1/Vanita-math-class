import mongoose from 'mongoose'
import logger from '../utils/logger.js'

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vanita_math_classes'
  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'vanita-maths',
    })
    logger.info(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`)
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected')
})

export default connectDB
