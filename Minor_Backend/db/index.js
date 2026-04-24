import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const monngoDB=mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

export default monngoDB;
