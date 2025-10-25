import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongodbUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000
  });
  console.log('✅ MongoDB connected');
}
