const mongoose = require('mongoose');

/**
 * MongoDB Connection
 * Compatible with Node 18+ and Mongoose 6–8
 */
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected`);
    console.log(`📦 Host: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);

  } catch (error) {
    console.error('❌ MongoDB connection failed');
    console.error(error.message);
    process.exit(1);
  }
};

/**
 * Global connection event listeners
 * (Attach ONCE, not inside connectDB logic)
 */
mongoose.connection.on('error', err => {
  console.error('MongoDB runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

module.exports = connectDB;
